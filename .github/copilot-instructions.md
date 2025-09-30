# Copilot Instructions for Documind AI Chatbot

## Architecture Overview

This is a Nuxt 3 full-stack application for an AI-powered chatbot template, built with Nuxt UI and Vercel AI SDK.

- **Frontend Structure**: Uses Nuxt's file-based routing in `pages/`. `index.vue` serves as the landing page with model selection and chat initiation. `pages/chat/[id].vue` handles individual chat sessions, integrating streaming AI responses via `@ai-sdk/vue`.

- **Backend & API**: Nitro server routes in `server/api/`. Key endpoints: `chats.get.ts` (fetch user chats), `chats.post.ts` (create new chat), `chats/[id].get.ts`/`post.ts`/`delete.ts` for chat-specific operations. All routes use `defineEventHandler` and authenticate via `getUserSession` from nuxt-auth-utils.

- **Database**: PostgreSQL with Drizzle ORM. Schema defined in `server/database/schema.ts`: `users` (GitHub OAuth integration), `chats` (titled conversations linked to users), `messages` (user/assistant roles with JSON `parts` for content). Relations: users ↔ chats ↔ messages (cascade delete).

- **Data Flow**: Authenticate user → Fetch/create chats from DB → In chat view, use composables like `useChats.ts` for state → Send message → Stream AI response via AI SDK → Persist message to DB. Cross-component communication via composables (e.g., `useModels.ts` for provider selection) and `$fetch` for API calls.

- **Integrations**: 
  - Auth: GitHub OAuth (env: `NUXT_OAUTH_GITHUB_CLIENT_ID/SECRET`); Sessions with `NUXT_SESSION_PASSWORD`.
  - AI: Unified via Vercel AI Gateway (`AI_GATEWAY_API_KEY`); Supports multiple models with fallbacks.
  - UI: Nuxt UI components; MDC for markdown rendering (e.g., `components/prose/PreStream.vue` for streaming highlights).
  - Persistence: All chats/messages stored in DB for history.

The design prioritizes streaming responses and session persistence, with sidebar for chat history and model switching.

## Developer Workflows

- **Environment Setup**: `pnpm install`. Create `.env` with `DATABASE_URL` (PostgreSQL), `AI_GATEWAY_API_KEY`, `NUXT_SESSION_PASSWORD` (32+ chars), and GitHub OAuth vars if enabling auth. Run `pnpm db:migrate` to apply Drizzle migrations (initial: `0000_amusing_gunslinger.sql`).

- **Local Development**: `pnpm dev` launches on `http://localhost:3000`. Use Nuxt devtools for debugging; Enable view transitions via `nuxt.config.ts` experimental flag.

- **Database Changes**: Generate migrations with `pnpm db:generate` after schema updates in `server/database/schema.ts`. Apply with `pnpm db:migrate`. Connection via `server/utils/drizzle.ts` using `useDrizzle()`.

- **Build & Deploy**: `pnpm build` for production; `pnpm preview` to test. Deploys seamlessly to Vercel (zero-config with env vars). For DB, integrate Vercel Postgres.

- **Quality Checks**: `pnpm lint` (ESLint on all files); `pnpm typecheck` (Vue TSC). Post-install: `nuxt prepare` runs automatically.

- **Debugging Tips**: Inspect API with Nitro's experimental OpenAPI (`/api-docs`). Monitor DB queries in dev console. For AI streaming issues, check Gateway logs.

## Project Conventions & Patterns

- **TypeScript Usage**: Full TS; Infer DB types from schema (e.g., `type Chat = typeof schema.chats.$inferSelect`). Use `eq`, `and`, `desc` from Drizzle for queries. Composables return reactive refs (e.g., `useChats` sorts by `createdAt` desc).

- **API Route Patterns**: All handlers async with session check: `const session = await getUserSession(event);` then DB ops via `useDrizzle().select().from(tables.chats).where(eq(tables.chats.userId, session.user?.id || session.id))`. Return sorted arrays; Use JSON for message `parts`.

- **Component Patterns**: Reusable in `components/`: e.g., `ModelSelect.vue` for AI providers, `DashboardNavbar.vue` for layout. Prose components (`PreStream.vue`) handle Shiki-highlighted markdown streams. Layouts in `layouts/default.vue` with collapsible sidebar.

- **Styling & UI**: Global CSS in `assets/css/main.css`. Nuxt UI for buttons/forms; MDC config in `nuxt.config.ts` for JS-based Shiki engine (no API route). Dark/light mode via Nuxt color mode.

- **ESLint Specifics**: No trailing commas (`commaDangle: 'never'`); 1TBS brace style. Runs on `.` (all files). Ignore built deps in `pnpm-workspace.yaml`.

- **Auth & Security**: Fallback to session ID if no user; Provider enum limited to 'github'. Messages cascade delete with chats.

Example from `server/api/chats.get.ts`:
```ts
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  return (await useDrizzle().select().from(tables.chats)
    .where(eq(tables.chats.userId, session.user?.id || session.id)))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
})
```

Example composable pattern in `composables/useChats.ts` (inferred): Fetch via `$fetch('/api/chats')`, reactive store with add/update methods.

## Key Files & Directories

- `nuxt.config.ts`: Core config (modules, CSS, MDC Shiki, ESLint, Vite preserveModules).
- `server/database/schema.ts`: DB tables/relations; Update here for new entities.
- `server/utils/drizzle.ts`: DB client export; Use `useDrizzle()` in routes.
- `app.vue`: Root app with error handling (`error.vue`).
- `pages/chat/[id].vue`: Main chat logic; Integrates AI stream.
- `components/`: UI building blocks (e.g., `UserMenu.vue` for auth).
- `server/api/chats.get.ts`: Exemplifies auth + DB query pattern.

Focus edits on these for consistency. For new features, extend schema → migrate → update APIs/composables.
