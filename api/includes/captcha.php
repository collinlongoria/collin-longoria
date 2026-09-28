<?php
// Cloudflare Turnstile: the browser widget gives us a token, and we ask Cloudflare whether it's real.

function verify_captcha(?string $token): void
{
    $secret = (string) config('turnstile_secret', '');
    if ($secret === '') {
        return; // captcha turned off (always the case locally)
    }
    if (!$token) {
        send_error(422, 'Please complete the captcha.');
    }

    [$status, $result] = http_request('POST', 'https://challenges.cloudflare.com/turnstile/v0/siteverify', [], [
        'secret' => $secret,
        'response' => $token,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);

    if ($status !== 200 || empty($result['success'])) {
        send_error(422, 'The captcha check failed. Try again.');
    }
}
