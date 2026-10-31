# Repository defaults have moved

The single maintained source is [agent-repo/templates/repo](https://github.com/rusty-cole/agent-repo/tree/main/templates/repo), including its [.github directory](https://github.com/rusty-cole/agent-repo/tree/main/templates/repo/.github).

Install the canonical template into each new repository and configure its actual checks. Update reusable defaults in agent-repo only. This repository is a pointer, not a second copy or an active source of inherited issue/PR defaults. GitHub does not inherit files from a nested directory in another repository.

Existing project-local copies continue to work and are not automatically changed. Repositories that previously depended on inherited forms must install the canonical forms explicitly. No runner, tracker integration, Temporal workflow, or automatic issue creation is required.

Historical templates and actions remain available in [the previous revision](https://github.com/rusty-cole/.github/tree/20c906e2cf808e91ff80a7f97906d2496d31ae5e). Exact-SHA consumers retain that history; callers using a removed path at `main` must migrate before this retirement merges.
