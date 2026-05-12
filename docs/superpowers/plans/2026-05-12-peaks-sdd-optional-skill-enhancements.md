# Peaks SDD Optional Skill Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let every peaks-sdd agent advertise external skills that can enhance its expertise, explain installation value to users, and only install after user approval.

**Architecture:** Keep agent templates free of `skills:` frontmatter so optional skills are not hard dependencies. Add a single `references/optional-skills.md` manifest plus small per-agent `Optional Skill Enhancements` sections that point agents to the manifest and define the approval/install/fallback behavior.

**Tech Stack:** Markdown skill definitions, Claude Code agent templates, local peaks-sdd references.

---

### Task 1: Add optional skills manifest

**Files:**
- Create: `skills/peaks-sdd/references/optional-skills.md`

- [ ] **Step 1: Create the manifest**

Write `skills/peaks-sdd/references/optional-skills.md` with agent-specific optional skill recommendations, benefits, and fallback behavior.

- [ ] **Step 2: Verify manifest content**

Run: `grep -n "^## \|^| Agent" skills/peaks-sdd/references/optional-skills.md`
Expected: headings for policy and each agent group.

### Task 2: Update main references

**Files:**
- Modify: `skills/peaks-sdd/SKILL.md`
- Modify: `skills/peaks-sdd/references/existing-project-initialization.md`
- Modify: `skills/peaks-sdd/references/dispatch-quickref.md`

- [ ] **Step 1: Document runtime policy**

Update the entrypoint and initialization docs so initialization does not install optional skills, but agents may recommend task-relevant optional skills with benefits and install after user approval.

- [ ] **Step 2: Update quick reference**

Update dispatch quick reference to point to `references/optional-skills.md` and describe optional skills as enhancements, not dependencies.

### Task 3: Add per-agent enhancement guidance

**Files:**
- Modify: `skills/peaks-sdd/templates/agents/*.md`
- Modify: `skills/peaks-sdd/templates/agents/qa/*.md`
- Modify: `skills/peaks-sdd/templates/agents/sub-front/*.md`
- Modify: `skills/peaks-sdd/templates/agents/sub-back/*.md`

- [ ] **Step 1: Add a standard optional enhancement section**

Add `## Optional Skill Enhancements` sections to key agent templates. Each section must say: check `references/optional-skills.md`, explain benefits, ask before install, install only after approval, and fallback to built-in workflow if declined or failed.

- [ ] **Step 2: Keep frontmatter lightweight**

Do not re-add `skills:` frontmatter.

### Task 4: Validate

**Files:**
- Check: `skills/peaks-sdd/**`

- [ ] **Step 1: Verify no hard dependency frontmatter remains**

Run: `grep -R "^skills:" -n skills/peaks-sdd/templates/agents --include='*.md' || true`
Expected: no output.

- [ ] **Step 2: Verify optional policy references exist**

Run: `grep -R "optional-skills.md\|Optional Skill Enhancements" -n skills/peaks-sdd --include='*.md'`
Expected: SKILL.md/reference docs and agent templates mention optional enhancements.
