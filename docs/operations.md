# Operating the inventory

Use Node 20 or later. Run npm install, npm run demo and npm run chemicals -- help in a fresh demo. PGlite stores data under .data/db or DATA_DIR. DATABASE_URL selects PostgreSQL. Never seed a working database. Shared seeding requires --demo-database and is only for disposable demos.

## Command syntax

Arguments are --key=value. Quote names with spaces. All CLI commands support --json. Every mutation requires --actor="Operator name" and supports --dry-run. Unknown flags and malformed dates are rejected. These examples illustrate arguments; substitute real codes and approved values.

### sites

Read the site register.

```bash
npm run chemicals -- sites --json
```

### locations

Read the storage locations.

```bash
npm run chemicals -- locations --json
```

### chemicals

Read chemical identities and recorded safety references.

```bash
npm run chemicals -- chemicals --json
```

### containers

Read the container register.

```bash
npm run chemicals -- containers --json
```

### container

Read one container and its movement history.

```bash
npm run chemicals -- container <code-or-name> --json
```

### stocktake

Prepare the physical stocktake.

```bash
npm run chemicals -- stocktake --json
```

### expiring

Review expired stock and the next month of expiries.

```bash
npm run chemicals -- expiring --json
```

### waste

Review waste awaiting collection.

```bash
npm run chemicals -- waste --json
```

### site-inventory

Compare declared site maxima with recorded onsite quantities.

```bash
npm run chemicals -- site-inventory --json
```

### compliance

Find missing inventory and safety-sheet records.

```bash
npm run chemicals -- compliance --json
```

### attention

Find overdue stocktake, expired stock, waste and actions.

```bash
npm run chemicals -- attention --json
```

### actions

Read inventory follow-up actions.

```bash
npm run chemicals -- actions --json
```

### owner-load

Balance outstanding inventory work by owner.

```bash
npm run chemicals -- owner-load --json
```

### activity

Read the recorded change history.

```bash
npm run chemicals -- activity --json
```

### weekly-review

Run the Monday inventory review.

```bash
npm run chemicals -- weekly-review --json
```

### help

Read the CLI command list.

```bash
npm run chemicals -- help --json
```

### add-site

Register a workplace.

```bash
npm run chemicals -- add-site --code=NORTH --name="North laboratory" --owner="Inventory owner" --actor="Operator name" --dry-run --json
```

### review-site

Record the emergency inventory access review.

```bash
npm run chemicals -- review-site NORTH --access="Describe verified arrangements" --due=2027-02-01 --actor="Operator name" --dry-run --json
```

### add-location

Register a storage location.

```bash
npm run chemicals -- add-location --code=N-CAB --name="North cabinet" --site=NORTH --actor="Operator name" --dry-run --json
```

### add-chemical

Register a chemical identity.

```bash
npm run chemicals -- add-chemical --code=CHEM-01 --name="Name from source" --unit=L --hazardous=unknown --actor="Operator name" --dry-run --json
```

### review-chemical

Record a competent person's chemical information review.

```bash
npm run chemicals -- review-chemical CHEM-01 --hazardous=true --un=none --storage="Verified source instructions" --sds="Accessible source reference" --due=2027-02-01 --actor="Operator name" --dry-run --json
```

### add-container

Register a chemical container.

```bash
npm run chemicals -- add-container --code=BOTTLE-01 --name="Container label" --chemical=CHEM-01 --location=N-CAB --quantity=1 --owner="Inventory owner" --lot=LOT-01 --expiry=2027-02-01 --actor="Operator name" --dry-run --json
```

### set-maximum

Record the maximum substance quantity likely on a site.

```bash
npm run chemicals -- set-maximum --site=NORTH --chemical=CHEM-01 --quantity=10 --basis="Documented peak holding estimate" --due=2027-02-01 --actor="Operator name" --dry-run --json
```

### log-stock

Record receipt, consumption, count, movement or waste collection.

```bash
npm run chemicals -- log-stock BOTTLE-01 --kind=count --quantity=1 --evidence="Physical count reference" --actor="Operator name" --dry-run --json
```

### add-action

Assign an inventory follow-up.

```bash
npm run chemicals -- add-action --code=ACT-03 --name="Review missing information" --site=NORTH --owner="Inventory owner" --due=2027-02-01 --actor="Operator name" --dry-run --json
```

### close-action

Close inventory follow-up with evidence.

```bash
npm run chemicals -- close-action ACT-03 --resolution="What was checked and completed" --actor="Operator name" --dry-run --json
```

### import

Import an authorised LabCup inventory export.

```bash
npm run chemicals -- import labcup --file=imports/labcup.csv --map=imports/column-map.json --source=north-labcup --site=NORTH --actor="Operator name" --dry-run --json
```

### export

Export the complete record and audit history.

```bash
npm run chemicals -- export --out=exports/snapshot.json --json
```

### draft-inventory

Prepare an inventory working draft for one site.

```bash
npm run chemicals -- draft-inventory NORTH --json
```

### draft-handover

Prepare a waste collection working draft for one site.

```bash
npm run chemicals -- draft-handover NORTH --json
```


## Quantity rules

Each chemical uses one canonical unit: L, kg or count. Quantities are nonnegative with at most six decimals. No automatic mass-volume or pack-size conversion occurs. Record the declared maximum likely on site separately with its basis and review date. This value is not a legal storage limit. Record checks flag current onsite quantity above the declaration.

log-stock kinds: receive adds stock; consume subtracts stock without allowing a negative balance; count sets the observed balance and records its date; move changes location; waste changes state while retaining quantity; remove records offsite collection from waste and sets onsite quantity to zero. Each event retains before and after quantities, locations, actor and evidence. Removed containers cannot be reopened. Counts cannot predate the latest recorded count. These are records of operator-confirmed events, not instructions to handle chemicals.

## Access and recovery

This base is a local single-operator tool. PGlite supports one process at a time. Shared PostgreSQL use requires a suitably restricted role and operator access arrangements. Row-level security is enabled with no public policies; application roles need deliberate configuration. Table owners bypass RLS. There is no identity provider or per-user UI. An actor name is a record, not proof of identity. Database administrators can alter audit history.

Keep production exports and source files under ignored imports/ and exports/ directories with restricted permissions. Documents and drafts contain private records. Do not commit them. Excel and CSV imports are treated as data, never executed. Files are not uploaded or sent anywhere. Formula cells are refused.

export writes a portable JSON snapshot in a repeatable-read transaction and refuses to overwrite an existing file. It is not an implemented restore command. Use PostgreSQL's normal backup and restore process for shared deployments. For local PGlite backups, stop all processes before copying the full data directory; test a restored copy before relying on it. Establish the actual retention and access policy with the site owner.

npm run docs renders three document types per site. npm run view renders three read-only snapshots. Change brand.json for the business name, logo and colours. Drafts use unique filenames. The report configuration is trusted operator code and runs in a read-only transaction.

npm test uses a temporary directory and never the normal local data. TEST_DATABASE_URL, when set, must point at an empty disposable database. CI covers Node 20 and 22 on Windows and Linux, plus PostgreSQL 17. A workflow file alone is not evidence that CI passed.
