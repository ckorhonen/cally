# Cally repository guide

`src/` contains the calendar web components; the Vite library build and Astro documentation site are separate surfaces. Preserve the public custom-element API, accessibility, keyboard behavior, and dependency-light implementation. Read the package scripts and relevant component tests before changing an interaction.

Use Node 20 as in CI and `npm ci`. `npm run start` starts Vite development; the docs have their Astro development command in the package scripts. `npm run build` runs the clean prebuild and builds the library plus Astro checks/site output, deleting generated `dist` directories first. `npm test` uses Vitest's browser testing setup and requires the Playwright Chromium browser; install its matching browser only when needed. There is no separate lint or standalone typecheck script declared.

For calendar changes, run focused browser tests and inspect keyboard focus, range selection, disabled dates, localization, and rendering as relevant. A build alone does not demonstrate accessible behavior. Version/postversion scripts push branches/tags and publish npm packages; don't invoke them as checks. Keep generated output and package publication separate from source validation.

## Completing work

Carry the authorized change through the relevant checks and repair failures it causes. Make routine, reversible implementation choices using existing patterns; ask only when missing information, a material product decision, or an authorization boundary prevents the next step. Existing authorization remains valid within its scope. If blocked, name the exact action and missing prerequisite, retain concise evidence, and continue independent work.

Choose verification proportional to the change. For instructions or prose, inspect changed paths, links, and local instruction precedence and run `git diff --check -- <changed-paths>`; don't install dependencies or run the application solely for a prose edit. For behavior changes, exercise the affected behavior and applicable checks below, then broaden only for failures or unresolved risk. Report files changed, checks actually run and their results, commands only inspected, and remaining limitations. A build or source inspection alone does not prove runtime behavior. Continue through already-authorized follow-through; stop at explicit review checkpoints or boundaries requiring new authorization.
