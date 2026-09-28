<?php
// GET:    list entries, newest first. ?limit=20&before=<id> for the next page.
// POST:   sign the guestbook.
// DELETE: ?id=<entry id> hides an entry (logged in only).

require __DIR__ . '/includes/bootstrap.php';
$method = allow_methods('GET', 'POST', 'DELETE');

function entry_json(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'location' => $row['location'],
        'message' => $row['message'],
        'createdAt' => to_iso($row['created_at']),
    ];
}

if ($method === 'GET') {
    $limit = max(1, min(50, query_int('limit', 20)));
    $before = query_int('before');

    // Same paging approach as thoughts.php.
    $rows = $before > 0
        ? query('SELECT * FROM guestbook WHERE deleted_at IS NULL AND id < ? ORDER BY id DESC LIMIT ' . ($limit + 1), [$before])->fetchAll()
        : query('SELECT * FROM guestbook WHERE deleted_at IS NULL ORDER BY id DESC LIMIT ' . ($limit + 1))->fetchAll();
    $total = (int) query('SELECT COUNT(*) FROM guestbook WHERE deleted_at IS NULL')->fetchColumn();

    send_json([
        'entries' => array_map('entry_json', array_slice($rows, 0, $limit)),
        'hasMore' => count($rows) > $limit,
        'total' => $total,
    ]);
}

if ($method === 'DELETE') {
    require_login();
    // Soft delete, so a mistake can be undone.
    query('UPDATE guestbook SET deleted_at = ? WHERE id = ?', [now(), query_int('id')]);
    send_json(['deleted' => true]);
}

$body = request_body();

// Honeypot: humans never fill the hidden "website" field. Pretend success so bots don't adapt.
if (!empty($body['website'])) {
    send_json(['entry' => null], 201);
}

$name = text_field($body, 'name', 60, true);
$location = text_field($body, 'location', 60);
$message = text_field($body, 'message', 1000, true);

if (preg_match_all('~https?://~i', $message) > 2) {
    send_error(422, 'Too many links.');
}

verify_captcha($body['captcha'] ?? null);
rate_limit('guestbook', 3, 10 * 60);

query(
    'INSERT INTO guestbook (name, location, message, created_at, ip_hash) VALUES (?, ?, ?, ?, ?)',
    [$name, $location, $message, now(), visitor_id()]
);

$entry = query('SELECT * FROM guestbook WHERE id = ?', [db()->lastInsertId()])->fetch();
send_json(['entry' => entry_json($entry)], 201);
