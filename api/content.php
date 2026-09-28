<?php
// The admin editor's API (logged in only).
//
// GET    ?section=blog                       list the entries in a section
// GET    ?section=blog&slug=my-post          one entry's files (text files include their contents)
// PUT    ?section=blog&slug=my-post          save files: { files: [...], delete: [...], message }
// DELETE ?section=blog&slug=my-post          delete the whole entry
//
// Home and About have no slug.

require __DIR__ . '/includes/bootstrap.php';
$method = allow_methods('GET', 'PUT', 'DELETE');
require_login();

$section = (string) ($_GET['section'] ?? '');
$slug = (string) ($_GET['slug'] ?? '');
$isSinglePage = in_array($section, SINGLE_PAGE_SECTIONS, true);

if ($method === 'GET' && $slug === '' && !$isSinglePage) {
    send_json(['entries' => list_entries($section)]);
}

if ($method === 'GET') {
    send_json(['files' => get_entry($section, $slug)]);
}

if ($method === 'DELETE') {
    send_json(['commit' => delete_entry($section, $slug)]);
}

$body = request_body();
$files = is_array($body['files'] ?? null) ? $body['files'] : [];
$delete = is_array($body['delete'] ?? null) ? $body['delete'] : [];
$message = is_string($body['message'] ?? null) ? $body['message'] : "$section: update $slug";

send_json(['commit' => save_entry($section, $slug, $files, $delete, $message)]);
