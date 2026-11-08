---
description: "Prepare the physical stocktake"
---

Read `CLAUDE.md` and `docs/operations.md`. Resolve names against current records, not chat history.

```bash
npm run chemicals -- stocktake --json
```

Report the returned facts, the site and any missing information. Do not invent records or use a clean report as a compliance certificate.
