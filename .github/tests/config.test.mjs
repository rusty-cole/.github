import { readFileSync } from 'node:fs';

const fail = (message) => { console.error(message); process.exitCode = 1; };
const read = (path) => readFileSync(path, 'utf8');

// --- Minimal dependency-free YAML subset parser -----------------------------------------
// Supports exactly what this repository's setup YAML files use: block and flow mappings,
// block and flow sequences, quoted and plain scalars, and literal block scalars ("|").
// Comments are only stripped outside quotes and outside literal block scalar bodies, so a
// commented-out or documented value can never satisfy a check meant for the real value.

function stripComment(line) {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === '#' && !inSingle && !inDouble && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i);
    }
  }
  return line;
}

const indentOf = (line) => line.match(/^ */)[0].length;

function splitTopLevel(s, sep) {
  const parts = [];
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let current = '';
  for (const c of s) {
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (!inSingle && !inDouble && (c === '[' || c === '{')) depth += 1;
    else if (!inSingle && !inDouble && (c === ']' || c === '}')) depth -= 1;
    if (c === sep && depth === 0 && !inSingle && !inDouble) {
      parts.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  parts.push(current);
  return parts;
}

function parseFlowList(s) {
  const inner = s.slice(1, -1).trim();
  if (inner === '') return [];
  return splitTopLevel(inner, ',').map((item) => parseScalar(item.trim()));
}

function parseScalar(raw) {
  const s = raw.trim();
  if (s === '') return null;
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) return JSON.parse(s);
  if (s.startsWith("'") && s.endsWith("'") && s.length >= 2) return s.slice(1, -1).replace(/''/g, "'");
  if (s.startsWith('[') && s.endsWith(']')) return parseFlowList(s);
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  return s;
}

function skipBlank(lines, cursor) {
  while (cursor.i < lines.length && lines[cursor.i].stripped.trim() === '') cursor.i += 1;
}

function peekIndent(lines, cursor) {
  skipBlank(lines, cursor);
  return cursor.i >= lines.length ? -1 : indentOf(lines[cursor.i].stripped);
}

function parseBlockScalar(lines, cursor, parentIndent, indicator) {
  const collected = [];
  let blockIndent = null;
  while (cursor.i < lines.length) {
    const raw = lines[cursor.i].raw;
    if (raw.trim() === '') {
      let j = cursor.i + 1;
      while (j < lines.length && lines[j].raw.trim() === '') j += 1;
      const stillInBlock = j < lines.length && indentOf(lines[j].raw) >= (blockIndent === null ? parentIndent + 1 : blockIndent);
      if (!stillInBlock) break;
      collected.push('');
      cursor.i += 1;
      continue;
    }
    const ind = indentOf(raw);
    if (blockIndent === null) {
      if (ind <= parentIndent) break;
      blockIndent = ind;
    } else if (ind < blockIndent) {
      break;
    }
    collected.push(raw.slice(blockIndent));
    cursor.i += 1;
  }
  while (collected.length && collected[collected.length - 1] === '') collected.pop();
  let text = collected.join('\n');
  if (indicator !== '|-') text += '\n';
  return text;
}

const MAPPING_KEY = /^([A-Za-z_][\w.-]*):(?:\s(.*))?$/;

function parseMapping(lines, cursor, indent, firstContent) {
  const result = {};
  let pendingFirst = firstContent;
  while (true) {
    let content;
    let mustConsume = true;
    if (pendingFirst !== undefined) {
      content = pendingFirst;
      pendingFirst = undefined;
      mustConsume = false;
    } else {
      const ind = peekIndent(lines, cursor);
      if (ind !== indent) break;
      const line = lines[cursor.i].stripped;
      content = line.slice(indent);
      if (content.startsWith('- ') || content === '-') break;
    }
    const m = MAPPING_KEY.exec(content);
    if (!m) throw new Error(`cannot parse mapping line: "${content}"`);
    const key = m[1];
    const rest = m[2] === undefined ? '' : m[2];
    if (mustConsume) cursor.i += 1;
    if (Object.prototype.hasOwnProperty.call(result, key)) throw new Error(`duplicate key: ${key}`);
    if (rest.trim() === '|' || rest.trim() === '|-' || rest.trim() === '|+') {
      result[key] = parseBlockScalar(lines, cursor, indent, rest.trim());
    } else if (rest.trim() === '') {
      const nextIndent = peekIndent(lines, cursor);
      result[key] = nextIndent > indent ? parseNode(lines, cursor, nextIndent) : null;
    } else {
      result[key] = parseScalar(rest);
    }
  }
  return result;
}

function parseSequence(lines, cursor, indent) {
  const result = [];
  while (true) {
    const ind = peekIndent(lines, cursor);
    if (ind !== indent) break;
    const line = lines[cursor.i].stripped;
    const content = line.slice(indent);
    if (!(content.startsWith('- ') || content === '-')) break;
    const rest = content === '-' ? '' : content.slice(2);
    cursor.i += 1;
    if (rest.trim() === '') {
      const nextIndent = peekIndent(lines, cursor);
      result.push(nextIndent > indent ? parseNode(lines, cursor, nextIndent) : null);
    } else if (MAPPING_KEY.test(rest)) {
      result.push(parseMapping(lines, cursor, indent + 2, rest));
    } else {
      result.push(parseScalar(rest));
    }
  }
  return result;
}

function parseNode(lines, cursor, indent) {
  const ind = peekIndent(lines, cursor);
  if (ind < indent) return null;
  const content = lines[cursor.i].stripped.slice(ind);
  if (content.startsWith('- ') || content === '-') return parseSequence(lines, cursor, ind);
  return parseMapping(lines, cursor, ind);
}

function parseYaml(text) {
  if (/\t/.test(text)) throw new Error('tabs are not valid YAML indentation');
  const lines = text.split('\n').map((raw) => ({ raw, stripped: stripComment(raw) }));
  const cursor = { i: 0 };
  const ind = peekIndent(lines, cursor);
  if (ind === -1) return null;
  return parseNode(lines, cursor, ind);
}

// --- mini-policy.json -------------------------------------------------------------------

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

// --- .coderabbit.yaml --------------------------------------------------------------------

let rabbit;
try { rabbit = parseYaml(read('.coderabbit.yaml')); } catch (error) { fail(`CodeRabbit YAML failed to parse: ${error.message}`); rabbit = {}; }
const reviews = rabbit.reviews || {};
if (reviews.request_changes_workflow !== true) fail('CodeRabbit reviews.request_changes_workflow must be true');
if (reviews.review_status !== true) fail('CodeRabbit reviews.review_status must be true');
if (reviews.review_details !== true) fail('CodeRabbit reviews.review_details must be true');
if (reviews.fail_commit_status !== true) fail('CodeRabbit reviews.fail_commit_status must be true');
const autoReview = reviews.auto_review || {};
if (autoReview.enabled !== true) fail('CodeRabbit reviews.auto_review.enabled must be true');
if (autoReview.auto_incremental_review !== true) fail('CodeRabbit reviews.auto_review.auto_incremental_review must be true');
if (autoReview.auto_pause_after_reviewed_commits !== 0) fail('CodeRabbit reviews.auto_review.auto_pause_after_reviewed_commits must be 0');
if (autoReview.drafts !== false) fail('CodeRabbit reviews.auto_review.drafts must be false');
if (!Array.isArray(autoReview.ignore_usernames) || autoReview.ignore_usernames.length !== 0) fail('CodeRabbit reviews.auto_review.ignore_usernames must be an empty list');
const unitTests = (reviews.finishing_touches || {}).unit_tests || {};
if (unitTests.enabled !== false) fail('CodeRabbit reviews.finishing_touches.unit_tests.enabled must be false');

// --- .github/workflows/mini-ci.yml --------------------------------------------------------

let ciDoc;
try { ciDoc = parseYaml(read('.github/workflows/mini-ci.yml')); } catch (error) { fail(`workflow YAML failed to parse: ${error.message}`); ciDoc = {}; }
const on = ciDoc.on || {};
if (Object.keys(on).length !== 1 || !('pull_request' in on)) fail('workflow must trigger on pull_request only, with no push, workflow_dispatch, deployment, or schedule triggers');
const pr = on.pull_request || {};
if ('paths' in pr) fail('workflow pull_request trigger must not use a path filter');
if (!Array.isArray(pr.branches) || pr.branches.length !== 2 || pr.branches[0] !== 'main' || pr.branches[1] !== 'release/**') fail('workflow must target the main and release/** branches');
const permissions = ciDoc.permissions || {};
if (Object.keys(permissions).length !== 1 || permissions.contents !== 'read') fail('workflow permissions must be read-only and scoped to contents: read only');
const job = (ciDoc.jobs || {}).validate || {};
if (job['timeout-minutes'] !== 5) fail('workflow validate job must set timeout-minutes: 5');
const steps = Array.isArray(job.steps) ? job.steps : [];
const checkoutStep = steps.find((step) => typeof step.uses === 'string' && step.uses.startsWith('actions/checkout@'));
if (!checkoutStep || checkoutStep.uses !== 'actions/checkout@11d5960a326750d5838078e36cf38b85af677262') fail('workflow must pin actions/checkout to the approved commit SHA');
if (!checkoutStep || !checkoutStep.with || checkoutStep.with['persist-credentials'] !== false) fail('workflow checkout step must not retain checkout credentials');
const setupNodeStep = steps.find((step) => typeof step.uses === 'string' && step.uses.startsWith('actions/setup-node@'));
if (!setupNodeStep || setupNodeStep.uses !== 'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020') fail('workflow must pin actions/setup-node to the approved commit SHA');
const runStep = steps.find((step) => step.run === 'node .github/tests/config.test.mjs');
if (!runStep) fail('workflow must run node .github/tests/config.test.mjs');

// --- .github/ISSUE_TEMPLATE/mini-request.yml ----------------------------------------------

let form;
try { form = parseYaml(read('.github/ISSUE_TEMPLATE/mini-request.yml')); } catch (error) { fail(`issue form YAML failed to parse: ${error.message}`); form = {}; }
if (!Array.isArray(form.labels) || form.labels.length !== 1 || form.labels[0] !== 'mini:ready') fail('issue form labels must be exactly ["mini:ready"]');
const body = Array.isArray(form.body) ? form.body : [];
const requestField = body.find((item) => item.id === 'request');
if (!requestField || (requestField.attributes || {}).label !== 'Request' || !(requestField.validations || {}).required) fail('issue form must have a required Request field');
const acceptanceField = body.find((item) => item.id === 'acceptance-criteria');
if (!acceptanceField || (acceptanceField.attributes || {}).label !== 'Acceptance criteria' || !(acceptanceField.validations || {}).required) fail('issue form must have a required Acceptance criteria field');

// --- .github/mini/flow.md (prose, not machine-enforced configuration) ---------------------

const note = read('.github/mini/flow.md');
for (const term of ['authenticated Mini poll', 'isolated worker', 'Ratatoskr PR', 'CodeRabbit', 'independent verifier', 'Brokkr approval and guarded merge', 'private receipt', 'admission-dependent', 'live proof remains pending']) if (!note.includes(term)) fail(`flow note requirement missing: ${term}`);

if (!process.exitCode) console.log('Mini configuration checks passed against parsed YAML and JSON structures.');
