# GitHub Actions public-repository retry

- Date: 2026-08-08
- Repository visibility verified as public.
- Purpose: create a fresh F05 HEAD so `quality/f05` can emit a real push event under public-repository Actions billing/routing.
- This file is documentation only and does not change MF-042 runtime behavior.
- MF-042 remains blocked until verify:repo, lint, typecheck, unit, coverage, build, and Playwright execute and pass.
