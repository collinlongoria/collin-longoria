<?php
// Copy this to site-config.php, fill it in, and upload it with File Manager to
//   domains/collinlongoria.com/site-config.php
// That's NEXT TO public_html, not inside it, so nobody can download it and deploys never touch it.
//
// Locally you don't need this file at all: without it, `npm run dev` uses a dry run
// with the password "dev" (see includes/config.php).

return [
    // true = nothing is posted, emailed or committed; it's all written to data/dry-run.log instead.
    'dry_run' => false,

    // Where the SQLite database file goes. Leave this out and it's created automatically in
    // domains/collinlongoria.com/data/, next to this file.
    // 'database' => '/full/path/to/site.sqlite',

    // Your admin password, hashed. Run `npm run hash-password` and paste the line it prints.
    'admin_password_hash' => '',

    // Any long random string. Used to anonymize visitor IPs for rate limiting.
    'secret' => '',

    // Cloudflare Turnstile secret key. Leave empty to turn the captcha off.
    // The matching site key goes in src/config.ts.
    'turnstile_secret' => '',

    // Lets the admin editor publish to your repo. Create a fine-grained token for only this repo with
    // "Contents: Read and write" and "Actions: Read-only".
    'github' => [
        'token' => '',
        'owner' => 'collinlongoria',
        'repo' => 'collin-longoria',
        'branch' => 'main',
        'workflow' => 'deploy.yml',
    ],

    // From developer.x.com: an app with "Read and write" permission.
    'x' => [
        'consumer_key' => '',
        'consumer_secret' => '',
        'access_token' => '',
        'access_secret' => '',
    ],

    // A long-lived Threads token. Cron keeps it refreshed after this.
    'threads' => [
        'access_token' => '',
    ],

    'mail' => [
        'to' => '',                                // where contact form messages go
        'from' => 'website@collinlongoria.com',    // should be an address on your domain
    ],
];
