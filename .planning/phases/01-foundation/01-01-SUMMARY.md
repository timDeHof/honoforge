# Plan 01-01 Summary — Scaffold @honoforge/core

## Objective
Scaffold `@honoforge/core` package with proper monorepo structure, peer dependencies, build tooling, and CI-ready configuration.

## What Was Built
- **packages/core/package.json** — Package identity with `@honoforge/core` name, peer dep on `hono >=4.10.0`, provenance-enabled publishConfig, @hono/*-style dual ESM/CJS exports
- **packages/core/tsconfig.json** — Strict TypeScript config extending ESNext target with Bundler moduleResolution
- **packages/core/tsconfig.build.json** — Build-specific tsconfig extending base
- **packages/core/tsdown.config.ts** — Build config with attw + publint validation, dual CJS/ESM + DTS output
- **packages/core/src/index.ts** — Barrel exports for http-status-codes, http-status-phrases, types, storage
- **packages/core/README.md** — Package description
- **pnpm-workspace.yaml** — Workspace config recognizing `packages/*`
- **Root package.json** — Updated to `private: true`, removed single-package exports/types/files, delegated scripts to `pnpm -r`

## Key Decisions
- **Exports use `.mjs`/`.cjs` extensions** — tsdown's default output format; package.json exports aligned accordingly
- **Installed `@arethetypeswrong/core`** — Required for attw validation in tsdown config
- **Stub source files created** — Minimal stubs for types.ts, storage.ts, http-status-codes.ts, http-status-phrases.ts so build pipeline verifies; actual content populated by Plans 01-02 and 01-03

## Verification
- `pnpm install` — ✅ completes without errors
- `pnpm build` in packages/core — ✅ exits 0
- `attw` — ✅ No problems found
- `publint` — ✅ passes (only warns about missing engines.node, acceptable)
- Dist artifacts — ✅ index.mjs, index.cjs, index.d.mts, index.d.cts all present

## Self-Check: PASSED
