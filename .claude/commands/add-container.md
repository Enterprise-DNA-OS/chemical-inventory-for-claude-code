---
description: "Register a chemical container"
---

Read `CLAUDE.md` and `docs/operations.md`. Resolve names against current records, not chat history.

Use the operator's real values, dates and identity. The example is syntax, not a request to create these records. Read the affected records first.

```bash
npm run chemicals -- add-container --code=BOTTLE-01 --name="Container label" --chemical=CHEM-01 --location=N-CAB --quantity=1 --owner="Inventory owner" --lot=LOT-01 --expiry=2027-02-01 --actor="Operator name" --dry-run --json
```

Inspect the result, then repeat without `--dry-run` within the operator's authorised scope. Report exactly what changed. Never infer a quantity, hazard, UN number, safety instruction or site maximum. List ambiguous matches and resolve them before writing.
