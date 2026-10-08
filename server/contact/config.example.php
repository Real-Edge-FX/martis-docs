<?php

/*
 * Copy to domains/getmartis.com/private/contact-config.php on the server
 * (outside public_html, chmod 600). The SMTP password of the
 * support@getmartis.com mailbox goes in contact-smtp-password next to it
 * (chmod 600). Never commit either file.
 */

return [
    // 'smtp' sends through the mailbox; 'log' writes .eml files to
    // storage_path/outbox instead (local testing only).
    'transport' => 'smtp',
    'smtp' => [
        'host' => 'smtp.hostinger.com',
        'port' => 465,
        'encryption' => 'ssl',
        'username' => 'support@getmartis.com',
        'password' => trim((string) @file_get_contents(__DIR__ . '/contact-smtp-password')),
    ],
    'from' => ['address' => 'support@getmartis.com', 'name' => 'Martis'],
    'team_recipient' => 'support@getmartis.com',
    'site_url' => 'https://getmartis.com',
    'allowed_origins' => ['https://getmartis.com', 'https://www.getmartis.com'],
    'storage_path' => __DIR__ . '/contact-storage',
    'rate_limit' => ['per_ip' => 5, 'window_seconds' => 3600],
];
