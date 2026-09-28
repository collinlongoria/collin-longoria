# collinlongoria.com

My personal site: games, stories, blog, devlogs, thoughts and a guestbook.

Static pages built from markdown with a small TypeScript build script, plus a few PHP files for
the parts that change live. Hosted on Hostinger, deployed by GitHub Actions.

## Quick start

Needs Node 24 and PHP 8.4:

```sh
winget install OpenJS.NodeJS.LTS
winget install PHP.PHP.8.4
```

Then, in a new terminal:

```sh
npm install
npm run dev:examples
```

Open http://localhost:4321. Everything works locally as a dry run: log in with the password `dev`;
posts to X/Threads and emails go to `data/dry-run.log` instead of being sent, and publishing writes
into `examples/content/`.

## Commands

| | |
|---|---|
| `npm run dev` | Local site with your real `content/` |
| `npm run dev:examples` | Local site with placeholder content |
| `npm run build` | Build the site into `dist/` |
| `npm run check` | Type-check the TypeScript |
| `npm run format` | Format the code with Prettier |
| `npm run hash-password` | Make the admin password hash for `site-config.php` |

## Docs

- [docs/GUIDE.md](docs/GUIDE.md): how everything works, PHP from zero, writing content, deploying, server setup
- [docs/DESIGN.md](docs/DESIGN.md): colors, fonts, layout; Figma exports in `docs/frames/`
