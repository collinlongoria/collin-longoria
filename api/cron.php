<?php
// Background jobs. Hostinger runs this every 10 minutes (hPanel → Advanced → Cron Jobs):
//   php /home/<user>/domains/<domain>/public_html/api/cron.php
// You can also run one job by name: php api/cron.php retry

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/includes/bootstrap.php';

function say(string $message): void
{
    echo '[' . gmdate('Y-m-d H:i:s') . "] $message\n";
}

// Retry cross-posts that failed (e.g. X was down) from the last three days.
function retry_failed_posts(): void
{
    $since = gmdate('Y-m-d H:i:s', time() - 3 * 86400);
    $ids = query(
        "SELECT id FROM thoughts WHERE created_at > ?
         AND (x_status IN ('pending', 'failed') OR threads_status IN ('pending', 'failed'))",
        [$since]
    )->fetchAll(PDO::FETCH_COLUMN);

    foreach ($ids as $id) {
        $thought = cross_post((int) $id);
        say("thought $id: X {$thought['x_status']}, Threads {$thought['threads_status']}");
    }
}

function refresh_token(): void
{
    if (!get_setting('threads_token') && !config('threads.access_token')) {
        return;
    }
    say('Threads token: ' . refresh_threads_token());
}

function clean_up(): void
{
    $cutoff = gmdate('Y-m-d H:i:s', time() - 86400);
    query('DELETE FROM rate_limits WHERE created_at < ?', [$cutoff]);
}

$jobs = [
    'retry' => 'retry_failed_posts',
    'refresh-token' => 'refresh_token',
    'cleanup' => 'clean_up',
];

$only = $argv[1] ?? null;
if ($only !== null && !isset($jobs[$only])) {
    fwrite(STDERR, "Unknown job \"$only\". Jobs: " . implode(', ', array_keys($jobs)) . "\n");
    exit(1);
}

foreach ($jobs as $name => $job) {
    if ($only !== null && $only !== $name) {
        continue;
    }
    try {
        $job();
    } catch (Throwable $error) {
        say("$name failed: " . $error->getMessage());
    }
}
