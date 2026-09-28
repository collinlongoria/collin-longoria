<?php
// GET: the last few runs of the deploy workflow, so the admin can show "deploying…" / "live".

require __DIR__ . '/includes/bootstrap.php';
allow_methods('GET');
require_login();

send_json(['dryRun' => is_dry_run(), 'deploys' => recent_deploys()]);
