# @honoforge/core

## 0.1.0

### Minor Changes

- feat: scaffold @honoforge/core with status code utilities, HTTP constants, and
  type helpers

  - `status-codes.ts`: 600+ HTTP status codes with phrase lookup, category
    checks (isSuccess, isClientError, etc.)
  - `http-statuses.ts`: HTTP status phrase constants (CONTINUE,
    SWITCHING_PROTOCOLS, etc.)
  - `http-phrase.ts`: Runtime HTTP phrase utilities
  - `types.ts`: Core TypeScript type utilities (MaybePromise, DeepPartial, etc.)
  - Full test suite (23 tests) with cross-runtime verification
