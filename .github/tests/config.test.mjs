import { readFileSync } from 'node:fs';

const fail = (message) => { console.error(message); process.exitCode = 1; };
const read = (path) => readFileSync(path, 'utf8');
const setupPaths = ['.coderabbit.yaml', '.github/mini-policy.json', '.github/tests/config.test.mjs', '.github/mini/flow.md', '.github/ISSUE_TEMPLATE/mini-request.yml', '.github/workflows/mini-ci.yml'];
const unsafe = (path) => typeof path !== 'string' || path.startsWith('/') || path.includes('..') || path === '.coderabbit.yaml' || path === 'CODEOWNERS' || path.startsWith('.github/');
let policy;
try { policy = JSON.parse(read('.github/mini-policy.json')); } catch (error) { fail(`policy JSON is invalid: ${error.message}`); process.exit(); }
if (policy.schema_version !== 1) fail('policy schema_version must be 1');
if (!policy.admission || policy.admission.live_record !== 'runtime/admission.json') fail('policy must link live admission to the private coordinator record');
if (!Array.isArray(policy.bootstrap_paths) || policy.bootstrap_paths.length !== setupPaths.length || setupPaths.some((path) => !policy.bootstrap_paths.includes(path))) fail('policy bootstrap paths are incomplete');
if (new Set(policy.bootstrap_paths).size !== policy.bootstrap_paths.length) fail('policy bootstrap paths must be unique');
const normal = policy.normal_request_paths || {};
if (!Array.isArray(normal.paths) || !Array.isArray(normal.prefixes) || normal.paths.some(unsafe) || normal.prefixes.some(unsafe)) fail('normal request paths may not change setup, review, workflow, merge, or validator policy');
for (const path of setupPaths) { try { read(path); } catch { fail(`required setup file missing: ${path}`); } }
const rabbit = read('.coderabbit.yaml');
if (/\t/.test(rabbit) || !rabbit.startsWith('reviews:\n')) fail('CodeRabbit YAML fails the validator text guard');
for (const line of ['  request_changes_workflow: true', '  review_status: true', '  review_details: true', '  fail_commit_status: true', '    enabled: true', '    auto_pause_after_reviewed_commits: 0', '    drafts: false', '    ignore_usernames: []']) if (!rabbit.includes(line)) fail(`CodeRabbit text guard missing: ${line}`);
const ci = read('.github/workflows/mini-ci.yml');
for (const line of ['  pull_request:', '      - main', "      - 'release/**'", '  contents: read', '    timeout-minutes: 5', 'persist-credentials: false', 'actions/checkout@11d5960a326750d5838078e36cf38b85af677262', 'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020', 'node .github/tests/config.test.mjs']) if (!ci.includes(line)) fail(`workflow requirement missing: ${line}`);
if (/\b(paths|push|workflow_dispatch|deployment|write)\b/.test(ci)) fail('workflow must be pull-request-only and read-only');
const form = read('.github/ISSUE_TEMPLATE/mini-request.yml');
for (const line of ['labels: ["mini:ready"]', 'label: Request', 'label: Acceptance criteria']) if (!form.includes(line)) fail(`issue form requirement missing: ${line}`);
const note = read('.github/mini/flow.md');
for (const term of ['authenticated Mini poll', 'isolated worker', 'Ratatoskr PR', 'CodeRabbit', 'independent verifier', 'Brokkr approval and guarded merge', 'private receipt', 'admission-dependent', 'live proof remains pending']) if (!note.includes(term)) fail(`flow note requirement missing: ${term}`);
if (!process.exitCode) console.log('Mini configuration text guards passed; YAML parsing remains GitHub Actions responsibility.');
