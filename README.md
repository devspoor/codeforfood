# CodeForFood

A payment-tracking app for freelancers and developers. Track project payments,
break work into payable milestones, and share live payment status with clients
through public links — no client login required.

## Features

- **Organizations & projects** — group work under organizations, each with its own public share link
- **Payment milestones** — split projects into stages with partial-payment support and progress tracking
- **Invoices** — create, send, and export invoices as PDF, with payment reminders
- **Payment methods** — crypto, bank, and custom payout details shown on public pages
- **Time tracking & operating expenses** — log billable time and project costs
- **Secure notes** — client-side AES‑256‑GCM encrypted notes, password-derived keys
- **Public pages** — shareable, optionally password-protected project/organization/invoice pages
- **Task boards** — Trello-style boards with columns, checklists, and attachments
- **Telegram bot** — connect projects to chats for updates and quick commands
- **AI assist** — milestone generation, project summaries, and Q&A (0G Compute or OpenAI)
- **Subscriptions** — Paddle billing with tiered plan limits
- **Dashboard** — revenue charts, upcoming deadlines, multi-currency, and tax summaries

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [Base UI](https://base-ui.com/)
- [Supabase](https://supabase.com/) — Postgres, Auth, Storage, RLS
- [Paddle](https://www.paddle.com/) — billing & subscriptions
- [Resend](https://resend.com/) + React Email — transactional email
- [grammY](https://grammy.dev/) — Telegram bot
- [0G Compute](https://0g.ai/) / [OpenAI](https://openai.com/) — AI features
- react-pdf, dnd-kit, Recharts

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in your values (see Environment variables below)

# 3. Apply database migrations
# Run the SQL files in supabase/migrations/ against your Supabase project
# (e.g. via the Supabase SQL editor or CLI)

# 4. Run the dev server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values. Key variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server only) |
| `PADDLE_API_KEY` / `PADDLE_WEBHOOK_SECRET` | Paddle billing (server) |
| `NEXT_PUBLIC_PADDLE_*` | Paddle client token, env, and price IDs |
| `RESEND_API_KEY` / `EMAIL_DOMAIN` | Transactional email |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_WEBHOOK_SECRET` | Telegram bot |
| `OPENAI_API_KEY` / `ZERO_G_PRIVATE_KEY` / `ZERO_G_RPC_URL` | AI features |
| `CRON_SECRET` | Auth for scheduled cron endpoints |

> All secrets are read from the environment — never commit `.env*` files.

## Deployment

Runs as a standard Next.js app on any Node host (VPS, container, etc.). A
`Dockerfile` is included. Set the environment variables above on your host and
run `npm run build && npm run start`.

## License

Open source under the [MIT License](LICENSE) — free to use, modify, and
distribute, for any purpose including commercial use. See the [LICENSE](LICENSE)
file for details.
