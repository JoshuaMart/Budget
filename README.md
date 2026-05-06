# Budget

Application de suivi de dépenses et de budgets personnels basée sur la méthode **50/30/20**.

Voir [`SPECIFICATIONS.md`](./SPECIFICATIONS.md) pour les specs fonctionnelles et [`TODO.md`](./TODO.md) pour la roadmap d'implémentation.

## Stack

SvelteKit · Bun (runtime) · SQLite + Drizzle ORM · better-auth · TypeScript strict · pnpm.

## Prérequis

- [Bun](https://bun.sh) ≥ 1.3
- Node.js ≥ 20 (pour les outils du toolchain)
- [pnpm](https://pnpm.io) ≥ 10

## Setup

```sh
pnpm install
cp .env.example .env   # puis remplir BETTER_AUTH_SECRET
```

## Commandes

| Commande         | Effet                                                    |
| ---------------- | -------------------------------------------------------- |
| `pnpm dev`       | Lance le serveur de dev (Vite) sur http://localhost:5173 |
| `pnpm build`     | Build de production (`build/` exécutable avec Bun)       |
| `pnpm preview`   | Sert le build local                                      |
| `pnpm check`     | `svelte-check` + TypeScript strict                       |
| `pnpm lint`      | Prettier --check + ESLint                                |
| `pnpm format`    | Prettier --write                                         |
| `pnpm test:unit` | Tests unitaires Vitest                                   |
| `pnpm test:e2e`  | Tests E2E Playwright                                     |
| `pnpm test`      | Suite complète                                           |
