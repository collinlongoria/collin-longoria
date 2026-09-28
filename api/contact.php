<?php

require __DIR__ . '/includes/bootstrap.php';
allow_methods('POST');

$body = request_body();
if (!empty($body['website'])) {
    send_json(['sent' => true]); // bot trap, see guestbook.php
}

$name = text_field($body, 'name', 100, true);
$email = text_field($body, 'email', 200, true);
$message = text_field($body, 'message', 5000, true);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_error(422, "That email address doesn't look right.");
}

verify_captcha($body['captcha'] ?? null);
rate_limit('contact', 3, 60 * 60);

if (!send_contact_email($name, $email, $message)) {
    send_error(500, "Couldn't send the message. Try again later.");
}
send_json(['sent' => true]);
