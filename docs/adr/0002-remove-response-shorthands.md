# ADR-0002: Remove Response Builder Shorthands

**Status:** Accepted  
**Date:** 2026-05-12  
**Context:** Deepening opportunity — remove shallow modules

## Decision

Delete `response.ts` and its four functions (`createResponse`, `okResponse`, `createdResponse`, `errorResponse`). Consumers construct `{ status, data, description }` objects directly.

## Consequences

- 4 fewer exported functions to maintain
- No loss of expressiveness — the object literal is trivial
- Tests reduced by 10 (all shallow pass-through tests)

## Alternatives Considered

- Keep shorthands — rejected because they earned no keep (deletion test: complexity vanished, nothing reappeared)
- Replace with fluent builder — rejected because the added complexity wasn't justified by the use case
