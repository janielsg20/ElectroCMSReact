# ElectroCMS preview workflow

Vercel is connected to `janielsg20/ElectroCMSReact`.

- `main` publishes the stable production preview.
- Development branches and pull requests publish Vercel Preview Deployments automatically.
- The SPA fallback in `vercel.json` keeps `/editor`, `/preview`, `/backend` and `/export` directly addressable.
- GitHub Actions remains the quality gate; Vercel is the visual deployment surface.

Current development branch: `agent/f03-canvas-history` (PR #4).
