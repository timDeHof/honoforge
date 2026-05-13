---
title: "Implement not-found handler"
date: 2026-05-12
priority: high
status: pending
---

## Description

Create a 404 not-found handler that returns a clean Problem Details response (`application/problem+json`) for unmatched routes.

## Requirements

- Returns RFC 9457 compliant Problem Details with:
  - `type`: `"about:blank"` or a URI reference
  - `title`: `"Not Found"`
  - `status`: `404`
  - `detail`: optional descriptive message
- Consistent with existing error handler style
- Registered via `app.notFound()` in Hono
- No dependencies beyond existing honoforge types

## Acceptance Criteria

- [ ] `createNotFoundHandler()` factory function exported
- [ ] Returns `application/problem+json` content type
- [ ] Status code is 404
- [ ] Matches Problem Details format from `error-formatter.ts`
- [ ] Exported from `src/middleware/index.ts`
- [ ] Tests cover basic 404 response and custom detail message

## Notes

- Keep it simple — no suggested routes, analytics, or rich features for now
- Should integrate with the existing `formatError()` if possible for consistency
