#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.argv[2] || new URL("..", import.meta.url).pathname;
const canonical = ".ai-project";
const requiredHeadings = ["purpose", "load", "scope", "deny", "procedure", "done"];
const forbiddenTerms = [
  [71, 101, 115, 116, 105, 111, 110, 97, 108, 101, 72, 82],
  [103, 101, 115, 116, 105, 111, 110, 97, 108, 101, 104, 114],
  [82, 86, 79],
  [114, 118, 111],
  [72, 105, 110, 97, 116, 97, 79, 117, 79],
].map((codes) => String.fromCharCode(...codes));

let failed = false;
const failures = [];

function fail(message) {
  failed = true;
  failures.push(message);
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function existsFile(relPath) {
  try {
    return statSync(join(root, relPath)).isFile();
  } catch {
    return false;
  }
}

function walk(dir, predicate = () => true) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path, predicate));
    if (entry.isFile() && predicate(path)) out.push(path);
  }
  return out;
}

function parseJson(relPath) {
  try {
    return JSON.parse(readText(join(root, relPath)));
  } catch (error) {
    fail(`${relPath} invalid JSON: ${error.message}`);
    return {};
  }
}

function arrayOfStrings(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function uniqueList(name, values) {
  if (!arrayOfStrings(values)) {
    fail(`starter.json ${name} must be string array`);
    return [];
  }
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) fail(`starter.json ${name} duplicate: ${value}`);
    seen.add(value);
  }
  return values;
}

function parseFrontmatter(text, relPath) {
  if (!text.startsWith("---\n")) {
    fail(`memory shard missing frontmatter: ${relPath}`);
    return {};
  }
  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    fail(`memory shard unclosed frontmatter: ${relPath}`);
    return {};
  }
  const data = {};
  for (const line of text.slice(4, end).split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) data[match[1]] = match[2].trim();
  }
  return data;
}

function parseInlineList(value) {
  const match = value?.match(/^\[(.*)\]$/);
  if (!match) return null;
  if (match[1].trim() === "") return [];
  return match[1].split(",").map((item) => item.trim()).filter(Boolean);
}

const manifest = parseJson("starter.json");
const skills = uniqueList("skills", manifest.skills);
const commands = uniqueList("claudeCommands", manifest.claudeCommands);
const requiredFiles = uniqueList("requiredFiles", manifest.requiredFiles);
const memoryTags = new Set(uniqueList("memoryTags", manifest.memoryTags));
uniqueList("roadmapLayers", manifest.roadmapLayers);

if (manifest.canonicalRoot !== canonical) fail(`canonicalRoot must be ${canonical}`);

for (const file of requiredFiles) {
  if (!existsFile(file)) fail(`missing required file: ${file}`);
}

for (const key of ["claudeAliases", "aliases"]) {
  if (manifest[key]) fail(`starter.json ${key} must not define project aliases`);
}

for (const path of walk(root)) {
  const relPath = relative(root, path);
  if (relPath === "scripts/validate-starter.mjs") continue;
  const text = readText(path);
  for (const term of forbiddenTerms) {
    if (text.includes(term)) fail(`project-specific hardcode: ${relPath}`);
  }
}

for (const skill of skills) {
  const relPath = `skills/${skill}/SKILL.md`;
  if (!existsFile(relPath)) {
    fail(`missing skill: ${skill}`);
    continue;
  }
  const headings = readText(join(root, relPath))
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.slice(3).trim());
  if (headings.join("/") !== requiredHeadings.join("/")) {
    fail(`bad headings in ${relPath}: ${headings.join("/")}`);
  }
}

for (const command of commands) {
  const relPath = `commands/claude/${command}.md`;
  if (!existsFile(relPath)) {
    fail(`missing Claude wrapper: ${command}`);
    continue;
  }
  const expected = `${canonical}/skills/${command}/SKILL.md`;
  const text = readText(join(root, relPath));
  const skillRefs = [...text.matchAll(/\.ai-project\/skills\/([^/\s`]+)\/SKILL\.md/g)];
  if (skillRefs.length !== 1 || skillRefs[0][0] !== expected) {
    fail(`bad Claude wrapper target in ${relPath}: expected ${expected}`);
  }
}

for (const skill of skills) {
  if (!commands.includes(skill)) fail(`skill has no matching Claude wrapper: ${skill}`);
}

for (const file of walk(join(root, "project/memory"), (path) => path.endsWith(".md"))) {
  const relPath = relative(root, file);
  if (relPath === "project/memory/MEMORY_INDEX.md") continue;
  const fm = parseFrontmatter(readText(file), relPath);
  for (const key of ["id", "tags", "load", "updated", "depends"]) {
    if (!Object.hasOwn(fm, key)) fail(`memory shard missing ${key}: ${relPath}`);
  }
  const tags = parseInlineList(fm.tags);
  if (!tags) fail(`memory shard tags must be inline list: ${relPath}`);
  else {
    for (const tag of tags) {
      if (!memoryTags.has(tag)) fail(`memory shard tag not in starter.json.memoryTags: ${relPath} -> ${tag}`);
    }
  }
  if (!parseInlineList(fm.depends)) fail(`memory shard depends must be inline list: ${relPath}`);
}

for (const base of ["adapters", "commands/claude"]) {
  for (const file of walk(join(root, base), (path) => path.endsWith(".md"))) {
    const relPath = relative(root, file);
    const text = readText(file);
    if (text.includes("AI-ProjectStarter/")) fail(`runtime path references template source: ${relPath}`);
    if (!text.includes(canonical)) fail(`runtime file missing ${canonical} path: ${relPath}`);
  }
}

const adapterText = walk(join(root, "adapters"), (path) => path.endsWith(".md"))
  .map((path) => readText(path))
  .join("\n");
for (const segment of [`${canonical}/core/`, `${canonical}/project/`, `${canonical}/skills/`]) {
  if (!adapterText.includes(segment)) fail(`adapters do not reference ${segment}`);
}

const wordFiles = [
  ...walk(join(root, "core"), (path) => /\.(md|ya?ml)$/.test(path)),
  ...walk(join(root, "skills"), (path) => /\.(md|ya?ml)$/.test(path)),
  ...walk(join(root, "commands/claude"), (path) => /\.(md|ya?ml)$/.test(path)),
  ...walk(join(root, "project/memory"), (path) => /\.(md|ya?ml)$/.test(path)),
  ...walk(join(root, "github/ISSUE_TEMPLATE"), (path) => /\.(md|ya?ml)$/.test(path)),
];
const wordCount = wordFiles
  .map((path) => readText(path).trim().split(/\s+/).filter(Boolean).length)
  .reduce((sum, count) => sum + count, 0);

if (failed) {
  for (const message of failures) console.error(`FAIL ${message}`);
  console.log(`word_count ${wordCount}`);
  process.exit(1);
}

console.log("OK starter valid");
console.log(`word_count ${wordCount}`);
