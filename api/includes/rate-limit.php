<?php

// Visitors are identified by a hash of their IP so we never store raw IP addresses.
function visitor_id(): string
{
    return hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? '', (string) config('secret', ''));
}

// Allows $max actions per visitor within $seconds, then answers "429 Too Many Requests".
function rate_limit(string $action, int $max, int $seconds): void
{
    $bucket = $action . ':' . visitor_id();
    $since = gmdate('Y-m-d H:i:s', time() - $seconds);

    $count = (int) query('SELECT COUNT(*) FROM rate_limits WHERE bucket = ? AND created_at > ?', [$bucket, $since])
        ->fetchColumn();
    if ($count >= $max) {
        send_error(429, 'Too many tries. Wait a bit and try again.');
    }

    query('INSERT INTO rate_limits (bucket, created_at) VALUES (?, ?)', [$bucket, now()]);
}
