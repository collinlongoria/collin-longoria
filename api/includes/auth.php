<?php
// Single-user auth on top of PHP sessions. The session cookie is HttpOnly. The readable
// signed_in cookie only tells the static pages to show admin UI; it's never trusted here.

const SESSION_COOKIE = 'sid';
const SESSION_LIFETIME = 60 * 60 * 24 * 30; // 30 days

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    // Outside public_html so deploys don't wipe sessions.
    $dir = data_dir() . '/sessions';
    if (!is_dir($dir)) {
        mkdir($dir, 0700, true);
    }
    session_save_path($dir);

    ini_set('session.gc_maxlifetime', (string) SESSION_LIFETIME);
    ini_set('session.use_strict_mode', '1');
    session_name(SESSION_COOKIE);
    session_set_cookie_params([
        'lifetime' => SESSION_LIFETIME,
        'path' => '/',
        'secure' => is_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function is_logged_in(): bool
{
    // Don't start sessions for anonymous visitors.
    if (!isset($_COOKIE[SESSION_COOKIE])) {
        return false;
    }
    start_session();
    return ($_SESSION['logged_in'] ?? false) === true;
}

function require_login(): void
{
    if (!is_logged_in()) {
        send_error(401, 'You need to log in.');
    }

    // Writes must also carry the CSRF token issued at login.
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!hash_equals($_SESSION['csrf_token'] ?? '', (string) $token)) {
            send_error(403, 'Your session expired. Reload the page and try again.');
        }
    }
}

function set_signed_in_cookie(bool $signedIn): void
{
    setcookie('signed_in', $signedIn ? '1' : '', [
        'expires' => $signedIn ? time() + SESSION_LIFETIME : time() - 3600,
        'path' => '/',
        'secure' => is_https(),
        'httponly' => false,
        'samesite' => 'Lax',
    ]);
}

// Accepts hashes from `npm run hash-password` ("pbkdf2$…") or from PHP's password_hash().
function check_password(string $password, string $hash): bool
{
    if ($hash === '') {
        return false;
    }

    if (str_starts_with($hash, 'pbkdf2$')) {
        $parts = explode('$', $hash);
        if (count($parts) !== 4) {
            return false;
        }
        [, $iterations, $salt, $expected] = $parts;
        $actual = hash_pbkdf2('sha256', $password, base64_decode($salt), (int) $iterations, 32, true);
        return hash_equals(base64_decode($expected), $actual);
    }

    return password_verify($password, $hash);
}

function log_in(string $password): string
{
    if (!check_password($password, (string) config('admin_password_hash', ''))) {
        // Slows down guessing and blurs timing.
        usleep(random_int(200000, 500000));
        send_error(401, 'Wrong password.');
    }

    start_session();
    session_regenerate_id(true);
    $_SESSION['logged_in'] = true;
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    set_signed_in_cookie(true);

    return $_SESSION['csrf_token'];
}

function log_out(): void
{
    if (isset($_COOKIE[SESSION_COOKIE])) {
        start_session();
        $_SESSION = [];
        session_destroy();
        setcookie(SESSION_COOKIE, '', ['expires' => time() - 3600, 'path' => '/']);
    }
    set_signed_in_cookie(false);
}
