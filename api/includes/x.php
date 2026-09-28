<?php
// X API v2, authenticated with OAuth 1.0a user-context signing.

function oauth_encode(string $value): string
{
    return rawurlencode($value);
}

/**
 * Builds the "Authorization: OAuth ..." header. $params are query/form parameters that are
 * part of the signature (a JSON body is not). $nonce and $timestamp can be fixed for testing.
 */
function oauth_header(
    string $method,
    string $url,
    array $keys,
    array $params = [],
    ?string $nonce = null,
    ?int $timestamp = null
): string {
    $oauth = [
        'oauth_consumer_key' => $keys['consumer_key'],
        'oauth_nonce' => $nonce ?? bin2hex(random_bytes(16)),
        'oauth_signature_method' => 'HMAC-SHA1',
        'oauth_timestamp' => (string) ($timestamp ?? time()),
        'oauth_token' => $keys['access_token'],
        'oauth_version' => '1.0',
    ];

    // 1. All parameters, encoded and sorted by name.
    $encoded = [];
    foreach (array_merge($params, $oauth) as $name => $value) {
        $encoded[oauth_encode((string) $name)] = oauth_encode((string) $value);
    }
    ksort($encoded, SORT_STRING);
    $pairs = [];
    foreach ($encoded as $name => $value) {
        $pairs[] = "$name=$value";
    }

    // 2. Method + URL + parameters, then sign with both secrets.
    $base = strtoupper($method) . '&' . oauth_encode($url) . '&' . oauth_encode(implode('&', $pairs));
    $signingKey = oauth_encode($keys['consumer_secret']) . '&' . oauth_encode($keys['access_secret']);
    $oauth['oauth_signature'] = base64_encode(hash_hmac('sha1', $base, $signingKey, true));

    // 3. Put it all in the header.
    ksort($oauth);
    $parts = [];
    foreach ($oauth as $name => $value) {
        $parts[] = oauth_encode($name) . '="' . oauth_encode($value) . '"';
    }
    return 'OAuth ' . implode(', ', $parts);
}

/** @return array{id: string, url: ?string} */
function post_to_x(string $text): array
{
    if (is_dry_run()) {
        dry_run_log("X post:\n$text\n");
        return ['id' => 'dry-run', 'url' => null];
    }

    $keys = config('x', []);
    foreach (['consumer_key', 'consumer_secret', 'access_token', 'access_secret'] as $name) {
        if (empty($keys[$name])) {
            throw new RuntimeException('X keys are missing from site-config.php');
        }
    }

    $url = 'https://api.x.com/2/tweets';
    [$status, $response] = http_request('POST', $url, [
        'Authorization: ' . oauth_header('POST', $url, $keys),
        'Content-Type: application/json',
    ], json_encode(['text' => $text], JSON_UNESCAPED_UNICODE));

    if ($status >= 300 || empty($response['data']['id'])) {
        throw new RuntimeException('X ' . api_error($status, $response));
    }

    $id = (string) $response['data']['id'];
    return ['id' => $id, 'url' => "https://x.com/i/web/status/$id"];
}
