<?php

declare(strict_types=1);

// Render both emails with sample data: php server/contact/bin/preview.php <out-dir>

require __DIR__ . '/../vendor/autoload.php';

$out = rtrim($argv[1] ?? sys_get_temp_dir(), '/');
$config = ['site_url' => 'https://getmartis.com', 'team_recipient' => 'support@getmartis.com'];
$enquiry = [
    'name' => 'Ana Ribeiro',
    'email' => 'ana@northwind.studio',
    'company' => 'Northwind Studio',
    'message' => "Hi! We deliver around a dozen Laravel admin panels a year for clients and keep rebuilding the same CRUD, roles and audit screens.\n\nCould Martis replace our internal starter kit? We mostly need multi-tenant resources and a custom theme per client.",
    'source' => 'prompt',
    'page' => '/for-agencies',
];

file_put_contents("{$out}/team.html", contact_render_team($enquiry, $config, new DateTimeImmutable('now', new DateTimeZone('Europe/Lisbon'))));
file_put_contents("{$out}/confirmation.html", contact_render_confirmation($enquiry, $config));
echo "{$out}/team.html\n{$out}/confirmation.html\n";
