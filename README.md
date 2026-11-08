# Chemical Inventory for Claude Code

Know what is on each shelf, what has expired, what is awaiting collection and which site inventory records need attention. Keep the containers, movements and declared maxima in a database you own.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. Install and run the demo. | Your locations, rules, LabCup mapping and shared screens. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=labcup) · [Instead of LabCup](https://enterprisedna.co/omni/instead-of/labcup?utm_source=github&utm_medium=readme&utm_campaign=labcup)

## Start with the Monday review

Requires Node 20 or later.

```bash
npm install
npm run demo
npm run chemicals -- weekly-review
npm run docs
npm run view
```

Open the folder in Claude Code, Codex, OpenCode or Cursor. Every runtime uses AGENTS.md, CLAUDE.md and the same slash commands. PGlite runs locally. DATABASE_URL selects PostgreSQL. Never seed a working database.

The demo is fictional: two laboratories, five containers, stale counts, expired stock, waste awaiting collection and missing safety information. Dates are relative to the first seed. Re-seeding preserves records. None of the fictional chemical information is suitable for handling real substances.

## Weekly rituals

/stocktake prepares the physical count. /expiring lists overdue and upcoming dates. /waste shows material still awaiting collection. /site-inventory compares declared maxima with recorded onsite quantities. /compliance finds missing record evidence. /weekly-review combines attention, compliance and expiry. /log-stock and /add-action record the work that follows.

30 CLI commands and 34 slash-command recipes. Every CLI command supports --json. Changes require --actor and support --dry-run. Codes, partial ids and case-insensitive names work. Ambiguous matches list candidates and exit 1. [Full command syntax](docs/operations.md).

## Ten questions you can answer today

These are demonstrated questions for this system. We do not claim that LabCup cannot answer them.

1. Which containers have not been counted within our review interval? Run stocktake and attention.
2. Which expired containers still have stock? Run expiring.
3. How much recorded onsite material is already marked as waste? Run site-inventory.
4. Where does current stock exceed the independently declared maximum? Run compliance.
5. Which substances lack a reviewed safety-sheet reference? Run compliance.
6. Which site has no recorded emergency inventory access arrangement? Run compliance.
7. Which owner has the most overdue inventory work? Run owner-load.
8. What quantity and location changed during a container movement? Run container.
9. Which follow-up was closed, by whom, with what evidence? Run activity and actions.
10. Which imported fields came from the original export? Run container on the imported barcode record.

## Bring your inventory

```bash
npm run chemicals -- import labcup --file=fixtures/labcup.csv --map=fixtures/labcup-map.json --source=fictional-demo --site=DEMO-NORTH --actor="Your name" --dry-run
```

The fixture is fictional. For real data, map the actual LabCup headings and use an authorised CSV or XLSX export. The single import command preserves original columns, reconciles unchanged repeats and rolls back an invalid batch. It never infers a missing hazard classification or overwrites changed duplicates. [Switching guide](docs/replace-labcup.md).

## Records, documents and views

The declared maximum likely at a workplace is separate from current stock. Waste stays onsite until collection is recorded. No incompatible units are summed. Stock movements retain before and after quantities, locations and evidence.

Edit brand.json once. npm run docs produces a site inventory working draft, stocktake sheet and waste handover working draft for each site. npm run view produces the weekly review, site quantities and stocktake snapshots. Draft commands write private HTML and send nothing.

/compliance checks selected inventory fields against the sources in [compliance.md](docs/compliance.md). It cannot classify chemicals, validate an SDS, assess safe storage or certify compliance. A competent person must review applicability and emergency access. This base does not replace mobile scanning, automatic SDS sourcing or live emergency information. [Why no front end](docs/why-no-front-end.md).

## Your first hour: ten things to ask for

1. Put our laboratory's name and logo on the reports.
2. Show the oldest physical counts.
3. Show expired stock separately from waste.
4. Explain why the solvent declaration needs review.
5. Draft a waste handover for the north site.
6. Test our column mapping without saving records.
7. Add our sites and location codes.
8. Assign follow-up to the inventory owner.
9. Add a report grouped by room and substance.
10. Add a purchasing reference field with a tested migration.

/customise writes and tests a numbered migration. /new-view adds a read-only report. The database is the record, the agent is the door.

## Verification and scope

npm test covers every command, migration and seed idempotence, quantities, waste custody, independent maxima, invalid and ambiguous input, transactional CSV/XLSX import, repeated and changed duplicates, audit history, export, escaped HTML, documents and views. Windows/Linux and PostgreSQL CI are configured. See [operations](docs/operations.md) for access, backup and shared-use requirements.

The selection uses an old reported annual LabCup quote and an official historic contract award. Neither is a current NZ/AU subscription price. [Evidence and six scores](docs/research.md). No public vendor price is presented as a current price, and no savings are promised.

Enterprise DNA maps your records, builds your workflow and shared interfaces, and runs your version through Omni by Enterprise DNA. One setup fee, then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=labcup).

MIT. Not affiliated with LabCup or Anthropic. Hosting and agent usage have their own costs.
