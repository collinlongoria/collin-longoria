<?php
// GET:  list thoughts, newest first. ?limit=20&before=<id> for the next page.
// POST: post a new thought (logged in only), then cross-post it to X and Threads.

require __DIR__ . '/includes/bootstrap.php';
$method = allow_methods('GET', 'POST');

if ($method === 'GET') {
    $limit = max(1, min(50, query_int('limit', 20)));
    $before = query_int('before');

    // One extra row tells us whether there's another page. $limit is an int, safe to inline.
    $rows = $before > 0
        ? query('SELECT * FROM thoughts WHERE id < ? ORDER BY id DESC LIMIT ' . ($limit + 1), [$before])->fetchAll()
        : query('SELECT * FROM thoughts ORDER BY id DESC LIMIT ' . ($limit + 1))->fetchAll();

    send_json([
        'thoughts' => array_map('thought_json', array_slice($rows, 0, $limit)),
        'hasMore' => count($rows) > $limit,
    ]);
}

require_login();

$body = request_body();
$text = text_field($body, 'body', 1000, true);
$feeling = text_field($body, 'feeling', MAX_FEELING_LENGTH);

$length = post_length(cross_post_text($text, $feeling));
if ($length > MAX_THOUGHT_LENGTH) {
    send_error(422, "Too long ($length/" . MAX_THOUGHT_LENGTH . ').');
}

query(
    'INSERT INTO thoughts (body, feeling, created_at, x_status, threads_status) VALUES (?, ?, ?, ?, ?)',
    [
        $text,
        $feeling,
        now(),
        !empty($body['postToX']) ? 'pending' : 'skipped',
        !empty($body['postToThreads']) ? 'pending' : 'skipped',
    ]
);

$thought = cross_post((int) db()->lastInsertId());
send_json(['thought' => thought_json($thought)], 201);
