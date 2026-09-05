# Plane mirror

How each GitHub issue form maps to a Plane work item type and its properties.

This file exists so the KVM8 lane can create the Plane work item types without guessing.
An issue and its Plane item should have the same shape, so a person reading either one
sees the same facts in the same order.

Plane project: Plane Setup, id `5fd30dbf-6f9e-441c-ac70-0a4da02daf67`
Forms: `.github/ISSUE_TEMPLATE/bug_report.yml`, `docs_bug_report.yml`, `feature_request.yml`

## How to read the tables

- **Form field id** is the `id:` in the issue form YAML. The runner parses the rendered
  issue body by its `label:` heading, so both are listed.
- **Plane property** is the property to create on the work item type.
- **Plane type** is the Plane property type to create it as.
- **Required** matches the form's `validations.required`.

Two fields are deliberately not Plane properties:

- **Plane item** on the form is the back link to Plane. It holds the Plane identifier or
  URL and is written into the GitHub issue by the triage identity. It has no Plane
  property of its own, because in Plane it is the item.
- **Summary** maps to the Plane work item **name**, not to a property. A work item already
  has a title; duplicating it as a property would let the two drift apart.

## Work item type: Bug

Source form: `bug_report.yml`. GitHub labels applied by the form: `bug`.

| Form field id | Form label | Plane property | Plane type | Required |
| --- | --- | --- | --- | --- |
| `plane_item` | Plane item | (none, this is the item) | n/a | no |
| `bug_type` | Bug type | Bug type | Option (single select) | yes |
| `summary` | Summary | (work item name) | n/a | yes |
| `repro` | Steps to reproduce | Steps to reproduce | Text (multi line) | yes |
| `expected` | Expected behavior | Expected behavior | Text (multi line) | yes |
| `actual` | Actual behavior | Actual behavior | Text (multi line) | yes |
| `repository` | Repository | Repository | Text (single line) | yes |
| `commit` | Commit | Commit URL | URL | yes |
| `environment` | Environment | Environment | Text (single line) | yes |
| `harness` | Harness | Harness | Option (single select) | yes |
| `model` | Model | Model | Text (single line) | yes |
| `logs` | Logs | Logs | Text (multi line) | no |
| `evidence` | Screenshots, recordings, and evidence | Evidence | Text (multi line) | no |
| `impact` | Impact and severity | Impact and severity | Text (multi line) | no |
| `additional_information` | Additional information | Additional information | Text (multi line) | no |

Option values for **Bug type**, exactly as the form lists them:

- `Regression (worked before, now fails)`
- `Crash (process or app exits or hangs)`
- `Behavior bug (incorrect output or state without crash)`

Option values for **Harness**. The form takes free text so an unexpected harness is not
lost, but Plane should offer these and accept others:

- `Claude Code`
- `Codex`
- `OpenClaw`
- `runner only`

## Work item type: Docs Bug

Source form: `docs_bug_report.yml`. GitHub labels applied by the form: `bug`, `docs`.

| Form field id | Form label | Plane property | Plane type | Required |
| --- | --- | --- | --- | --- |
| `plane_item` | Plane item | (none, this is the item) | n/a | no |
| `summary` | Summary | (work item name) | n/a | yes |
| `doc_paths` | Affected docs path or URL | Affected docs URL | URL | yes |
| `repository` | Repository | Repository | Text (single line) | yes |
| `repro` | Steps to reproduce or verify | Steps to reproduce or verify | Text (multi line) | yes |
| `expected` | Expected docs content | Expected docs content | Text (multi line) | yes |
| `actual` | Actual docs content | Actual docs content | Text (multi line) | yes |
| `impact` | Impact | Impact | Text (multi line) | yes |
| `evidence` | Evidence | Evidence | Text (multi line) | yes |
| `additional_information` | Additional information | Additional information | Text (multi line) | no |

## Work item type: Feature

Source form: `feature_request.yml`. GitHub labels applied by the form: `enhancement`.

| Form field id | Form label | Plane property | Plane type | Required |
| --- | --- | --- | --- | --- |
| `plane_item` | Plane item | (none, this is the item) | n/a | no |
| `repository` | Repository | Repository | Text (single line) | yes |
| `summary` | Summary | (work item name) | n/a | yes |
| `problem` | Problem to solve | Problem to solve | Text (multi line) | yes |
| `proposed_solution` | Proposed solution | Proposed solution | Text (multi line) | yes |
| `alternatives` | Alternatives considered | Alternatives considered | Text (multi line) | no |
| `impact` | Impact | Impact | Text (multi line) | yes |
| `evidence` | Evidence and examples | Evidence | Text (multi line) | no |
| `implementation_intent` | Who implements this? | Who implements this | Option (single select) | yes |
| `additional_information` | Additional information | Additional information | Text (multi line) | no |

Option values for **Who implements this**, exactly as the form lists them:

- `The loop (decompose into Plane items and let the runner build it)`
- `A human, with the loop verifying`
- `Proposing the idea only`

## Properties shared by all three types

Create these on every type. They are written by the runner, never typed by a person.

| Plane property | Plane type | Written by | Notes |
| --- | --- | --- | --- |
| GitHub issue | URL | triage identity | Set when the issue is created or linked. |
| GitHub pull request | URL | builder identity | Set when the pull request is opened. |
| Verified commit | URL | builder identity | The exact commit the verifier passed. |
| Merge commit | URL | builder identity | Set on merge. Empty until then. |
| Receipt | URL | builder identity | Blob-at-commit URL of the Markdown receipt. |

## Parsing rule for the runner

A GitHub issue form renders as a Markdown body of `### <label>` headings followed by the
answer. An unanswered optional field renders as the literal `_No response_`.

The runner reads a field by its **label**, not its id, because the id is not present in
the rendered body. The Auto Response workflow template in `workflow-templates/` contains
a tested parser for exactly this shape; reuse it rather than writing a second one.

`NOT_ENOUGH_INFO` is a legitimate answer in the Bug form, not a missing field. Treat it as
present but ungrounded, and do not block on it.
