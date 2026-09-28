<?php
// Posting to Threads is two steps: create a "container" with the text, then publish it.

const THREADS_API = 'https://graph.threads.net/v1.0';

// The token starts in site-config.php. Cron refreshes it (they expire after 60 days)
// and stores the new one in the database, which then takes priority.
function threads_token(): string
{
    $token = get_setting('threads_token') ?: (string) config('threads.access_token', '');
    if ($token === '') {
        throw new RuntimeException('Threads token is missing from site-config.php');
    }
    return $token;
}

/** @return array{id: string, url: ?string} */
function post_to_threads(string $text): array
{
    if (is_dry_run()) {
        dry_run_log("Threads post:\n$text\n");
        return ['id' => 'dry-run', 'url' => null];
    }

    $token = threads_token();

    [$status, $container] = http_request('POST', THREADS_API . '/me/threads', [], [
        'media_type' => 'TEXT',
        'text' => $text,
        'access_token' => $token,
    ]);
    if ($status >= 300 || empty($container['id'])) {
        throw new RuntimeException('Threads ' . api_error($status, $container));
    }

    [$status, $published] = http_request('POST', THREADS_API . '/me/threads_publish', [], [
        'creation_id' => $container['id'],
        'access_token' => $token,
    ]);
    if ($status >= 300 || empty($published['id'])) {
        throw new RuntimeException('Threads ' . api_error($status, $published));
    }

    $id = (string) $published['id'];

    // The link to the post needs one more request. Not worth failing over.
    $url = null;
    try {
        [$status, $post] = http_request('GET', THREADS_API . "/$id?fields=permalink&access_token=" . urlencode($token));
        $url = $post['permalink'] ?? null;
    } catch (Throwable) {
    }

    return ['id' => $id, 'url' => $url];
}

function refresh_threads_token(): string
{
    $refreshedAt = get_setting('threads_token_refreshed_at');
    if ($refreshedAt && strtotime("$refreshedAt UTC") > time() - 30 * 86400) {
        return 'still fresh';
    }
    if (is_dry_run()) {
        return 'skipped (dry run)';
    }

    [$status, $response] = http_request('GET', 'https://graph.threads.net/refresh_access_token?' . http_build_query([
        'grant_type' => 'th_refresh_token',
        'access_token' => threads_token(),
    ]));
    if ($status >= 300 || empty($response['access_token'])) {
        throw new RuntimeException('Threads token refresh ' . api_error($status, $response));
    }

    save_setting('threads_token', $response['access_token']);
    save_setting('threads_token_refreshed_at', now());
    return 'refreshed';
}
