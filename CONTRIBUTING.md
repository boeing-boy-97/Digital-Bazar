# Contributing to Digital Bazar

## Development Setup
```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

## Project Structure
- `app/` - Next.js App Router pages and API routes
- `components/` - Reusable UI components
- `lib/` - Business logic, auth, payments, AI, etc.
- `styles/` - Design system
- `prisma/` - Database schema
- `docs/` - Documentation
- `tests/` - Tests
- `scripts/` - Seed scripts

## Code Quality
- TypeScript strict mode
- ESLint + Prettier
- Zod validation client + server
- No `any` unless justified
- Clean naming, no hardcoded IDs/prices

## Commits
- Use conventional commits: feat, fix, docs, chore
- No secrets committed
- Keep PRs focused on vertical slices (auth, orders, payments, AI)

## Testing
- Unit: inventory, cart, state machine, tax
- Integration: order creation, payment webhooks
- E2E: customer, shopkeeper, admin flows

## Security
- Never expose secrets in frontend
- RBAC checks on every relevant query
- Audit logs for critical actions
- Validate file uploads

## AI
- Grounded in real DB, never invent prices
- Permission-aware tools
- Log tool calls
- Prompt injection defense

## Questions?
Open an issue or check docs/.
