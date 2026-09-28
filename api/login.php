<?php

require __DIR__ . '/includes/bootstrap.php';
allow_methods('POST');

rate_limit('login', 5, 15 * 60);

$body = request_body();
verify_captcha($body['captcha'] ?? null);
$csrfToken = log_in((string) ($body['password'] ?? ''));

send_json(['loggedIn' => true, 'csrfToken' => $csrfToken]);
