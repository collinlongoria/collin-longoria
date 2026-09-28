<?php

// Bump this when you change schema.sql, and add a step to upgrade_database() below.
const SCHEMA_VERSION = 1;

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $file = (string) config('database', dirname(__DIR__, 3) . '/data/site.sqlite');
    if (!is_dir(dirname($file))) {
        mkdir(dirname($file), 0700, true);
    }

    $pdo = new PDO('sqlite:' . $file, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    // WAL: readers don't block the writer. busy_timeout: wait on a lock instead of failing.
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA busy_timeout = 5000');

    // user_version is 0 for a brand new file.
    $version = (int) $pdo->query('PRAGMA user_version')->fetchColumn();
    if ($version === 0) {
        $pdo->exec(file_get_contents(__DIR__ . '/../schema.sql'));
        $pdo->exec('PRAGMA user_version = ' . SCHEMA_VERSION);
    } elseif ($version < SCHEMA_VERSION) {
        upgrade_database($pdo, $version);
    }

    return $pdo;
}

// Brings a database made with an older schema.sql up to date. New databases never come
// through here: they get the current schema.sql directly. Example for version 2:
//
//     if ($from < 2) {
//         $pdo->exec('CREATE TABLE likes (post TEXT NOT NULL, created_at TEXT NOT NULL)');
//     }
function upgrade_database(PDO $pdo, int $from): void
{
    $pdo->exec('PRAGMA user_version = ' . SCHEMA_VERSION);
}

// Always bind user input through $params; never interpolate it into $sql.
function query(string $sql, array $params = []): PDOStatement
{
    $statement = db()->prepare($sql);
    $statement->execute($params);
    return $statement;
}

function now(): string
{
    return gmdate('Y-m-d H:i:s');
}

// "2026-09-27 14:05:00" → "2026-09-27T14:05:00Z", which JavaScript's Date understands.
function to_iso(?string $datetime): ?string
{
    return $datetime === null ? null : str_replace(' ', 'T', $datetime) . 'Z';
}

function get_setting(string $name): ?string
{
    $value = query('SELECT value FROM settings WHERE name = ?', [$name])->fetchColumn();
    return $value === false ? null : $value;
}

function save_setting(string $name, ?string $value): void
{
    query(
        'INSERT INTO settings (name, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT (name) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
        [$name, $value, now()]
    );
}
