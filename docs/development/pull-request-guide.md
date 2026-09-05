# 📖 Pull Request & Change Management Guide

This guide outlines the mandatory Pull Request (PR) workflow and change tracking policies for the **InfluencerHub** monolith repository.

---

## 🎯 PR Principles & Rules

1. **Mandatory Template**: Every pull request opened in GitHub must use the standard template located at [`.github/pull_request_template.md`](file:///c:/Project/InfluencerHubMonolith/.github/pull_request_template.md).
2. **PR Numbers**: The PR number must come strictly from GitHub once opened. PR numbers must **never** be invented or guessed.
3. **Commit SHAs**: The Commit SHA field must reflect the exact Git commit SHA(s) included in the PR.
4. **Target Version vs. Released Version**:
   - **Target Version**: Identifies the intended Semantic Version (`MAJOR.MINOR.PATCH`) for the change upon merge.
   - **Released Version**: Set to `N/A` while unreleased, and updated only when an official product release occurs.
5. **Git Tags**: A Git tag (e.g. `v0.1.0`) is created **only** for actual official releases, never per PR.
6. **Historical Commits**: Commits created prior to PR enforcement or without an associated GitHub PR must be recorded in documentation as `PR: N/A`.
7. **Git History Integrity**: Never rewrite, rebase, or amend existing Git history merely to add PR numbers or change documentation.

---

## 📋 Change Classification Standard

Every PR must classify changes across the following layers and types:

### Change Types
- `Frontend`
- `Backend`
- `Database`
- `Frontend + Backend`
- `Frontend + Database`
- `Backend + Database`
- `Frontend + Backend + Database`
- `Shared`
- `Infrastructure`
- `CI/CD`
- `Documentation`
- `Security`

### Release Types
- `Feature` (New backward-compatible functionality)
- `Fix` (Backward-compatible bug/security fix)
- `Security` (Security patch or vulnerability remediation)
- `Performance` (Performance optimization)
- `Refactor` (Code structural improvement without feature changes)
- `Infrastructure` (DevOps, build scripts, deployment configs)
- `Documentation` (Documentation updates)
- `Breaking Change` (Incompatible API or schema modifications)

### Risk Assessment
- `Low`: Minor fix, doc update, or localized low-impact change.
- `Medium`: Feature addition or component refactor touching core flows.
- `High`: Core auth, billing, DB schema migration, or multi-service dependency.
- `Critical`: Infrastructure rework, security fix, or major breaking change.

---

## 🔄 PR Workflow Lifecycle

```
Draft / Open PR
    ↓ (CI Validation: Typecheck, Build, Tests)
Code Review & Approval
    ↓
Merged to Target Branch (main / qa / uat)
    ↓
Entry Logged in Change Register (docs/development/change-register.md)
    ↓
Release Deployment -> Released Version & Git Tag (vX.Y.Z) Assigned
```
