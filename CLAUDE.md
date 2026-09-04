# CLAUDE.md

Guidance for Claude Code when working in this repository (Fantasy Draft Assistant).

## Rules

- **Write clean code.** Favor small, focused, well-named functions and components over clever
  or dense ones. Reuse existing utilities (`domain/`, `engine/`, `state/`) instead of
  duplicating logic. Don't add abstractions, config options, or error handling for cases that
  can't actually happen — match the scope of the change being made.
- **Respect the dev container setup.** This project runs in the container defined by
  `.devcontainer/devcontainer.json` (Node 20, npm). Don't change the base image, Node version,
  or global tooling without a clear reason, and don't assume tools beyond what's installed
  there are available.
- **Never put API keys, tokens, or other secrets in code files.** This app currently talks to
  Sleeper's and ESPN's public APIs, both of which require no authentication — keep it that
  way where possible. If a future integration needs a credential, it must come from an
  environment variable or local untracked config, never a literal in source, and must never be
  committed.
- **Test changes before finishing.** Before considering a change done, run the test suite
  (`npm run test`), typecheck (`npx tsc -b`), and confirm the production build succeeds
  (`npm run build`). For UI-visible changes, verify the actual behavior in a running instance
  of the app rather than relying on types/tests alone.
- **Update project documentation as features are added.** Keep `docs/concept-doc.md` in sync
  with what's actually implemented vs. still planned/deferred, and update `README.md` if the
  project's status or setup steps change.
