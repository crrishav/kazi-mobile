@AGENTS.md

# kazi-mobile

## What this is
A React Native (Expo) rebuild of the ERP app at [jenithroy/kazi-app](https://github.com/jenithroy/kazi-app). Goal is feature parity with that repo — same data/functionality — reimplemented as a mobile app.

## Current phase: functionality first, UI later
UI/visual design is deliberately out of scope for now — screens will be designed in Google Stitch and implemented from those designs later. Until then:
- Don't polish styling, theming, or visual layout.
- Focus on project structure, navigation, data models, and data fetching so the app is functionally correct underneath plain/unstyled screens.
- Skip the UI-focused skills below until Stitch designs exist.

## Stack
- Expo ~57, React 19.2, React Native 0.86, TypeScript
- No router installed yet — plan is `expo-router` (file-based routing)

## Skills installed (global, `~/.agents/skills/`)
Relevant now (non-UI):
- `expo-project-structure` — folder/file layout for a new Expo Router app
- `expo-router` — file-based routing, tabs, modals
- `expo-data-fetching` — API calls, caching, offline handling
- `react-native-best-practices` — perf: re-renders, bundle size, Hermes
- `vercel-react-native-skills` — general RN/Expo component & native-API patterns

Deferred until Stitch designs land:
- `expo-native-ui`, `expo-design-system`, `expo-tailwind-setup`, `mobile-app-ui-design`

## Source of truth for scope
Reference [jenithroy/kazi-app](https://github.com/jenithroy/kazi-app) for what modules/data/features the ERP needs to support.
