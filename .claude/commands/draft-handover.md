---
description: "Prepare a waste collection working draft for one site"
---

Read `CLAUDE.md` and `docs/operations.md`. Resolve names against current records, not chat history.

```bash
npm run chemicals -- draft-handover NORTH --json
```

Report the returned facts, the site and any missing information. Do not invent records or use a clean report as a compliance certificate.

Return the generated private file to the operator. It is a working draft with record gaps shown. Never send, submit, certify or publish it.
