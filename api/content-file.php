<?php
// GET ?section=blog&slug=my-post&name=shot.png: the raw file, for image previews in the editor.

require __DIR__ . '/includes/bootstrap.php';
allow_methods('GET');
require_login();

send_entry_file((string) ($_GET['section'] ?? ''), (string) ($_GET['slug'] ?? ''), (string) ($_GET['name'] ?? ''));
