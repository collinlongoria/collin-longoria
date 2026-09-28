<?php

require __DIR__ . '/includes/bootstrap.php';
allow_methods('POST');

log_out();
send_json(['loggedIn' => false]);
