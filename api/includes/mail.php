<?php

function send_contact_email(string $name, string $email, string $message): bool
{
    // Line breaks in a header would let someone add their own headers (e.g. extra recipients).
    $name = trim(preg_replace('/[\r\n]+/', ' ', $name));
    $email = trim(preg_replace('/[\r\n]+/', ' ', $email));

    $subject = "Website: message from $name";
    $body = "From: $name <$email>\n\n$message\n";

    if (is_dry_run()) {
        dry_run_log("Email: $subject\n$body");
        return true;
    }

    $to = (string) config('mail.to', '');
    if ($to === '') {
        throw new RuntimeException('mail.to is missing from site-config.php');
    }

    $headers = implode("\r\n", [
        'From: ' . config('mail.from'),
        "Reply-To: $email",
        'Content-Type: text/plain; charset=UTF-8',
    ]);

    // mb_encode_mimeheader keeps non-English names readable in the subject line.
    return mail($to, mb_encode_mimeheader($subject, 'UTF-8'), $body, $headers);
}
