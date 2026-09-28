<?php
// POST ?id=<thought id>: try the cross-posts that failed again, right now.

require __DIR__ . '/includes/bootstrap.php';
allow_methods('POST');
require_login();

$id = query_int('id');
if (!find_thought($id)) {
    send_error(404, 'Thought not found.');
}

// Manual retries reset the attempt budget.
query("UPDATE thoughts SET x_attempts = 0 WHERE id = ? AND x_status IN ('pending', 'failed')", [$id]);
query("UPDATE thoughts SET threads_attempts = 0 WHERE id = ? AND threads_status IN ('pending', 'failed')", [$id]);

send_json(['thought' => thought_json(cross_post($id))]);
