<?php
// GET: are you logged in? Also hands the page its CSRF token (see includes/auth.php).

require __DIR__ . '/includes/bootstrap.php';
allow_methods('GET');

if (is_logged_in()) {
    send_json(['loggedIn' => true, 'csrfToken' => $_SESSION['csrf_token'], 'dryRun' => is_dry_run()]);
}

// Stale hint cookie (session expired or logged out elsewhere).
set_signed_in_cookie(false);
send_json(['loggedIn' => false]);
