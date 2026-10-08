<?php

declare(strict_types=1);

/*
 * Contact form delivery for getmartis.com.
 *
 * The static site posts JSON to /api/contact.php, which hands the request
 * to contact_handle(). A valid enquiry produces two emails over SMTP: a
 * notification to the Martis team (Reply-To set to the sender) and a
 * confirmation to the sender. Configuration (SMTP credentials included)
 * lives outside the web root and is never committed; see
 * config.example.php.
 */

use PHPMailer\PHPMailer\Exception as MailerException;
use PHPMailer\PHPMailer\PHPMailer;

const CONTACT_MAX_BODY_BYTES = 16384;
const CONTACT_SOURCES = ['contact-page' => 'Contact page', 'prompt' => 'Website prompt'];

final class ContactConfigException extends RuntimeException {}

final class ContactResponse
{
    /** @param array<string, mixed> $body */
    public function __construct(public readonly int $status, public readonly array $body) {}
}

/**
 * Load and check the configuration. A missing or malformed key throws and
 * names the key: a half-configured mailer must fail loudly, not drop mail.
 *
 * @return array<string, mixed>
 */
function contact_load_config(string $path): array
{
    if (!is_file($path)) {
        throw new ContactConfigException("Contact config file not found: {$path}");
    }
    $config = require $path;
    if (!is_array($config)) {
        throw new ContactConfigException("Contact config must return an array: {$path}");
    }

    $transport = $config['transport'] ?? null;
    if (!in_array($transport, ['smtp', 'log'], true)) {
        throw new ContactConfigException("Contact config key 'transport' must be 'smtp' or 'log'.");
    }
    if ($transport === 'smtp') {
        foreach (['host', 'port', 'encryption', 'username', 'password'] as $key) {
            if (empty($config['smtp'][$key])) {
                throw new ContactConfigException("Contact config key 'smtp.{$key}' is missing or empty.");
            }
        }
        if (!in_array($config['smtp']['encryption'], ['ssl', 'tls'], true)) {
            throw new ContactConfigException("Contact config key 'smtp.encryption' must be 'ssl' or 'tls'.");
        }
    }
    foreach (['from.address', 'from.name', 'team_recipient', 'site_url', 'storage_path'] as $key) {
        if (contact_config_value($config, $key) === null || contact_config_value($config, $key) === '') {
            throw new ContactConfigException("Contact config key '{$key}' is missing or empty.");
        }
    }
    foreach (['from.address', 'team_recipient'] as $key) {
        if (!filter_var(contact_config_value($config, $key), FILTER_VALIDATE_EMAIL)) {
            throw new ContactConfigException("Contact config key '{$key}' is not a valid email address.");
        }
    }
    if (empty($config['allowed_origins']) || !is_array($config['allowed_origins'])) {
        throw new ContactConfigException("Contact config key 'allowed_origins' must be a non-empty list.");
    }
    $limit = $config['rate_limit'] ?? null;
    if (!is_array($limit) || (int) ($limit['per_ip'] ?? 0) < 1 || (int) ($limit['window_seconds'] ?? 0) < 1) {
        throw new ContactConfigException("Contact config key 'rate_limit' needs positive 'per_ip' and 'window_seconds'.");
    }

    $storage = rtrim((string) $config['storage_path'], '/');
    if (!is_dir($storage) && !@mkdir($storage, 0700, true) && !is_dir($storage)) {
        throw new ContactConfigException("Contact config key 'storage_path' is not a writable directory: {$storage}");
    }
    $config['storage_path'] = $storage;

    return $config;
}

function contact_config_value(array $config, string $dotted): mixed
{
    $value = $config;
    foreach (explode('.', $dotted) as $segment) {
        if (!is_array($value) || !array_key_exists($segment, $value)) {
            return null;
        }
        $value = $value[$segment];
    }

    return $value;
}

/**
 * @param array<string, string> $server  $_SERVER-like values
 * @param array<string, mixed>  $config
 * @param callable(PHPMailer): void|null $send  Delivery override for tests.
 */
function contact_handle(array $server, string $rawBody, array $config, ?callable $send = null): ContactResponse
{
    if (($server['REQUEST_METHOD'] ?? '') !== 'POST') {
        return new ContactResponse(405, ['error' => 'method_not_allowed']);
    }

    $origin = $server['HTTP_ORIGIN'] ?? '';
    if (!in_array($origin, $config['allowed_origins'], true)) {
        return new ContactResponse(403, ['error' => 'origin_not_allowed']);
    }
    if (!str_starts_with(strtolower($server['CONTENT_TYPE'] ?? ''), 'application/json')) {
        return new ContactResponse(415, ['error' => 'unsupported_media_type']);
    }
    if (strlen($rawBody) > CONTACT_MAX_BODY_BYTES) {
        return new ContactResponse(413, ['error' => 'payload_too_large']);
    }

    $input = json_decode($rawBody, true);
    if (!is_array($input)) {
        return new ContactResponse(400, ['error' => 'invalid_json']);
    }

    // Bots fill the hidden field. Answer as if delivered so they learn nothing.
    if (trim((string) ($input['website'] ?? '')) !== '') {
        contact_log($config, 'honeypot', $server);

        return new ContactResponse(200, ['ok' => true]);
    }

    [$enquiry, $errors] = contact_validate($input);
    if ($errors) {
        return new ContactResponse(422, ['error' => 'invalid', 'fields' => $errors]);
    }

    if (!contact_rate_limit_allows($config, $server['REMOTE_ADDR'] ?? 'unknown')) {
        contact_log($config, 'rate_limited', $server);

        return new ContactResponse(429, ['error' => 'too_many_requests']);
    }

    $send ??= static fn (PHPMailer $mail) => contact_deliver($mail, $config);
    $receivedAt = new DateTimeImmutable('now', new DateTimeZone('Europe/Lisbon'));

    try {
        $send(contact_team_mail($enquiry, $config, $receivedAt));
    } catch (Throwable $error) {
        contact_log($config, 'team_mail_failed', $server, $error->getMessage());

        return new ContactResponse(502, ['error' => 'delivery_failed']);
    }

    // The enquiry reached the team; a failed confirmation must not report
    // the whole submission as lost.
    try {
        $send(contact_confirmation_mail($enquiry, $config));
    } catch (Throwable $error) {
        contact_log($config, 'confirmation_mail_failed', $server, $error->getMessage());
    }

    contact_log($config, 'delivered', $server);

    return new ContactResponse(200, ['ok' => true]);
}

/**
 * @param array<string, mixed> $input
 * @return array{0: array<string, string>, 1: array<string, string>}
 */
function contact_validate(array $input): array
{
    $line = static fn (mixed $value): string => trim(preg_replace('/[\r\n\t]+/', ' ', is_string($value) ? $value : '') ?? '');
    $enquiry = [
        'name' => $line($input['name'] ?? ''),
        'email' => $line($input['email'] ?? ''),
        'company' => $line($input['company'] ?? ''),
        'message' => trim(str_replace("\r\n", "\n", is_string($input['message'] ?? null) ? $input['message'] : '')),
        'source' => is_string($input['source'] ?? null) && isset(CONTACT_SOURCES[$input['source']]) ? $input['source'] : 'contact-page',
        'page' => $line($input['page'] ?? ''),
    ];

    $errors = [];
    if ($enquiry['name'] === '' || mb_strlen($enquiry['name']) > 120) {
        $errors['name'] = 'Enter your name.';
    }
    if (mb_strlen($enquiry['email']) > 254 || !filter_var($enquiry['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Enter a valid email address.';
    }
    if (mb_strlen($enquiry['company']) > 160) {
        $errors['company'] = 'Keep the company name under 160 characters.';
    }
    $length = mb_strlen($enquiry['message']);
    if ($length < 10) {
        $errors['message'] = 'Tell us a little more.';
    } elseif ($length > 5000) {
        $errors['message'] = 'Keep the message under 5000 characters.';
    }
    if (($input['consent'] ?? null) !== true) {
        $errors['consent'] = 'Confirm that we may use these details to reply.';
    }
    // Only keep a same-site path; anything else is dropped, not rejected.
    if (!preg_match('#^/[A-Za-z0-9/_\-.]{0,200}$#', $enquiry['page'])) {
        $enquiry['page'] = '';
    }

    return [$enquiry, $errors];
}

/** Sliding window per hashed client address, kept in a flock-guarded JSON file. */
function contact_rate_limit_allows(array $config, string $address): bool
{
    $file = $config['storage_path'] . '/rate-limit.json';
    $handle = fopen($file, 'c+');
    if ($handle === false) {
        throw new ContactConfigException("Contact storage is not writable: {$file}");
    }

    try {
        flock($handle, LOCK_EX);
        $state = json_decode(stream_get_contents($handle) ?: '{}', true);
        $state = is_array($state) ? $state : [];

        $now = time();
        $window = (int) $config['rate_limit']['window_seconds'];
        foreach ($state as $key => $hits) {
            $state[$key] = array_values(array_filter((array) $hits, static fn ($at) => is_int($at) && $at > $now - $window));
            if (!$state[$key]) {
                unset($state[$key]);
            }
        }

        $key = hash('sha256', $address);
        $allowed = count($state[$key] ?? []) < (int) $config['rate_limit']['per_ip'];
        if ($allowed) {
            $state[$key][] = $now;
        }

        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($state));
        fflush($handle);

        return $allowed;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

/** Log the event only: never the message body or the sender's details. */
function contact_log(array $config, string $event, array $server, string $detail = ''): void
{
    $line = sprintf(
        "%s %s ip=%s%s\n",
        gmdate('c'),
        $event,
        substr(hash('sha256', $server['REMOTE_ADDR'] ?? 'unknown'), 0, 12),
        $detail === '' ? '' : ' ' . preg_replace('/\s+/', ' ', $detail),
    );
    @file_put_contents($config['storage_path'] . '/contact.log', $line, FILE_APPEND | LOCK_EX);
}

function contact_new_mail(array $config): PHPMailer
{
    $mail = new PHPMailer(true);
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->Encoding = PHPMailer::ENCODING_QUOTED_PRINTABLE;
    $mail->setFrom($config['from']['address'], $config['from']['name']);
    $mail->isHTML(true);

    return $mail;
}

/** @param array<string, string> $enquiry */
function contact_team_mail(array $enquiry, array $config, DateTimeImmutable $receivedAt): PHPMailer
{
    $mail = contact_new_mail($config);
    $mail->addAddress($config['team_recipient']);
    $mail->addReplyTo($enquiry['email'], $enquiry['name']);
    $mail->Subject = sprintf('New enquiry from %s%s', $enquiry['name'], $enquiry['company'] !== '' ? " ({$enquiry['company']})" : '');
    $mail->Body = contact_render_team($enquiry, $config, $receivedAt);
    $mail->AltBody = contact_team_text($enquiry, $config, $receivedAt);

    return $mail;
}

/** @param array<string, string> $enquiry */
function contact_confirmation_mail(array $enquiry, array $config): PHPMailer
{
    $mail = contact_new_mail($config);
    $mail->addAddress($enquiry['email'], $enquiry['name']);
    $mail->addReplyTo($config['team_recipient'], $config['from']['name']);
    $mail->addCustomHeader('Auto-Submitted', 'auto-replied');
    $mail->Subject = 'We received your message | Martis';
    $mail->Body = contact_render_confirmation($enquiry, $config);
    $mail->AltBody = contact_confirmation_text($enquiry, $config);

    return $mail;
}

/** @throws MailerException */
function contact_deliver(PHPMailer $mail, array $config): void
{
    if ($config['transport'] === 'log') {
        $mail->preSend();
        $file = sprintf('%s/outbox/%s-%s.eml', $config['storage_path'], gmdate('Ymd-His'), bin2hex(random_bytes(4)));
        @mkdir(dirname($file), 0700, true);
        file_put_contents($file, $mail->getSentMIMEMessage());

        return;
    }

    $smtp = $config['smtp'];
    $mail->isSMTP();
    $mail->Host = $smtp['host'];
    $mail->Port = (int) $smtp['port'];
    $mail->SMTPAuth = true;
    $mail->SMTPSecure = $smtp['encryption'] === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Username = $smtp['username'];
    $mail->Password = $smtp['password'];
    $mail->Timeout = 15;
    $mail->send();
}

function contact_e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function contact_first_name(string $name): string
{
    return explode(' ', trim($name))[0] ?: $name;
}

/** @param array<string, string> $enquiry */
function contact_render_team(array $enquiry, array $config, DateTimeImmutable $receivedAt): string
{
    return contact_render('team', [
        'enquiry' => $enquiry,
        'site' => rtrim($config['site_url'], '/'),
        'source' => CONTACT_SOURCES[$enquiry['source']],
        'receivedAt' => $receivedAt,
    ]);
}

/** @param array<string, string> $enquiry */
function contact_render_confirmation(array $enquiry, array $config): string
{
    return contact_render('confirmation', [
        'enquiry' => $enquiry,
        'site' => rtrim($config['site_url'], '/'),
        'support' => $config['team_recipient'],
    ]);
}

/** @param array<string, mixed> $data */
function contact_render(string $template, array $data): string
{
    extract($data, EXTR_SKIP);
    ob_start();
    require __DIR__ . "/../templates/{$template}.php";

    return (string) ob_get_clean();
}

/** @param array<string, string> $enquiry */
function contact_team_text(array $enquiry, array $config, DateTimeImmutable $receivedAt): string
{
    $lines = [
        'New enquiry from getmartis.com',
        '',
        "Name:     {$enquiry['name']}",
        "Email:    {$enquiry['email']}",
        'Company:  ' . ($enquiry['company'] !== '' ? $enquiry['company'] : '-'),
        'Source:   ' . CONTACT_SOURCES[$enquiry['source']] . ($enquiry['page'] !== '' ? " ({$enquiry['page']})" : ''),
        'Received: ' . $receivedAt->format('j M Y, H:i T'),
        '',
        'Message:',
        $enquiry['message'],
        '',
        "Reply to this email to answer {$enquiry['name']} directly.",
    ];

    return implode("\n", $lines);
}

/** @param array<string, string> $enquiry */
function contact_confirmation_text(array $enquiry, array $config): string
{
    $site = rtrim($config['site_url'], '/');
    $lines = [
        'Thanks, ' . contact_first_name($enquiry['name']) . '. We have your message.',
        '',
        'A person from the Martis team reads every message and will reply to this address, usually within one or two business days.',
        '',
        'Your message:',
        $enquiry['message'],
        '',
        'While you wait:',
        "- Installation guide: {$site}/docs/getting-started/installation",
        "- Quick start: {$site}/docs/getting-started/quick-start",
        "- Martis compared with Nova: {$site}/compare",
        '',
        'Want to add something? Just reply to this email.',
        '',
        'The Martis team',
        $site,
    ];

    return implode("\n", $lines);
}
