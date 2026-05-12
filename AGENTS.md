# AGENTS.md

## Commands

- Use `pnpm install`; this repo has `pnpm-lock.yaml` and a `postinstall` step that runs `electron-builder install-app-deps`.
- Dev server: `pnpm dev` (`electron-vite dev`). Preview a built app with `pnpm start`.
- Main verification: `pnpm lint`, `pnpm typecheck`, then `pnpm build` when packaging output is not needed.
- `pnpm typecheck` runs both `tsconfig.node.json` for `src/main`/`src/preload` and `tsconfig.web.json` for the renderer.
- There is no test script configured; do not invent `pnpm test` as a verification step.
- Package builds: `pnpm build:win`, `pnpm build:mac`, `pnpm build:linux`; only `build` and `build:win` currently include the typecheck script first.

## Architecture Notes

- This is an Electron + electron-vite + React app, not a browser-only Vite app.
- Main process entry is `src/main/index.ts`; renderer entry is `src/renderer/src/main.tsx`; preload is `src/preload/index.ts`.
- The renderer uses `HashRouter`; the main process opens `#/settings` in the settings window and `#/pad` in the floating keyboard window.
- Renderer alias `@renderer/*` maps to `src/renderer/src/*` in both `electron.vite.config.ts` and `tsconfig.web.json`.
- Tailwind is v4, loaded through `@tailwindcss/vite` and `@import "tailwindcss"` in `src/renderer/src/assets/main.css`.

## Electron/Platform Gotchas

- The app simulates keyboard input from the main process with `koffi` loading `user32.dll`; that behavior is Windows-specific even though builder config contains macOS/Linux targets.
- The floating pad window is frameless, transparent, always-on-top, and `focusable: false`; preserve click and drag behavior when changing pad UI.
- Only the left grip area in `pad.tsx` should use `WebkitAppRegion: 'drag'`; interactive controls need `no-drag`.
- User settings persist to `corepad-config.json` under Electron `app.getPath('userData')` and are synchronized over IPC with `get-config`, `set-config`, and `config-updated`.
- The preload currently exposes `window.electron` from `@electron-toolkit/preload`; update `src/preload/index.d.ts` if changing exposed renderer globals.

## Style/Tooling

- Formatting is Prettier with single quotes, no semicolons, `printWidth: 100`, and no trailing commas.
- ESLint ignores `node_modules`, `dist`, and `out`; do not edit generated build output there.
- Source comments and UI text are currently mixed Spanish/English; match nearby code rather than normalizing language in unrelated changes.
