# Workflow Changes - Manual Application Required

GitHub App lacks `workflows` permission. A human with push access must apply these changes.

## Issue #48: Centralize Node Version

Apply the patch `WORKFLOW_CHANGES_48.patch`:

```bash
patch -p1 < WORKFLOW_CHANGES_48.patch
```

Or manually edit:
1. `.github/workflows/import-architectures.yml` - add `env: NODE_VERSION: '22'` after permissions, change `node-version: 22` to `node-version: ${{ env.NODE_VERSION }}`
2. `.github/workflows/refresh-community-people.yml` - same changes

## Issue #66: Add Test Workflow

Create `.github/workflows/test.yml` from `WORKFLOW_NEW_66.yml`:

```bash
cp WORKFLOW_NEW_66.yml .github/workflows/test.yml
git add .github/workflows/test.yml
```

## After Applying

```bash
git add .github/workflows/
git commit --amend --no-edit
git push --force-with-lease
```
