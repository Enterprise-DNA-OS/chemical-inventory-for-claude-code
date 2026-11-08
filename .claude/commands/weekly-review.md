---
description: "Run the Monday inventory review"
---

Read `CLAUDE.md` and `docs/operations.md`. Resolve names against current records, not chat history.

```bash
npm run chemicals -- weekly-review --json
```

Report the returned facts, the site and any missing information. Do not invent records or use a clean report as a compliance certificate.

Run `attention`, `compliance` and `expiring` separately as well. Present the urgent findings, the responsible owners and proposed follow-up. Draft actions for the operator to review. Never send them.
