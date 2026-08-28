# init-PROJECT.md

Use this file to generate or improve the agent-instruction files for this repository.

The goal is **not** to document the entire repository.

The goal is to give coding agents the smallest amount of durable, project-specific context required to work correctly without repeatedly rediscovering important constraints.

---

## Objective

Inspect this workspace and create or improve the appropriate agent instruction file:

* `CLAUDE.md` for Claude Code
* `AGENTS.md` for Codex or harnesses that support it
* If both are actively used, avoid maintaining two duplicated instruction manuals. Prefer vendor-neutral rules in `AGENTS.md` and have `CLAUDE.md` reference them where appropriate, adding only Claude-specific instructions.

Do not blindly copy this template.

Adapt it to the actual repository.

---

# Phase 1 — Survey the Workspace

Before writing anything:

1. Identify repository/package boundaries.
2. Identify the language, frameworks, build system, test framework, package manager, and major entry points.
3. Inspect existing:

   * `README*`
   * `CLAUDE.md`
   * `AGENTS.md`
   * `.claude/`
   * `docs/`
   * build manifests
   * CI configuration
   * test configuration
   * lint/format configuration
4. Determine whether this is:

   * a single repository,
   * monorepo,
   * multi-repository workspace,
   * or a repository containing read-only reference/legacy code.
5. Identify commands that actually work for:

   * build
   * test
   * targeted test
   * lint
   * typecheck/compile
   * run/start
6. Identify non-obvious architecture boundaries and cross-system contracts.

Do not ask the user for information that can be reliably discovered from the workspace.

Ask only when an actual user decision is required.

---

# Documentation Discovery

Do **not** blindly read every document in the repository.

First inspect:

* documentation indexes,
* README files,
* filenames/headings,
* directory structure,
* references from relevant code.

Then read the documents relevant to understanding the repository or current task.

The final agent instructions should act as a **map to deeper documentation**, not reproduce that documentation.

---

# Phase 2 — Decide Instruction Placement

Use the smallest useful scope.

### Single repository

Prefer one root instruction file.

### Monorepo / multiple independently scoped components

Use:

* a short root file for workspace-wide rules and system relationships;
* nested instruction files only where a component has materially different commands, architecture, conventions, or constraints.

Do not create nested instruction files merely because directories exist.

### Claude Code

Remember that nested `CLAUDE.md` files can provide scoped context.

### Codex

Remember that nested `AGENTS.md` files apply to their directory subtree and more-specific instructions take precedence.

Keep the combined instruction footprint small.

---

# Phase 3 — What Belongs in Agent Instructions

Include information that is:

* important,
* durable,
* applicable to many tasks in its scope,
* and difficult or expensive for an agent to infer correctly.

Prioritize these categories.

## Project Overview

2–5 lines maximum.

Explain:

* what the system does;
* major components;
* how they relate.

Do not write a product brochure.

---

## Commands

Record exact, verified commands where useful:

```text
Build:
Test:
Targeted test:
Lint:
Compile/typecheck:
Run:
```

Prefer targeted verification before expensive whole-repository verification where appropriate.

Never invent commands.

---

## Architecture Map

Describe major components and boundaries.

For multi-system projects, include a compact flow such as:

```text
Client
  -> API
  -> Service
  -> Integration Layer
  -> Database / External System
```

Focus especially on boundaries where an agent could make a plausible but incorrect assumption.

---

## Contract Points

Document non-obvious contracts between components, for example:

* endpoint naming rules,
* DTO/payload conventions,
* authentication/session behavior,
* transaction boundaries,
* database ownership,
* configuration precedence,
* generated-code boundaries,
* legacy compatibility requirements,
* field semantics that cannot be inferred from their names.

These are higher priority than generic coding advice.

---

## Repository-Specific Conventions

Include conventions only when they differ from obvious language/framework defaults or are repeatedly important.

Good:

```text
Use XxxMapper for all Core -> API DTO conversion.
Never call repository Y from module Z.
Generated files under foo/ must not be edited manually.
```

Bad:

```text
Write readable code.
Use meaningful variable names.
Follow Java best practices.
Write maintainable software.
```

Do not waste persistent context telling a capable coding model things it already knows.

---

## Edit / Safety Boundaries

Clearly identify:

* generated files,
* read-only reference repositories,
* migrations that require special treatment,
* secrets/config that must not be committed,
* components that must not be changed without explicit user approval.

Use concrete paths wherever possible.

---

## Verification

Define what proves a change is correct.

For example:

```text
After modifying module A:
1. Run targeted tests for the affected package.
2. Run compile/typecheck.
3. Run integration tests if the change crosses boundary B.
4. Inspect the final diff for accidental unrelated changes.
```

Prefer verifiable commands over instructions such as:

```text
Make sure everything works.
```

---

## Documentation Pointers

Link to deeper documentation instead of embedding it.

Example:

```text
Architecture: docs/architecture.md
Database conventions: docs/database.md
API contracts: docs/api/
Deployment: docs/deployment.md
```

Only reference files that actually exist.

---

# Operating Rules

Keep the root operating protocol short.

Recommended default:

1. **Investigate before guessing.** If an uncertainty can be resolved from code, tests, configuration, git history, or relevant documentation, inspect those sources rather than inventing an answer.

2. **Use targeted context.** Prefer targeted search and relevant file reads over broad repository scans.

3. **Follow existing patterns.** Before introducing a new abstraction or convention, inspect nearby working implementations.

4. **Plan when complexity justifies it.** For cross-module, architectural, migration, or otherwise risky work, understand the relevant system and form a plan before implementation. Skip ceremony for trivial changes.

5. **Make the smallest correct change.** Do not perform unrelated cleanup unless required for correctness.

6. **Verify the result.** Run the most relevant available tests/checks and inspect the final diff before declaring completion.

7. **Do not trade correctness for token savings.** Avoid repeated reads, redundant summaries, speculative exploration, and unnecessary agent calls, but perform all investigation and verification required for a reliable result.

8. **Update durable documentation only when durable facts change.** Do not modify `CLAUDE.md`/`AGENTS.md` after every task. Update them when commands, architecture, contracts, conventions, or recurring gotchas materially change.

---

# Temporary State Does NOT Belong Here

Do not store routine task history inside the always-loaded instruction file.

Examples of information that should normally live elsewhere:

* what happened in the previous task,
* current temporary debugging state,
* today's open questions,
* implementation plans,
* intermediate investigation notes,
* long changelogs.

If this project needs session handoff, use a dedicated on-demand file such as:

```text
docs/agent-handoff.md
```

or an existing project-specific equivalent.

Do not automatically import that file into every session unless there is a concrete reason.

---

# Delegation / Subagents

Only add a delegation policy if the project actually uses agent delegation.

If delegation is used:

* delegate bounded, independently verifiable work;
* give the worker the exact relevant context and expected output;
* avoid multiple agents independently rediscovering the same repository;
* keep architecture/integration decisions with the lead agent;
* require the lead agent to verify delegated results.

Do not hard-code model names or “always use the cheapest model” unless the harness actually supports that policy and the user explicitly wants it.

---

# Deterministic Rules

If a requirement can be reliably enforced by:

* formatter,
* linter,
* test,
* CI,
* hook,
* permission configuration,
* or harness setting,

prefer deterministic enforcement over repeatedly telling the model to remember it.

The instruction file may reference that enforcement mechanism, but should not duplicate its full policy.

---

# Size / Context Budget

There is no target size to fill.

Smaller is better when all essential information is preserved.

As a practical heuristic:

* aim for roughly 60–150 lines for the root file when feasible;
* if it approaches ~200 lines, inspect it for information that should move to scoped instructions, documentation, skills, hooks, or deterministic tooling.

Never pad the file to reach a size target.

---

# Exclude

Do not include:

* generic software-engineering advice;
* tutorials;
* descriptions easily inferred from the repository;
* exhaustive file inventories;
* temporary task state;
* large API documentation;
* duplicated README content;
* speculative architecture;
* nonexistent tooling;
* aspirational rules the codebase does not actually follow;
* repeated versions of the same instruction.

---

# Final Sanity Check

After generating the instruction files, re-read them and verify:

1. Does every referenced path exist?
2. Are commands real and correctly scoped?
3. Does every important rule represent an actual project constraint?
4. Could any rule be inferred cheaply from the code itself?

   * If yes, consider deleting it.
5. Is temporary state mixed with durable knowledge?

   * If yes, move it elsewhere.
6. Are any instructions duplicated?
7. Are any instructions contradictory?
8. Is anything marked mandatory without a concrete reason?
9. Could deterministic tooling enforce a rule more reliably?
10. Would removing a line materially increase the chance the agent makes a mistake?

    * If no, delete it.

Then write the final `CLAUDE.md`, `AGENTS.md`, or scoped instruction files.
