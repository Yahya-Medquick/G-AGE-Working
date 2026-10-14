# Repository verification checklist

Run the package scripts before preparing a release:

- [ ] `npm run lint` — TypeScript check (`tsc --noEmit`).
- [ ] `npm test` — run the Vitest suite.
- [ ] `npm run build` — build the frontend and bundled server.
- [ ] `npm start` — start the production server after a successful build.

The current main interface is mounted by `src/App.tsx`. The server and optional PostgreSQL schema are defined in `server.ts`. See [README.md](./README.md) for current features, environment variable names, query limits, and design tokens.
