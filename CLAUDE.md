# CLAUDE.md

Guidance for working in this repo.

## What this is

`minuteos/vs-extension` is the VS Code companion extension for minuteOS
projects. It drives the make-based build, exposes a target picker, and
flashes firmware by calling into the sibling `minuteos/vs-debugger`
extension's programmatic API. It does **not** implement probe
communication — that lives in `vs-debugger`.

## Layout

- `src/` is organized by domain. Each concern gets its own folder:
  `make/`, `services/`, `util/`. Top-level files are reserved for
  cross-cutting pieces like `configuration.ts`, `settings.ts`,
  `defaults.ts`, `errors.ts`, `extension.ts`, `commands.ts`, `flash.ts`,
  `status-bar.ts`.
- New functionality that spans multiple existing domains gets its own
  folder rather than living at the root.
- `services/` and `util/` re-export through `index.ts`; other folders
  export through their files directly. Use `@my/<folder>/<file>` from
  outside, relative `./<file>` from inside the same folder.

## Style

- No semicolons, single quotes, 2-space indent. `@stylistic/eslint-plugin`
  with `braceStyle: '1tbs'` enforces the rest.
- `perfectionist/sort-imports` sorts imports alphabetically by module path,
  with `@my/*` treated as internal.
- Use the `@my/*` path alias (maps to `./src/*`) for cross-folder imports.
- Type-checked ESLint is strict — `tseslint.configs.strictTypeChecked` plus
  the `stylistic` variant.

## Conventions

- Logging goes through `getLog('Tag')` / `getTrace('tag')` from
  `@my/services`. Don't use `console.*` outside `extension.ts` activate /
  deactivate.
- Settings load through `configureSettings()` in `src/settings.ts`, which
  merges `vscode.workspace.getConfiguration('minute')` over `defaults` via
  `mergeDefaults` and freezes the result. Read the live values via the
  `settings` export; don't call `getConfiguration('minute')` directly.
- External processes (currently only `make`) stream output into a
  dedicated `vscode.OutputChannel`, not the extension log channel. Follow
  the pattern in `src/make/runner.ts`.
- Flashing goes through the sibling `minuteos.minute-debug` extension's
  programmatic `flash(options)` API. Don't allocate `DebugSession`s,
  register `DebugAdapterTracker`s, or call `vscode.debug.startDebugging`
  for flashing — that path was rejected in review and must not return.
- `minuteos.minute-debug` is declared as an `extensionDependency` in
  `package.json`; its activate return value is typed locally as
  `MinuteDebugApi` in `src/flash.ts`.
- Command handlers live in `src/commands.ts` and call into feature
  modules (`@my/make`, `@my/flash`, etc.). Keep command handlers thin;
  push real logic into the feature module.

## Scripts

- `npm run check-types` — `tsc --noEmit`
- `npm run lint` — `eslint src`
- `npm run compile` — check-types + lint + esbuild bundle

All three must pass. `lint-staged` runs ESLint on staged `.{js,mjs,ts}`
files via a husky pre-commit hook — don't bypass it.

## Activation

`extension.ts` activate wires the output channel, settings, status bar,
and commands. No public API is exported — this extension is a consumer,
not a library.

## Review

When addressing review feedback, **amend the corresponding commit** that
introduced the code under review rather than piling fixups on top. Use
`git commit --fixup <sha>` + `git rebase -i --autosquash` or
`git commit --amend` when the fix applies to the tip. Force-push the
branch with `--force-with-lease`. Keep history tidy so each commit stands
on its own.
