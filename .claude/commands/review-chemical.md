---
description: "Record a competent person's chemical information review"
---

Read `CLAUDE.md` and `docs/operations.md`. Resolve names against current records, not chat history.

Use the operator's real values, dates and identity. The example is syntax, not a request to create these records. Read the affected records first.

```bash
npm run chemicals -- review-chemical CHEM-01 --hazardous=true --un=none --storage="Verified source instructions" --sds="Accessible source reference" --due=2027-02-01 --actor="Operator name" --dry-run --json
```

Inspect the result, then repeat without `--dry-run` within the operator's authorised scope. Report exactly what changed. Never infer a quantity, hazard, UN number, safety instruction or site maximum. List ambiguous matches and resolve them before writing.
