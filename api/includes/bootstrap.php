<?php
// Included by every endpoint.

declare(strict_types=1);

require __DIR__ . '/config.php';
require __DIR__ . '/database.php';
require __DIR__ . '/http.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/rate-limit.php';
require __DIR__ . '/captcha.php';
require __DIR__ . '/x.php';
require __DIR__ . '/threads.php';
require __DIR__ . '/thoughts.php';
require __DIR__ . '/content.php';
require __DIR__ . '/mail.php';

// Uncaught errors become a generic JSON 500. Details go to the error log, not the client.
set_exception_handler(function (Throwable $error) {
    error_log('[api] ' . $error->getMessage() . ' in ' . $error->getFile() . ':' . $error->getLine());
    if (!headers_sent()) {
        send_json(['error' => 'Something went wrong on the server.'], 500);
    }
});
