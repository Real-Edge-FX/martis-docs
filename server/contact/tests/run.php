<?php

declare(strict_types=1);

// Dependency-free checks for the contact handler: php server/contact/tests/run.php

require __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;

$failures = 0;
function check(string $name, bool $passed): void
{
    global $failures;
    echo ($passed ? '  ok   ' : '  FAIL ') . $name . PHP_EOL;
    $failures += $passed ? 0 : 1;
}

$storage = sys_get_temp_dir() . '/martis-contact-test-' . bin2hex(random_bytes(4));
$configFile = $storage . '-config.php';
file_put_contents($configFile, '<?php return ' . var_export([
    'transport' => 'log',
    'from' => ['address' => 'support@getmartis.com', 'name' => 'Martis'],
    'team_recipient' => 'support@getmartis.com',
    'site_url' => 'https://getmartis.com',
    'allowed_origins' => ['https://getmartis.com'],
    'storage_path' => $storage,
    'rate_limit' => ['per_ip' => 2, 'window_seconds' => 3600],
], true) . ';');
$config = contact_load_config($configFile);

$server = ['REQUEST_METHOD' => 'POST', 'HTTP_ORIGIN' => 'https://getmartis.com', 'CONTENT_TYPE' => 'application/json', 'REMOTE_ADDR' => '203.0.113.7'];
$valid = ['name' => 'Ana <b>Silva</b>', 'email' => 'ana@example.com', 'company' => 'Studio', 'message' => "Hello <script>x</script>\nSecond line", 'consent' => true, 'website' => '', 'source' => 'prompt', 'page' => '/product'];

$sent = [];
$capture = function (PHPMailer $mail) use (&$sent) { $sent[] = $mail; };

$response = contact_handle($server, json_encode($valid), $config, $capture);
check('valid enquiry returns 200', $response->status === 200);
check('two emails are sent', count($sent) === 2);
[$team, $confirmation] = $sent + [null, null];
check('team mail goes to the support mailbox', $team && $team->getToAddresses()[0][0] === 'support@getmartis.com');
check('team mail replies to the sender', $team && array_key_exists('ana@example.com', $team->getReplyToAddresses()));
check('confirmation goes to the sender', $confirmation && $confirmation->getToAddresses()[0][0] === 'ana@example.com');
check('html escapes the sender input', $team && !str_contains($team->Body, '<script>') && str_contains($team->Body, '&lt;script&gt;'));
check('message keeps its line breaks', $team && str_contains($team->Body, 'x&lt;/script&gt;<br>'));
check('source page links back to the site', $team && str_contains($team->Body, 'https://getmartis.com/product'));
check('confirmation carries the auto-reply header', $confirmation && str_contains($confirmation->createHeader() . implode('', array_map(fn ($h) => implode(': ', $h), $confirmation->getCustomHeaders())), 'Auto-Submitted: auto-replied'));

$sent = [];
check('rate limit allows the second request', contact_handle($server, json_encode($valid), $config, $capture)->status === 200);
check('rate limit refuses the third request', contact_handle($server, json_encode($valid), $config, $capture)->status === 429);

$other = ['REMOTE_ADDR' => '198.51.100.9'] + $server;
$sent = [];
check('honeypot answers 200 without sending', contact_handle($other, json_encode(['website' => 'spam'] + $valid), $config, $capture)->status === 200 && $sent === []);
check('foreign origin is refused', contact_handle(['HTTP_ORIGIN' => 'https://evil.test'] + $other, json_encode($valid), $config, $capture)->status === 403);
check('GET is refused', contact_handle(['REQUEST_METHOD' => 'GET'] + $other, '', $config, $capture)->status === 405);
check('form-encoded body is refused', contact_handle(['CONTENT_TYPE' => 'application/x-www-form-urlencoded'] + $other, 'a=b', $config, $capture)->status === 415);
$invalid = contact_handle($other, json_encode(['email' => 'nope', 'consent' => 'yes', 'message' => 'short'] + $valid), $config, $capture);
check('invalid fields return 422 with each field', $invalid->status === 422 && array_keys($invalid->body['fields']) === ['email', 'message', 'consent']);
[$cleaned] = contact_validate(['name' => "Eve\r\nBcc: x@y.z", 'page' => 'https://evil.test'] + $valid);
check('header-breaking characters are flattened', !str_contains($cleaned['name'], "\n"));
check('off-site page values are dropped', $cleaned['page'] === '');

$failing = function (PHPMailer $mail) { throw new RuntimeException('SMTP down'); };
check('team delivery failure returns 502', contact_handle(['REMOTE_ADDR' => '192.0.2.1'] + $server, json_encode($valid), $config, $failing)->status === 502);
$calls = 0;
$confirmationFails = function (PHPMailer $mail) use (&$calls) { if (++$calls === 2) { throw new RuntimeException('bounce'); } };
check('confirmation failure still returns 200', contact_handle(['REMOTE_ADDR' => '192.0.2.2'] + $server, json_encode($valid), $config, $confirmationFails)->status === 200);
check('log never records the message body', !str_contains((string) file_get_contents($storage . '/contact.log'), 'Second line'));

$sent = [];
contact_deliver(contact_team_mail(contact_validate($valid)[0], $config, new DateTimeImmutable()), $config);
check('log transport writes an .eml file', count(glob($storage . '/outbox/*.eml')) === 1);

file_put_contents($configFile, '<?php return ["transport" => "smtp", "smtp" => ["host" => "smtp.hostinger.com"]];');
try {
    contact_load_config($configFile);
    check('incomplete smtp config throws', false);
} catch (ContactConfigException $error) {
    check('incomplete smtp config throws and names the key', str_contains($error->getMessage(), "'smtp.port'"));
}

echo $failures === 0 ? "All contact checks passed.\n" : "{$failures} contact check(s) failed.\n";
exit($failures === 0 ? 0 : 1);
