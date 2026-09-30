# Ability Wallet

A mobile banking app for people with disabilities and the family members or
caregivers who support them.

The app has two sides:

- **Member**: the person who owns the money. They get a debit card, see where
  their money goes, save toward goals, and keep their ABLE account and benefits
  on track.
- **Navigator**: a trusted supporter, such as a parent or caregiver. They set
  budgets and spending limits, get alerts, send money, and help when something
  goes wrong.

The Member stays in charge. Loosening a rule takes effect right away, but the
Navigator can't tighten a limit or block a shop until the Member agrees.

## Features

- Sign-up for both sides, including inviting a Navigator by email
- Home, Card, Spend, Save and Account tabs for Members
- Home, Activity, Plan and Account tabs for Navigators
- Budgets with spending limits per category, shown as progress rings
- A card engine that approves or declines purchases against the budget, with
  plain-language notices when something doesn't go through
- A support-level dial that controls how much help the Member gets
- Consent rules that apply to both sides, including blocking shops
- Alerts, such as nearing the $2,000 benefits limit or rent waiting in checking
- Moving money into an ABLE account, emergency money, and Navigator transfers
- A lost-card flow that issues a replacement card
- Real-time chat between the Member and the Navigator
- Testing tools that simulate purchases, paydays and other scenarios

## Built with

- **App:** React Native, Expo, Expo Router, TypeScript
- **Data:** TanStack Query
- **Backend:** Supabase (Postgres, Auth, Realtime), with row-level security
  on every table
- **Business logic:** Postgres functions and scheduled jobs, in
  `supabase/migrations`

## Project layout

```
app/                   screens (Expo Router)
  (auth)/              welcome, sign-in, sign-up, invites
  (member)/            Member tabs and screens
  (navigator)/         Navigator tabs and screens
src/components/        shared UI
src/features/          larger pieces: card, chat, budget rings, testing tools
src/lib/               Supabase client, session, formatting, database types
supabase/migrations/   database schema, security policies and backend logic
scripts/               seed data, an end-to-end smoke test, a SQL helper
```

## Running it

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a `.env` file with your Supabase project details:

   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. Apply the database migrations to your Supabase project:

   ```sh
   SUPABASE_DB_PASSWORD=... SUPABASE_PROJECT_REF=... npm run db
   ```

4. Start the app:

   ```sh
   npx expo run:ios
   ```

## Testing

`scripts/smoke.mjs` runs an end-to-end check against the backend. It creates
two test accounts, walks through the invite flow, runs purchases, confirms that
security rules keep strangers out, tests the consent rules, and then deletes
everything it created.

```sh
SUPABASE_DB_PASSWORD=... node scripts/smoke.mjs
```

## Status

The app includes onboarding, the card engine, consent rules, money movement
and alerts. Still to come: the AI helper in chat, push notifications, and an
accessibility and design polish pass.
