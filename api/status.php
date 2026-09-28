<?php
// GET: the sidebar status, which is the feeling from your most recent thought that has one.

require __DIR__ . '/includes/bootstrap.php';
allow_methods('GET');

$latest = query("SELECT feeling, created_at FROM thoughts WHERE feeling IS NOT NULL AND feeling != ''
                 ORDER BY id DESC LIMIT 1")->fetch();

send_json(
    ['feeling' => $latest['feeling'] ?? null, 'since' => to_iso($latest['created_at'] ?? null)],
    200,
    'public, max-age=60'
);
