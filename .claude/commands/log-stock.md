---
description: "Record receipt, consumption, count, movement or waste collection"
---

Read `CLAUDE.md` and `docs/operations.md`. Resolve names against current records, not chat history.

Use the operator's real values, dates and identity. The example is syntax, not a request to create these records. Read the affected records first.

```bash
npm run chemicals -- log-stock BOTTLE-01 --kind=count --quantity=1 --evidence="Physical count reference" --actor="Operator name" --dry-run --json
```

Inspect the result, then repeat without `--dry-run` within the operator's authorised scope. Report exactly what changed. Never infer a quantity, hazard, UN number, safety instruction or site maximum. List ambiguous matches and resolve them before writing.

Kinds: count requires quantity and optional ISO day; consume and receive require a positive quantity; move requires location; waste preserves quantity; remove requires waste state and evidence of offsite collection. No command authorises handling or disposal.
