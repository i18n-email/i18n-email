# docs

Documentation site for [i18n-email](https://i18n.email), built with [Fumadocs](https://fumadocs.dev) on [TanStack Start](https://tanstack.com/start).

## Stack

- **Framework** — TanStack Start
- **Docs** — Fumadocs UI + MDX
- **Styles** — Tailwind CSS v4
- **Syntax highlighting** — Shiki (Vesper / Vitesse Light)
- **Linter** — Biome

## Development

```bash
bun install
bun dev
```

Opens at [http://localhost:3000](http://localhost:3000).

## Build

```bash
bun run build
```

Output is written to `.output/`.

## Preview

```bash
bun start
```

Runs the production server locally from `.output/server/index.mjs`.

## Content

All documentation pages live in `content/docs/` as MDX files. Sidebar order is controlled by `content/docs/meta.json`.

| File                | Page          |
| ------------------- | ------------- |
| `index.mdx`         | Introduction  |
| `installation.mdx`  | Installation  |
| `usage.mdx`         | Usage         |
| `caching.mdx`       | Caching       |
| `api-reference.mdx` | API Reference |
