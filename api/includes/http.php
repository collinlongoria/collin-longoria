<?php

function send_json(mixed $data, int $status = 200, string $cache = 'no-store'): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: ' . $cache);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function send_error(int $status, string $message): never
{
    send_json(['error' => $message], $status);
}

function allow_methods(string ...$methods): string
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, $methods, true)) {
        header('Allow: ' . implode(', ', $methods));
        send_error(405, 'Method not allowed.');
    }
    return $method;
}

// The browser sends JSON bodies (see src/scripts/api.ts).
function request_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        send_error(400, 'Invalid JSON.');
    }
    return $data;
}

// Reads a text field, trims it and checks its length. Returns null when empty.
function text_field(array $body, string $name, int $maxLength, bool $required = false): ?string
{
    $value = $body[$name] ?? '';
    if (!is_string($value)) {
        send_error(422, "$name must be text.");
    }

    $value = trim(str_replace("\r\n", "\n", $value));
    if ($value === '') {
        if ($required) {
            send_error(422, "$name is required.");
        }
        return null;
    }
    if (mb_strlen($value) > $maxLength) {
        send_error(422, "$name is too long (max $maxLength characters).");
    }
    return $value;
}

function query_int(string $name, int $default = 0): int
{
    return isset($_GET[$name]) ? (int) $_GET[$name] : $default;
}

/**
 * Calls another website's API. Returns [status code, decoded JSON (or the raw text)].
 * A string body is sent as-is (JSON); an array is sent as a normal form.
 */
function http_request(string $method, string $url, array $headers = [], string|array|null $body = null): array
{
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_USERAGENT => 'collinlongoria.com',
    ]);
    if ($body !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, is_array($body) ? http_build_query($body) : $body);
    }

    $response = curl_exec($curl);
    if ($response === false) {
        throw new RuntimeException('Request to ' . parse_url($url, PHP_URL_HOST) . ' failed: ' . curl_error($curl));
    }

    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $json = json_decode((string) $response, true);
    return [$status, $json ?? $response];
}

// Pulls a readable message out of an API error response.
function api_error(int $status, mixed $response): string
{
    if (is_array($response)) {
        $message = $response['detail']
            ?? $response['title']
            ?? $response['message']
            ?? $response['error']['message']
            ?? $response['errors'][0]['message']
            ?? null;
        if ($message) {
            return "$status: $message";
        }
    }
    return "$status: " . (is_string($response) ? substr($response, 0, 200) : 'unknown error');
}
