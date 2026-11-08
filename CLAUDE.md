# Chemical Inventory for Claude Code

For laboratory managers and chemical inventory owners. The database holds containers, quantities, locations, site maxima, safety references and follow-up. The agent records the operator's decisions. It never supplies chemical safety decisions.

Read the current CLI records before answering. Every recurring job uses the matching file in .claude/commands/. All runtimes use this one library.

## Routing

- /sites: Read the site register.
- /locations: Read the storage locations.
- /chemicals: Read chemical identities and recorded safety references.
- /containers: Read the container register.
- /container: Read one container and its movement history.
- /stocktake: Prepare the physical stocktake.
- /expiring: Review expired stock and the next month of expiries.
- /waste: Review waste awaiting collection.
- /site-inventory: Compare declared site maxima with recorded onsite quantities.
- /compliance: Find missing inventory and safety-sheet records.
- /attention: Find overdue stocktake, expired stock, waste and actions.
- /actions: Read inventory follow-up actions.
- /owner-load: Balance outstanding inventory work by owner.
- /activity: Read the recorded change history.
- /weekly-review: Run the Monday inventory review.
- /help: Read the CLI command list.
- /add-site: Register a workplace.
- /review-site: Record the emergency inventory access review.
- /add-location: Register a storage location.
- /add-chemical: Register a chemical identity.
- /review-chemical: Record a competent person's chemical information review.
- /add-container: Register a chemical container.
- /set-maximum: Record the maximum substance quantity likely on a site.
- /log-stock: Record receipt, consumption, count, movement or waste collection.
- /add-action: Assign an inventory follow-up.
- /close-action: Close inventory follow-up with evidence.
- /import: Import an authorised LabCup inventory export.
- /export: Export the complete record and audit history.
- /draft-inventory: Prepare an inventory working draft for one site.
- /draft-handover: Prepare a waste collection working draft for one site.

- /customise: write a numbered migration, update commands, test, then apply within the authorised scope.
- /new-view: add a read-only branded report from existing records.
- /docs and /view: render the configured paperwork and snapshots.

## Rules

Every mutation requires --actor and supports --dry-run. Use case-insensitive names, exact codes or partial ids. If ambiguous, list the candidates and ask the operator to identify the right one. Never guess a safety classification, quantity, storage rule or maximum. Unknown information remains unknown.

Read docs/compliance.md before interpreting checks and docs/replace-labcup.md before import. A clean record check is not legal or chemical safety approval. Waste remains onsite until collection is recorded. Current stock never becomes the declared site maximum automatically. No sends, notifications, external API writes, deletion or safety certification ship here.

Never seed a working database. Shared demo seed requires --demo-database. Tests require an empty disposable TEST_DATABASE_URL or a temporary local store. Keep exports, real imports, safety documents and generated reports private. Review access and backups before shared use. The audit records operator-supplied names, not authenticated identities, and is not tamper-proof.

Stay on main. Run npm test after functional changes. Run npm run docs and npm run view after report changes. Do not edit applied migrations. AGENTS.md sends every agent here.
