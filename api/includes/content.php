<?php
// Reading and publishing content from the admin editor.
//
// Live: every change is a commit to your GitHub repo, which triggers the deploy workflow.
// Dry run: files are written straight into your local content/ folder instead.

const SECTIONS = ['home', 'about', 'games', 'stories', 'blog', 'devlogs'];
const SINGLE_PAGE_SECTIONS = ['home', 'about'];
const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

function check_section(string $section): void
{
    if (!in_array($section, SECTIONS, true)) {
        send_error(404, 'Unknown section.');
    }
}

// Returns the folder inside the repo, e.g. "content/blog/my-post" or "content/about".
function content_folder(string $section, string $slug): string
{
    check_section($section);
    if (in_array($section, SINGLE_PAGE_SECTIONS, true)) {
        return "content/$section";
    }
    // Only lowercase letters, numbers and dashes, so a folder name can't escape with "../".
    if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug)) {
        send_error(422, 'Folder names can only use lowercase letters, numbers and dashes.');
    }
    return "content/$section/$slug";
}

function check_file_name(string $name): void
{
    if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/', $name)) {
        send_error(422, "\"$name\" isn't a valid file name.");
    }
}

function is_text_file(string $name): bool
{
    return (bool) preg_match('/\.(md|fountain)$/i', $name);
}

function list_entries(string $section): array
{
    check_section($section);
    return is_dry_run() ? local_list($section) : github_list($section);
}

function get_entry(string $section, string $slug): array
{
    $folder = content_folder($section, $slug);
    return is_dry_run() ? local_get($folder) : github_get($folder);
}

function send_entry_file(string $section, string $slug, string $name): never
{
    check_file_name($name);
    $folder = content_folder($section, $slug);
    $bytes = is_dry_run() ? local_read($folder, $name) : github_read($folder, $name);

    $types = [
        'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif',
        'webp' => 'image/webp', 'avif' => 'image/avif', 'mp4' => 'video/mp4', 'webm' => 'video/webm',
    ];
    $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($types[$extension] ?? 'application/octet-stream'));
    header('Cache-Control: private, max-age=300');
    echo $bytes;
    exit;
}

/**
 * $files: [['name' => 'index.md', 'text' => '...'], ['name' => 'shot.png', 'base64' => '...']]
 * $delete: file names to remove from the folder
 */
function save_entry(string $section, string $slug, array $files, array $delete, string $message): string
{
    $folder = content_folder($section, $slug);
    foreach ($files as $file) {
        check_file_name((string) ($file['name'] ?? ''));
    }
    foreach ($delete as $name) {
        check_file_name((string) $name);
    }
    if (!$files && !$delete) {
        send_error(422, 'Nothing to save.');
    }

    return is_dry_run() ? local_save($folder, $files, $delete) : github_save($folder, $files, $delete, $message);
}

function delete_entry(string $section, string $slug): string
{
    if (in_array($section, SINGLE_PAGE_SECTIONS, true)) {
        send_error(400, "This page can't be deleted.");
    }
    $folder = content_folder($section, $slug);
    return is_dry_run() ? local_delete($folder) : github_delete($folder, "$section: delete $slug");
}

function file_contents(array $file): string
{
    if (isset($file['text'])) {
        return (string) $file['text'];
    }
    if (isset($file['base64'])) {
        $bytes = base64_decode((string) $file['base64'], true);
        if ($bytes === false) {
            send_error(422, "Couldn't read {$file['name']}.");
        }
        if (strlen($bytes) > MAX_UPLOAD_BYTES) {
            send_error(413, "{$file['name']} is too big.");
        }
        return $bytes;
    }
    send_error(422, "No content for {$file['name']}.");
}

// Local (dry run)

function local_path(string $folder): string
{
    // $folder starts with "content/"; content_dir points at that content folder.
    return rtrim((string) config('content_dir'), '/\\') . substr($folder, strlen('content'));
}

function local_list(string $section): array
{
    $entries = [];
    foreach (glob(local_path("content/$section") . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
        $entries[] = ['slug' => basename($dir), 'files' => count(glob("$dir/*") ?: [])];
    }
    return $entries;
}

function local_get(string $folder): array
{
    $files = [];
    foreach (glob(local_path($folder) . '/*') ?: [] as $path) {
        if (!is_file($path)) {
            continue;
        }
        $file = ['name' => basename($path), 'size' => filesize($path)];
        if (is_text_file($path)) {
            $file['text'] = file_get_contents($path);
        }
        $files[] = $file;
    }
    return $files;
}

function local_read(string $folder, string $name): string
{
    $path = local_path($folder) . '/' . $name;
    if (!is_file($path)) {
        send_error(404, 'File not found.');
    }
    return file_get_contents($path);
}

function local_save(string $folder, array $files, array $delete): string
{
    $dir = local_path($folder);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    foreach ($files as $file) {
        file_put_contents("$dir/{$file['name']}", file_contents($file));
    }
    foreach ($delete as $name) {
        if (is_file("$dir/$name")) {
            unlink("$dir/$name");
        }
    }
    return 'local';
}

function local_delete(string $folder): string
{
    $dir = local_path($folder);
    foreach (glob("$dir/*") ?: [] as $path) {
        unlink($path);
    }
    if (is_dir($dir)) {
        rmdir($dir);
    }
    return 'local';
}

// GitHub

function github(string $method, string $path, ?array $body = null): array
{
    $token = (string) config('github.token', '');
    if ($token === '') {
        send_error(500, 'The GitHub token is missing from site-config.php.');
    }

    $api = rtrim((string) config('github.api', 'https://api.github.com'), '/');
    $url = "$api/repos/" . config('github.owner') . '/' . config('github.repo') . $path;

    [$status, $response] = http_request($method, $url, [
        'Authorization: Bearer ' . $token,
        'Accept: application/vnd.github+json',
        'X-GitHub-Api-Version: 2022-11-28',
        'Content-Type: application/json',
    ], $body === null ? null : json_encode($body, JSON_UNESCAPED_SLASHES));

    if ($status >= 300 || !is_array($response)) {
        send_error(502, 'GitHub ' . api_error($status, $response));
    }
    return $response;
}

function github_branch(): string
{
    return (string) config('github.branch', 'main');
}

// The latest commit on the branch and every file in it.
function github_snapshot(): array
{
    $ref = github('GET', '/git/ref/heads/' . github_branch());
    $commit = github('GET', '/git/commits/' . $ref['object']['sha']);
    $tree = github('GET', '/git/trees/' . $commit['tree']['sha'] . '?recursive=1');

    return [
        'commit' => $ref['object']['sha'],
        'tree' => $commit['tree']['sha'],
        'files' => array_filter($tree['tree'], fn($item) => $item['type'] === 'blob'),
    ];
}

// Files directly inside $folder (not in sub-folders), keyed by name.
function github_files_in(array $snapshot, string $folder): array
{
    $files = [];
    foreach ($snapshot['files'] as $file) {
        if (!str_starts_with($file['path'], "$folder/")) {
            continue;
        }
        $name = substr($file['path'], strlen($folder) + 1);
        if (!str_contains($name, '/')) {
            $files[$name] = $file;
        }
    }
    ksort($files);
    return $files;
}

function github_blob(string $sha): string
{
    $blob = github('GET', "/git/blobs/$sha");
    return base64_decode(str_replace("\n", '', $blob['content']));
}

function github_list(string $section): array
{
    $counts = [];
    foreach (github_snapshot()['files'] as $file) {
        $parts = explode('/', $file['path']);
        if (count($parts) === 4 && $parts[0] === 'content' && $parts[1] === $section) {
            $counts[$parts[2]] = ($counts[$parts[2]] ?? 0) + 1;
        }
    }

    $entries = [];
    foreach ($counts as $slug => $count) {
        $entries[] = ['slug' => (string) $slug, 'files' => $count];
    }
    return $entries;
}

function github_get(string $folder): array
{
    $files = [];
    foreach (github_files_in(github_snapshot(), $folder) as $name => $file) {
        $entry = ['name' => $name, 'size' => $file['size'] ?? 0];
        if (is_text_file($name)) {
            $entry['text'] = github_blob($file['sha']);
        }
        $files[] = $entry;
    }
    return $files;
}

function github_read(string $folder, string $name): string
{
    $files = github_files_in(github_snapshot(), $folder);
    if (!isset($files[$name])) {
        send_error(404, 'File not found.');
    }
    return github_blob($files[$name]['sha']);
}

// A commit through the API: upload each file ("blob"), describe the new folder
// contents ("tree"), make a commit pointing at it, then move the branch to that commit.
function github_commit(array $snapshot, array $changes, string $message): string
{
    $tree = github('POST', '/git/trees', ['base_tree' => $snapshot['tree'], 'tree' => $changes]);
    $commit = github('POST', '/git/commits', [
        'message' => $message,
        'tree' => $tree['sha'],
        'parents' => [$snapshot['commit']],
    ]);
    github('PATCH', '/git/refs/heads/' . github_branch(), ['sha' => $commit['sha']]);
    return $commit['sha'];
}

function github_save(string $folder, array $files, array $delete, string $message): string
{
    $snapshot = github_snapshot();
    $existing = github_files_in($snapshot, $folder);
    $changes = [];

    foreach ($files as $file) {
        $blob = github('POST', '/git/blobs', ['content' => base64_encode(file_contents($file)), 'encoding' => 'base64']);
        $changes[] = ['path' => "$folder/{$file['name']}", 'mode' => '100644', 'type' => 'blob', 'sha' => $blob['sha']];
    }

    $written = array_column($files, 'name');
    foreach ($delete as $name) {
        if (isset($existing[$name]) && !in_array($name, $written, true)) {
            // A null sha removes the file.
            $changes[] = ['path' => "$folder/$name", 'mode' => '100644', 'type' => 'blob', 'sha' => null];
        }
    }

    return github_commit($snapshot, $changes, $message);
}

function github_delete(string $folder, string $message): string
{
    $snapshot = github_snapshot();
    $changes = [];
    foreach ($snapshot['files'] as $file) {
        if (str_starts_with($file['path'], "$folder/")) {
            $changes[] = ['path' => $file['path'], 'mode' => $file['mode'], 'type' => 'blob', 'sha' => null];
        }
    }
    if (!$changes) {
        send_error(404, 'Not found.');
    }
    return github_commit($snapshot, $changes, $message);
}

function recent_deploys(): array
{
    if (is_dry_run()) {
        return [];
    }

    $workflow = config('github.workflow', 'deploy.yml');
    $response = github('GET', "/actions/workflows/$workflow/runs?per_page=3&branch=" . github_branch());

    return array_map(fn($run) => [
        'status' => $run['status'],
        'conclusion' => $run['conclusion'],
        'startedAt' => $run['created_at'],
        'url' => $run['html_url'],
    ], $response['workflow_runs'] ?? []);
}
