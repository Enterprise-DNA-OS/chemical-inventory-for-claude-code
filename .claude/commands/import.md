---
description: "Import an authorised LabCup inventory export"
---

Read `CLAUDE.md` and `docs/operations.md`. Resolve names against current records, not chat history.

Use the operator's real values, dates and identity. The example is syntax, not a request to create these records. Read the affected records first.

```bash
npm run chemicals -- import labcup --file=imports/labcup.csv --map=imports/column-map.json --source=north-labcup --site=NORTH --actor="Operator name" --dry-run --json
```

Inspect the result, then repeat without `--dry-run` within the operator's authorised scope. Report exactly what changed. Never infer a quantity, hazard, UN number, safety instruction or site maximum. List ambiguous matches and resolve them before writing.

Read `docs/replace-labcup.md`. Review the actual export headings, mapping, source identity and destination site. Reconcile totals after the test run. The fixture is fictional. Changed duplicates stop the batch.
