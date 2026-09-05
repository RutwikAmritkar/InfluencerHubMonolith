# 🚀 Release & Versioning Policy

This document defines the official release workflow and Semantic Versioning policy for **InfluencerHub**.

---

## 📌 Core Versioning Concepts

- **PR ≠ Release**: Merging a Pull Request integrates code into a target branch (`main`, `qa`, `uat`), but does not constitute a product release.
- **Commit ≠ Release**: Commits track granular code evolution. Individual commits are assigned a **Target Version**.
- **Version = Product Release**: A product release represents a tested, approved, and deployed milestone of the monolith.
- **Git Tag = Permanent Release Marker**: An annotated Git tag (e.g. `v0.1.0`) is created **only** when an official product release is published.

---

## 🔢 Semantic Versioning (SemVer)

We adhere strictly to [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **PATCH** (`0.0.X`): Backward-compatible bug fixes, security patches, and localized performance adjustments.
- **MINOR** (`0.X.0`): Backward-compatible new features, new API endpoints, or enhanced platform capabilities.
- **MAJOR** (`X.0.0`): Incompatible API changes, database breaking schema shifts, or major framework migrations.

*Note: Pre-1.0 development versions (e.g., `0.1.0`, `0.2.0`, `0.2.1`) indicate initial platform stabilization prior to general production release.*

---

## 🔁 Release Execution Lifecycle Example

```
Pull Request (#42)
    ↓
Target Version Assigned: 0.3.0
    ↓
Merged into main
    ↓
Staging & Deployment Validation
    ↓
Official Release Published: 0.3.0
    ↓
Git Tag Created: v0.3.0
```

---

## 📝 Release Checklist

When executing an official release:

1. Update [`CHANGELOG.md`](file:///c:/Project/InfluencerHubMonolith/CHANGELOG.md): Move entries from `[Unreleased]` to `[X.Y.Z] - YYYY-MM-DD`.
2. Update **Released Version** in [`docs/development/change-register.md`](file:///c:/Project/InfluencerHubMonolith/docs/development/change-register.md).
3. Create signed/annotated Git tag:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   ```
4. Push release tag to GitHub remote (when authorized):
   ```bash
   git push origin vX.Y.Z
   ```
