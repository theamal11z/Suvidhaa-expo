# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repository scope and entry points
- This repo contains an Expo React Native app in frontend/. Run all app commands from that directory.
- Supabase Edge Functions used by the app also live under frontend/supabase/functions/.

Common commands (run from frontend/)
- Install dependencies
  - npm install
- Start development server (Expo)
  - npm start
  - Platform shortcuts from Expo Dev Tools/terminal: a (Android), i (iOS), w (web), r (reload)
  - Platform-specific start: npm run android | npm run ios | npm run web
- Lint
  - npm run lint
- Type-check (no emit)
  - npx tsc --noEmit
- Reset starter example (one-time utility)
  - npm run reset-project
- Supabase (Edge Functions and DB)
  - Deploy all functions: npm run supabase:deploy
  - Deploy specific: npm run supabase:deploy:ai | npm run supabase:deploy:cloudinary
  - Push DB schema: npm run supabase:push
- Tests
  - No test runner is configured in this repo (no test script in package.json, no jest/vitest config). If a test setup is added later, prefer single-test runs via the runner’s filter flag (e.g., npx jest path/to/file.test.tsx -t "Test name").

Builds and releases
- EAS builds are referenced in existing project docs but eas.json is not present in this repo. If/when EAS is configured, typical commands are:
  - Install EAS CLI: npm i -g eas-cli
  - Configure: eas build:configure
  - Build: eas build --platform android | eas build --platform ios

High-level architecture
- Framework/runtime
  - Expo SDK 54, React Native 0.79, React 19
  - Expo Router for file-based routing (experiments.typedRoutes enabled; newArchEnabled true in app.json)
  - Web targets Metro bundler (app.json: web.bundler = "metro")
- Routing and screens (Expo Router)
  - app/ is the route tree. The (tabs)/ group defines the bottom tab navigation; layouts via _layout.tsx files.
  - Dynamic routes: e.g., app/policy/[id].tsx and app/questions/category/[category].tsx
  - Core flows reflected in route files: understand.tsx (policy comprehension), ask-ai.tsx and ask-suggest.tsx (Q&A and suggestions), file-complaint.tsx (tickets), track-progress.tsx, onboarding/login/signup, notifications, watchlist, profile.
- Data and service layer (frontend/lib)
  - supabase.ts: creates/configures Supabase client used across features (auth, DB, RPC).
  - ai.ts: client that talks to an Edge Function (llm-proxy) for NVIDIA-powered LLM operations.
  - cloudinary.ts: upload helper leveraging a signed payload from the Cloudinary signing Edge Function.
  - Domain utilities: policies.ts, tickets.ts, notifications.ts, quickActions.ts, watchlist.ts centralize calls and data transforms.
  - hooks/: e.g., hooks/useNotificationCount.ts encapsulates screen-facing data patterns.
  - config.ts: central application config and env wiring.
- Supabase Edge Functions (frontend/supabase/functions)
  - cloudinary-sign-upload: returns short-lived signature for direct Cloudinary uploads from the client.
  - llm-proxy: forwards AI prompts/messages to NVIDIA model (model name configurable via secret), returning chat completion JSON.
  - Project references and secret management are expected to be set via Supabase CLI (see frontend/supabase/functions/README.md and existing WARP guidance under frontend/).
- Configuration
  - app.json: app metadata and per-platform settings; enables New Architecture and splash config; web output is static.
  - tsconfig.json: extends Expo defaults; strict mode; path alias @/* to project root for clean imports.
  - metro.config.js: custom Metro settings (cache/workers) tuned for local stability.
  - eslint.config.js: linting via eslint-config-expo; scripts expose npm run lint.
- Environment variables
  - Client-readable values use EXPO_PUBLIC_ prefix (e.g., EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY).
  - Server-only secrets (e.g., NVIDIA_API_KEY, Cloudinary API secret) must be stored as Supabase Function secrets, not in the client bundle.

Notes for agents
- Working directory: cd frontend before running npm scripts; the repository root does not have its own package.json.
- Package manager: package.json declares Yarn (packageManager: yarn@1.22.x) but package-lock.json exists. Prefer one tool consistently. These instructions assume npm.
- When invoking Supabase commands that require a project ref, supply --project-ref where applicable or link the directory first (supabase link).

Important excerpts from existing docs
- frontend/README.md
  - Get started: npm install, then npx expo start. File-based routing under app/.
  - reset-project: npm run reset-project moves starter example out and creates a blank app directory.
- frontend/supabase/functions/README.md
  - Secrets to set for Cloudinary and NVIDIA; deploy via supabase functions deploy <name> and test via supabase functions invoke with --no-verify-jwt in development.

Suggested improvements to frontend/WARP.md (do not duplicate here; update in that file)
- Use a relative path for setup: replace cd /home/.../Suvidhaa-expo/frontend with cd frontend to avoid user-specific absolute paths.
- Package manager consistency: either remove package-lock.json and use Yarn (declared in package.json) or switch guidance/scripts to npm and remove the Yarn pin in package.json.
- Clarify EAS configuration: add eas.json to the repo or explicitly note that EAS examples assume global CLI and a configured project.
- Add a scripts entry for type-check (e.g., "typecheck": "tsc --noEmit") since you recommend running it.
- Testing: there is no test setup; either add a test runner (e.g., Jest + React Native presets) and expose scripts (test, test:watch), or remove test references.
