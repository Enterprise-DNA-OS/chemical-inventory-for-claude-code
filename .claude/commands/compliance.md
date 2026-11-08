---
description: "Find missing inventory and safety-sheet records"
---

Read `CLAUDE.md` and `docs/operations.md`. Resolve names against current records, not chat history.

```bash
npm run chemicals -- compliance --json
```

Report the returned facts, the site and any missing information. Do not invent records or use a clean report as a compliance certificate.

Read `docs/compliance.md` for each rule and source. A finding is a record gap, not a legal conclusion. Verify applicability with the competent reviewer.
