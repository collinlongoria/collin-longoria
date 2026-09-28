<?php
// Settings come from site-config.php, which lives outside public_html on the server.
// Local runs without one fall back to local_defaults().

function config(string $key, mixed $default = null): mixed
{
    static $config = null;
    $config ??= load_config();

    // Dot notation: config('github.token')
    $value = $config;
    foreach (explode('.', $key) as $part) {
        if (!is_array($value) || !array_key_exists($part, $value)) {
            return $default;
        }
        $value = $value[$part];
    }
    return $value;
}

function load_config(): array
{
    $candidates = [
        getenv('SITE_CONFIG') ?: '',
        dirname(__DIR__, 3) . '/site-config.php', // on Hostinger: domains/<domain>/site-config.php
        dirname(__DIR__) . '/config.local.php',    // optional, for trying real settings locally
    ];

    foreach ($candidates as $file) {
        if ($file !== '' && is_file($file)) {
            return require $file;
        }
    }

    // php -S (used by `npm run dev`) and CLI scripts.
    if (PHP_SAPI === 'cli-server' || PHP_SAPI === 'cli') {
        return local_defaults();
    }

    throw new RuntimeException('site-config.php not found');
}

function local_defaults(): array
{
    $root = dirname(__DIR__, 2);

    return [
        'dry_run' => true,
        'database' => $root . '/data/local.sqlite',
        'content_dir' => getenv('CONTENT_DIR') ?: $root . '/content',
        'admin_password_hash' => password_hash('dev', PASSWORD_DEFAULT),
        'secret' => 'local',
        'mail' => ['to' => 'you@example.com', 'from' => 'website@localhost'],
    ];
}

// Dry run: cross-posts and email go to data/dry-run.log, and publishing writes into
// content_dir instead of committing to GitHub.
function is_dry_run(): bool
{
    return (bool) config('dry_run', false);
}

function data_dir(): string
{
    return dirname((string) config('database', dirname(__DIR__, 3) . '/data/site.sqlite'));
}

function dry_run_log(string $message): void
{
    $line = '[' . gmdate('Y-m-d H:i:s') . '] ' . $message . "\n";
    file_put_contents(data_dir() . '/dry-run.log', $line, FILE_APPEND);
}
