---
name: Imported package installation
description: Package-manager boundaries for the imported app and generated mockup preview.
---

# Imported package installation

The imported application and the generated mockup preview are separate package-manager projects: the root uses pnpm, while the preview sandbox carries its own npm lockfile and dependencies.

**Why:** Installing only from the root does not satisfy preview-only imports such as `chokidar`, and running a frozen pnpm install inside the sandbox fails because it has no pnpm lockfile.

**How to apply:** Install root dependencies from the root lockfile, then install the sandbox from `artifacts/mockup-sandbox/package-lock.json` when that preview workflow is present.