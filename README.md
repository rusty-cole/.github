# rusty-cole/.github

Shared GitHub defaults for the repositories in the custom product management runner loop.

The work tracker is the work authority. GitHub is where the evidence lives in a form a person can
read: one issue and one pull request per item, with a direct URL everywhere someone looks.
This repository holds the parts of that which are the same in every repository, so they are
written once and adopted, not retyped and slowly diverged.

## What is here

| Path | What it is | How it reaches a repository |
| --- | --- | --- |
| `.github/ISSUE_TEMPLATE/` | The three issue forms and the chooser | Automatic, for every public repository owned by rusty-cole |
| `.github/pull_request_template.md` | The pull request template with the runner's evidence block | Automatic, same as above |
| `workflow-templates/` | Twelve GitHub Actions workflows, repository-neutral | Copy the file into the repository |
| `actions/` | Three composite actions | Copy the directory into the repository |
| `CODEOWNERS.example` | Who must review what | Copy to `.github/CODEOWNERS` and edit |
| `labeler.example.yml` | Path to label rules | Copy to `.github/labeler.yml` and edit |
| `dependabot.example.yml` | Dependency and action pin updates | Copy to `.github/dependabot.yml` and edit |
| `WORK-TRACKER-MIRROR.md` | Field by field map from each issue form to a tracker work item type | Read it when creating the Tracker types |

## What is automatic and what is not

This matters, because two of these look automatic and are not.

**Issue and pull request templates are inherited.** GitHub reads default community health
files from a public repository named `.github` owned by a user or an organization. Any
repository owned by rusty-cole that does not define its own issue forms or pull request
template gets these. A repository that defines its own wins; there is no merging.

**Workflow templates are not inherited, here.** The `workflow-templates/` directory
populates the "New workflow" chooser only for an **organization**. `rusty-cole` is a user
account, so nothing here appears in that menu. These files are still the canonical copy
source, and they become live in the chooser unchanged if these repositories ever move under
an organization. Until then, adopting a workflow means copying the file.

**CODEOWNERS and dependabot.yml are never inherited.** GitHub does not treat either as a
default community health file. Each repository needs its own copy. That is why they are
named `.example` here, so nobody expects them to act on their own.

## Adopting these in a repository

1. Copy the workflows you want from `workflow-templates/*.yml` into `.github/workflows/`.
   Drop the `.properties.json` files; they only describe the template.
2. Copy `actions/` into `.github/actions/` if a workflow you took references it.
3. Copy `CODEOWNERS.example` to `.github/CODEOWNERS` and replace the paths with real ones.
4. Copy `labeler.example.yml` to `.github/labeler.yml` if you took the Labeler workflow.
5. Copy `dependabot.example.yml` to `.github/dependabot.yml`. Take at least the
   `github-actions` block: every action here is pinned to a commit SHA, and a SHA pin does
   not update itself.
6. Set the repository variables and secrets the workflows read. See the next section.
7. Push, and check the Actions tab. A workflow that needs a variable you did not set falls
   back to `GITHUB_TOKEN` rather than failing, so read the run log rather than assuming.

## Variables and secrets the workflows read

Set these on the repository, or on the account so every repository inherits them.
None of them are required for a workflow to run; each has a stated fallback.

| Name | Kind | Used by | Fallback if unset |
| --- | --- | --- | --- |
| `RATATOSKR_APP_ID` | variable | Labeler, Stale, Auto Response, Dated TODO Sweep | Acts as `github-actions[bot]` |
| `RATATOSKR_PRIVATE_KEY` | secret | same | same |
| `MAINTAINER_COMMANDS` | variable | Maintainer Command Reactions | `/retry,/rework,/hold,/release,/merge,/abandon` |
| `SECURITY_SENSITIVE_GLOBS` | variable | Security Sensitive Guard | A built-in list of workflow, Dockerfile, key, auth, and secret paths |
| `CODEQL_LANGUAGES_JSON` | variable | CodeQL | `["python"]` |
| `OPENGREP_CONFIG` | variable | OpenGrep | `p/default` |

A workflow that runs as `github-actions[bot]` still works. It just signs its comments and
labels as the generic bot instead of the triage identity, which makes the timeline harder
to read. Set the App variables when the identities exist.

## The workflows

Every one of these was ported from `openclaw/openclaw` unless noted, and every one was
changed to remove a dependency on OpenClaw repository scripts, teams, or runners. Each file
opens with a comment saying exactly what was changed and why. Read that comment before
adopting it.

| Workflow | What it does | Notable change from the OpenClaw original |
| --- | --- | --- |
| `labeler.yml` | Path labels plus a pull request size label | Title lint and Barnacle backfill dropped (repository scripts) |
| `stale.yml` | Daily stale sweep, exempting the `loop` label | Backfill job dropped; OpenClaw labels and Discord copy replaced |
| `auto-response.yml` | Checks a new issue answered every required field | Whole body rewritten inline; the tracker link happens on the runner host, not here |
| `maintainer-command-reactions.yml` | Acknowledges a maintainer slash command | Command list is now a repository variable |
| `pr-ci-sweeper.yml` | Reports pull requests whose head commit has no checks | Reports only; does not close, reopen, or rerun anything |
| `workflow-sanity.yml` | Tabs, actionlint, and an unpinned-action check | git-owner, pre-commit, and zizmor lanes dropped; pin check added |
| `opengrep-precise.yml` | Static analysis with opengrep | Scans the whole repository instead of a scripted diff |
| `dependency-guard.yml` | Dependency review plus a lockfile and manifest check | Autoscrub lane deliberately not carried over |
| `security-sensitive-guard.yml` | Labels and fails a pull request touching sensitive paths | Team and approver lookups replaced with inline glob matching |
| `codeql.yml` | CodeQL security and quality analysis | Seven-way custom config matrix replaced with the default suite |
| `dated-todo-sweep.yml` | Weekly overdue TODO report in one tracking issue | Codex lane dropped; no API key needed |
| `secret-scan.yml` | gitleaks on every branch and pull request | New. No OpenClaw ancestor. Implements Work item ITEM-42 |

Two of these overlap on purpose. `codeql.yml` needs GitHub Advanced Security on a private
repository; `opengrep-precise.yml` does not. Take CodeQL where you can and OpenGrep where
you cannot, and do not take both unless you want two sets of findings.

## Rules that apply to everything here

- **Every action is pinned to a full 40 character commit SHA**, with the version in a
  trailing comment. `workflow-sanity.yml` fails a pull request that breaks this, so the rule
  checks itself. Let Dependabot move the pins.
- **No em dashes or en dashes** in any file, comment, template, or message in these
  repositories. Use commas, periods, colons, or parentheses. Ranges are written with "to".
- **Every SHA a person sees is a link**, not a bare hash. Bare hashes belong in JSON
  receipts and ledgers, where a machine reads them.
- **Bot writes use an App identity**, never a person's account.

## Where the rest of this lives

The specification the runner lane implements, covering the issue and pull request flow, the
URL rules, the story comment, the receipts, and the reviewer and triage flows, is in
the runner's private repository.
