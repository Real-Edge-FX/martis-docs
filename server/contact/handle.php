<?php

declare(strict_types=1);

/*
 * Web entry for the contact endpoint, required by public/api/contact.php.
 * The config lives outside the web root (MARTIS_CONTACT_CONFIG overrides
 * the default path for local runs).
 */

require __DIR__ . '/vendor/autoload.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    $config = contact_load_config(getenv('MARTIS_CONTACT_CONFIG') ?: dirname(__DIR__) . '/private/contact-config.php');
    $response = contact_handle($_SERVER, (string) file_get_contents('php://input'), $config);
} catch (Throwable $error) {
    error_log('[martis-contact] ' . $error->getMessage());
    $response = new ContactResponse(500, ['error' => 'not_configured']);
}

http_response_code($response->status);
echo json_encode($response->body);
