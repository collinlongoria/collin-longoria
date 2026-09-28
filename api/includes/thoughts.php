<?php
// Mirrors src/shared/thought-text.ts. If you change one, change the other.

const MAX_THOUGHT_LENGTH = 280;
const MAX_FEELING_LENGTH = 80;
const MAX_POST_ATTEMPTS = 5;

function cross_post_text(string $body, ?string $feeling): string
{
    $text = trim($body);
    $feeling = trim((string) $feeling);
    return $feeling === '' ? $text : "$text\n\nCurrently feeling $feeling";
}

// Counts like X does: links are 23, CJK characters and emoji are 2, everything else 1.
function post_length(string $text): int
{
    $length = 0;

    $text = preg_replace_callback('~\bhttps?://\S+|\bwww\.\S+~iu', function () use (&$length) {
        $length += 23;
        return '';
    }, $text);

    if (class_exists('Normalizer')) {
        $text = Normalizer::normalize($text, Normalizer::FORM_C);
    }

    // By grapheme, so a multi-codepoint emoji (👨‍👩‍👧) counts once.
    $graphemes = function_exists('grapheme_str_split')
        ? grapheme_str_split($text)
        : preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY);

    foreach ($graphemes as $grapheme) {
        if (preg_match('/\p{Extended_Pictographic}/u', $grapheme)) {
            $length += 2;
            continue;
        }
        foreach (preg_split('//u', $grapheme, -1, PREG_SPLIT_NO_EMPTY) as $char) {
            $code = mb_ord($char);
            $narrow = $code <= 4351
                || ($code >= 8192 && $code <= 8205)
                || ($code >= 8208 && $code <= 8223)
                || ($code >= 8242 && $code <= 8247);
            $length += $narrow ? 1 : 2;
        }
    }

    return $length;
}

function find_thought(int $id): ?array
{
    $row = query('SELECT * FROM thoughts WHERE id = ?', [$id])->fetch();
    return $row ?: null;
}

// Error messages and attempt counts stay server-side.
function thought_json(array $row): array
{
    $realXPost = $row['x_id'] && $row['x_id'] !== 'dry-run';

    return [
        'id' => (int) $row['id'],
        'body' => $row['body'],
        'feeling' => $row['feeling'],
        'createdAt' => to_iso($row['created_at']),
        'xUrl' => $realXPost ? 'https://x.com/i/web/status/' . $row['x_id'] : null,
        'threadsUrl' => $row['threads_url'],
        'xStatus' => $row['x_status'],
        'threadsStatus' => $row['threads_status'],
    ];
}

// Tries each network that's still pending or failed. The thought itself is already
// saved, so a failure just gets recorded, and cron tries again later.
function cross_post(int $id): array
{
    $thought = find_thought($id);
    $text = cross_post_text($thought['body'], $thought['feeling']);

    if (should_post($thought['x_status'], $thought['x_attempts'])) {
        try {
            $post = post_to_x($text);
            query(
                "UPDATE thoughts SET x_status = 'posted', x_id = ?, x_error = NULL, x_attempts = x_attempts + 1
                 WHERE id = ?",
                [$post['id'], $id]
            );
        } catch (Throwable $error) {
            query(
                "UPDATE thoughts SET x_status = 'failed', x_error = ?, x_attempts = x_attempts + 1 WHERE id = ?",
                [substr($error->getMessage(), 0, 500), $id]
            );
        }
    }

    if (should_post($thought['threads_status'], $thought['threads_attempts'])) {
        try {
            $post = post_to_threads($text);
            query(
                "UPDATE thoughts SET threads_status = 'posted', threads_id = ?, threads_url = ?, threads_error = NULL,
                 threads_attempts = threads_attempts + 1 WHERE id = ?",
                [$post['id'], $post['url'], $id]
            );
        } catch (Throwable $error) {
            query(
                "UPDATE thoughts SET threads_status = 'failed', threads_error = ?, threads_attempts = threads_attempts + 1
                 WHERE id = ?",
                [substr($error->getMessage(), 0, 500), $id]
            );
        }
    }

    return find_thought($id);
}

function should_post(string $status, int|string $attempts): bool
{
    return ($status === 'pending' || $status === 'failed') && (int) $attempts < MAX_POST_ATTEMPTS;
}
