<!--
Required linked issue:
Put a visible `Closes #<issue-number>` line in the body, on its own line, so merging
this pull request closes the item's issue. Use `Related: #<issue-number>` only for a
pull request that does not finish the issue.

Required pull request title:
type: user-facing description
Use a parenthesized scope only when it adds clarity:
fix(merge): merge comment omits the merge commit URL

Types: feat, fix, improve, refactor, docs, chore.
For fixes, describe the user-visible symptom and trigger:
fix: merge comment omits the merge commit URL when the merge is a squash
Avoid implementation details such as:
fix: add null check to merge result
-->

Closes #

## What Problem This Solves

<!--
Describe the concrete user, product, or operational problem.
For fixes, begin with:
"Fixes an issue where <who> would <experience Y> when <condition>."
Name the affected surface or workflow. Do not describe the code-level cause here.
-->

## Why This Change Was Made

<!--
In one or two sentences, explain the complete shipped solution, key design decisions,
and relevant boundaries or non-goals. Include implementation detail only when it helps
a reviewer understand user-visible behavior or risk. Avoid file-by-file narration.
-->

## User Impact

<!--
State what a person or operator can now do or expect. Lead with the concrete benefit.
If there is no user-visible impact, say so plainly.
-->

## Evidence

<!--
Everything below the Evidence block is filled in by the runner, not typed by hand.
Leave the field names exactly as they are; the runner matches on them.
Every entry is a URL. Bare SHAs belong in the JSON receipt, not here.
-->

| Field | Value |
| --- | --- |
| Plane item | <!-- runner: item URL --> |
| Branch | <!-- runner: https://github.com/OWNER/REPO/tree/BRANCH --> |
| Verified commit | <!-- runner: https://github.com/OWNER/REPO/commit/SHA --> |
| Compare against base | <!-- runner: https://github.com/OWNER/REPO/compare/BASE_SHA...HEAD_SHA --> |
| Verifier verdict | <!-- runner: pass or fail, and which verifier produced it --> |
| Test command | <!-- runner: the exact command that was run --> |
| Test result | <!-- runner: pass or fail, with counts --> |
| Secret scan | <!-- runner: pass or fail, with the run URL --> |
| Receipt (Markdown) | <!-- runner: blob-at-commit URL of the receipt --> |
| Receipt (JSON) | <!-- runner: blob-at-commit URL of the JSON twin --> |
| Temporal run | <!-- runner: workflow run URL, or "not applicable" --> |

### Additional evidence

<!--
Screenshots, screencasts, terminal output, focused test output, CI results, redacted logs,
and artifact links. Include before and after evidence for visual changes.
Use this section to make the validation easy to understand, not to restate the diff.
-->
