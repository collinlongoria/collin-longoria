<?php
// GET: a quick check that the server is set up right. Open /api/health.php in a browser.

require __DIR__ . '/includes/bootstrap.php';
allow_methods('GET');

$checks = [
    'php' => PHP_VERSION,
    'sqlite' => extension_loaded('pdo_sqlite'),
    'curl' => extension_loaded('curl'),
    'mbstring' => extension_loaded('mbstring'),
    'dryRun' => is_dry_run(),
];

try {
    db();
    $checks['database'] = true;
} catch (Throwable $error) {
    $checks['database'] = false;
}

// Only shown to you: the exact command for the cron job, with this server's real path.
if (is_logged_in()) {
    $checks['cronCommand'] = 'php ' . realpath(__DIR__ . '/cron.php');
}

send_json($checks);
