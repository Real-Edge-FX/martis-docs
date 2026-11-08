<?php

declare(strict_types=1);

/**
 * Martis documentation MCP server (Streamable HTTP transport, stateless,
 * read-only). Served at https://getmartis.com/mcp (.htaccess rewrite).
 *
 * Tools: search_docs, get_page, list_pages. Data comes from the files the
 * build publishes next to this script: search-index.json, sitemap.xml and
 * the Markdown copy of every page (scripts/prerender.mjs).
 */

const SERVER_NAME = 'martis-docs';
const SERVER_VERSION = '1.0.0';
const SITE = 'https://getmartis.com';
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Cache-Control: no-store');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($method !== 'POST') {
    http_response_code(405);
    header('Allow: POST, OPTIONS');
    header('Content-Type: application/json');
    echo json_encode(['error' => 'This MCP endpoint accepts JSON-RPC over POST. See ' . SITE . '/.well-known/mcp/server-card.json']);
    exit;
}

$raw = file_get_contents('php://input', false, null, 0, 65536);
$payload = json_decode($raw === false ? '' : $raw, true);
if (!is_array($payload)) {
    respond(rpc_error(null, -32700, 'Parse error'));
}

$isBatch = array_is_list($payload);
$messages = $isBatch ? $payload : [$payload];
$replies = [];
foreach ($messages as $message) {
    $reply = handle(is_array($message) ? $message : []);
    if ($reply !== null) {
        $replies[] = $reply;
    }
}

if ($replies === []) {
    http_response_code(202);
    exit;
}
respond($isBatch ? $replies : $replies[0]);

function respond(array $body): never
{
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function rpc_result(mixed $id, array $result): array
{
    return ['jsonrpc' => '2.0', 'id' => $id, 'result' => (object) $result];
}

function rpc_error(mixed $id, int $code, string $message): array
{
    return ['jsonrpc' => '2.0', 'id' => $id, 'error' => ['code' => $code, 'message' => $message]];
}

/** @param array<string, mixed> $message */
function handle(array $message): ?array
{
    $id = $message['id'] ?? null;
    $method = is_string($message['method'] ?? null) ? $message['method'] : '';
    $params = is_array($message['params'] ?? null) ? $message['params'] : [];

    // Notifications (no id) get no reply.
    if (!array_key_exists('id', $message)) {
        return null;
    }

    return match ($method) {
        'initialize' => rpc_result($id, [
            'protocolVersion' => in_array($params['protocolVersion'] ?? null, SUPPORTED_PROTOCOLS, true) ? $params['protocolVersion'] : SUPPORTED_PROTOCOLS[0],
            'capabilities' => ['tools' => ['listChanged' => false]],
            'serverInfo' => ['name' => SERVER_NAME, 'title' => 'Martis documentation', 'version' => SERVER_VERSION],
            'instructions' => 'Read-only access to the Martis documentation (Laravel admin foundation). Use search_docs to find pages, then get_page for their Markdown.',
        ]),
        'ping' => rpc_result($id, []),
        'tools/list' => rpc_result($id, ['tools' => tools()]),
        'tools/call' => call_tool($id, (string) ($params['name'] ?? ''), is_array($params['arguments'] ?? null) ? $params['arguments'] : []),
        default => rpc_error($id, -32601, "Method not found: {$method}"),
    };
}

function tools(): array
{
    $readOnly = ['readOnlyHint' => true, 'openWorldHint' => false];

    return [
        [
            'name' => 'search_docs',
            'title' => 'Search the Martis docs',
            'description' => 'Search the Martis documentation and return the best matching pages with their URLs and summaries.',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'query' => ['type' => 'string', 'description' => 'What to look for, e.g. "drawer detail override".'],
                    'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 20, 'default' => 5],
                ],
                'required' => ['query'],
            ],
            'annotations' => $readOnly,
        ],
        [
            'name' => 'get_page',
            'title' => 'Read a page',
            'description' => 'Return the Markdown content of a getmartis.com page, e.g. "/docs/core/resources" or "/showcase".',
            'inputSchema' => [
                'type' => 'object',
                'properties' => ['path' => ['type' => 'string', 'description' => 'Page path, starting with "/".']],
                'required' => ['path'],
            ],
            'annotations' => $readOnly,
        ],
        [
            'name' => 'list_pages',
            'title' => 'List pages',
            'description' => 'List every public page of getmartis.com.',
            'inputSchema' => ['type' => 'object', 'properties' => (object) []],
            'annotations' => $readOnly,
        ],
    ];
}

function text_result(mixed $id, string $text, bool $isError = false): array
{
    return rpc_result($id, ['content' => [['type' => 'text', 'text' => $text]], 'isError' => $isError]);
}

/** @param array<string, mixed> $arguments */
function call_tool(mixed $id, string $name, array $arguments): array
{
    return match ($name) {
        'search_docs' => text_result($id, search_docs((string) ($arguments['query'] ?? ''), (int) ($arguments['limit'] ?? 5))),
        'get_page' => get_page($id, (string) ($arguments['path'] ?? '')),
        'list_pages' => text_result($id, implode("\n", list_pages())),
        default => rpc_error($id, -32602, "Unknown tool: {$name}"),
    };
}

function search_docs(string $query, int $limit): string
{
    $terms = array_values(array_filter(preg_split('/\s+/', mb_strtolower(trim($query))) ?: []));
    if ($terms === []) {
        return 'Give a query.';
    }
    $index = json_decode((string) @file_get_contents(__DIR__ . '/search-index.json'), true);
    $scored = [];
    foreach (($index['entries'] ?? []) as $entry) {
        $title = mb_strtolower((string) ($entry['title'] ?? ''));
        $body = mb_strtolower(($entry['description'] ?? '') . ' ' . ($entry['body'] ?? ''));
        $score = 0;
        foreach ($terms as $term) {
            $score += (str_contains($title, $term) ? 5 : 0) + (str_contains($body, $term) ? 1 : 0);
        }
        if ($score > 0) {
            $scored[] = [$score, $entry];
        }
    }
    usort($scored, fn ($a, $b) => $b[0] <=> $a[0]);
    $lines = [];
    foreach (array_slice($scored, 0, max(1, min(20, $limit))) as [, $entry]) {
        $lines[] = sprintf("- %s\n  %s/docs/%s\n  %s", $entry['title'], SITE, $entry['slug'], $entry['description'] ?? '');
    }

    return $lines === [] ? 'No matching documentation page.' : implode("\n", $lines);
}

function get_page(mixed $id, string $path): array
{
    $path = '/' . trim(parse_url($path, PHP_URL_PATH) ?: '', '/');
    if (!preg_match('#^/[a-z0-9/_-]*$#', $path) || str_contains($path, '..')) {
        return text_result($id, 'Invalid path.', true);
    }
    $file = $path === '/' ? __DIR__ . '/index.md' : __DIR__ . $path . '.md';
    if (!is_file($file)) {
        return text_result($id, "No page at {$path}.", true);
    }

    return text_result($id, (string) file_get_contents($file));
}

/** @return list<string> */
function list_pages(): array
{
    $xml = (string) @file_get_contents(__DIR__ . '/sitemap.xml');
    preg_match_all('#<loc>([^<]+)</loc>#', $xml, $matches);

    return $matches[1] ?? [];
}
