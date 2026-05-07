<img width="1500" height="250" alt="Budget" src="https://github.com/user-attachments/assets/2c25677c-dc77-496b-9047-092e0269d584" />

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License%20MIT-111111?style=for-the-badge&logo=unlicense&logoColor=#FFF"></a>
  <img src="https://img.shields.io/badge/SvelteKit-111111?style=for-the-badge&logo=svelte&logoColor=FF3E00">
  <img src="https://img.shields.io/badge/Bun-111111?style=for-the-badge&logo=bun&logoColor=FBF0DF">
  <img src="https://img.shields.io/badge/TypeScript-111111?style=for-the-badge&logo=typescript&logoColor=3178C6">
  <img src="https://img.shields.io/badge/SQLite-111111?style=for-the-badge&logo=sqlite&logoColor=003B57">
  <img src="https://img.shields.io/badge/Drizzle-111111?style=for-the-badge&logo=drizzle&logoColor=C5F74F">
  <img src="https://img.shields.io/badge/pnpm-111111?style=for-the-badge&logo=pnpm&logoColor=F69220">
  <img src="https://img.shields.io/badge/Docker-111111?style=for-the-badge&logo=docker&logoColor=2496ED">
</p>

---

# Budget

A self-hosted personal finance tracker built around the **50/30/20** budgeting method — split your income into Needs, Wants, and Savings, and watch every transaction land in the right bucket automatically.

> 🇫🇷 **The app UI is in French.** This README is in English so contributors can get started quickly; the product itself targets French-speaking users.

## Why Budget?

- **Variable income friendly** — budgets are derived from your actual monthly income, not a fixed reference number.
- **Own your data** — runs locally or on your own server. SQLite file, no cloud.
- **One container to ship** — single Docker image, persistent volume, done.
- **Modern stack** — SvelteKit + Bun, strict TypeScript, type-safe DB with Drizzle.

## Quick start

```sh
pnpm install
cp .env.example .env          # then fill in BETTER_AUTH_SECRET
pnpm db:migrate
pnpm db:seed                  # optional: demo user + sample data
pnpm dev                      # http://localhost:5173
```

Demo credentials (after `db:seed`): `demo@budget.local` / `Budget123!`

## Requirements

- [Bun](https://bun.sh) ≥ 1.3 — runtime
- [Node.js](https://nodejs.org) ≥ 22 — toolchain
- [pnpm](https://pnpm.io) ≥ 10 — package manager

<details>
<summary><strong>All scripts</strong></summary>

| Command            | What it does                                       |
| ------------------ | -------------------------------------------------- |
| `pnpm dev`         | Start the Vite dev server on http://localhost:5173 |
| `pnpm build`       | Production build (`build/`, runnable with Bun)     |
| `pnpm preview`     | Serve the production build locally                 |
| `pnpm check`       | `svelte-check` + strict TypeScript                 |
| `pnpm lint`        | Prettier `--check` + ESLint                        |
| `pnpm format`      | Prettier `--write`                                 |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes   |
| `pnpm db:migrate`  | Apply pending migrations                           |
| `pnpm db:seed`     | Create the demo user and sample data               |
| `pnpm db:studio`   | Open Drizzle Studio against the local DB           |
| `pnpm test:unit`   | Vitest unit tests                                  |
| `pnpm test:e2e`    | Playwright end-to-end tests                        |
| `pnpm test`        | Full test suite                                    |

</details>

## Deploy with Docker

```sh
# 1. Build the image
docker build -t budget:latest .

# 2. Run with a persistent volume for SQLite.
#    BETTER_AUTH_SECRET MUST be set; ORIGIN must match your public URL.
docker run -d --name budget \
  -p 3000:3000 \
  -e BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  -e ORIGIN=https://budget.example.com \
  -e ENABLE_SIGNUP=false \
  -v budget-data:/app/data \
  budget:latest
```
