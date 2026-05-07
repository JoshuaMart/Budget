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

| Commande           | Effet                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `pnpm dev`         | Lance le serveur de dev (Vite) sur http://localhost:5173                                      |
| `pnpm build`       | Build de production (`build/` exécutable avec Bun)                                            |
| `pnpm preview`     | Sert le build local                                                                           |
| `pnpm check`       | `svelte-check` + TypeScript strict                                                            |
| `pnpm lint`        | Prettier --check + ESLint                                                                     |
| `pnpm format`      | Prettier --write                                                                              |
| `pnpm db:generate` | Génère une migration Drizzle à partir des changements de schéma                               |
| `pnpm db:migrate`  | Applique les migrations en attente                                                            |
| `pnpm db:seed`     | Crée un utilisateur démo (`demo@budget.local` / `Budget123!`) avec les données de la maquette |
| `pnpm db:studio`   | Ouvre Drizzle Studio sur la DB locale                                                         |
| `pnpm test:unit`   | Tests unitaires Vitest                                                                        |
| `pnpm test:e2e`    | Tests E2E Playwright                                                                          |
| `pnpm test`        | Suite complète                                                                                |

## Docker (production)

```sh
# 1. Build the image
docker build -t budget:latest .

# 2. Run with a persistent volume for the SQLite DB.
#    BETTER_AUTH_SECRET MUST be set; ORIGIN should match your public URL.
docker run -d --name budget \
  -p 3000:3000 \
  -e BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  -e ORIGIN=https://budget.example.com \
  -e ENABLE_SIGNUP=false \
  -v budget-data:/app/data \
  budget:latest
```

The image is a 3-stage Bun build (build → prod-deps → minimal runtime), runs as
non-root user `budget` (uid 1001), exposes port 3000, and persists SQLite under
`/app/data` (declared as a Docker volume). Migrations run automatically on
startup via `hooks.server.ts`.
