# Move chemical inventory from LabCup

LabCup's [chemical inventory page](https://www.labcup.net/modules/chemical-inventory), checked 8 November 2026, says inventory data, including chemical and hazard information, can be exported, subject to institutional restrictions. Its public documentation does not specify a universal export header layout. This importer does not pretend that the fictional fixture is a vendor export.

1. Obtain permission from the inventory owner. Export the relevant inventory with stable container barcodes, names, locations, quantities, units and owners. Confirm the export includes containers marked for disposal. Ask the administrator for the available CSV or XLSX export. Save an untouched copy privately.
2. Compare its actual column headings with `fixtures/labcup-map.json`. Make an authorised copy in `imports/` mapping canonical fields to your export headings. Required: barcode, name, location, quantity, unit, owner. Optional: lot, expiry, counted, state, cas, hazardous, un_number, storage_notes, sds_reference. Every mapped heading must exist. The loader preserves all columns, including unmapped ones.
3. Create the destination site with `add-site`, then run the single import command below. Pick one worksheet with `--sheet=SheetName` when the workbook has more than one. Run each site separately and use a stable, site-specific source name, not a changing filename.
4. Compare source row counts, quantities grouped by unit and location, waste, expiry dates and a sample of physical barcodes. A repeated unchanged batch is a no-op. A changed duplicate stops the batch for reconciliation. Reconcile subsequent movements through `log-stock` with evidence. Never silently replace current stock with an older export.

```bash
npm run chemicals -- import labcup --file=imports/labcup.xlsx --map=imports/column-map.json --sheet=Inventory --source=north-labcup --site=NORTH --actor="Inventory owner" --dry-run
```

Repeat without `--dry-run` to save. CSV uses the same command with a `.csv` filename. The required unit field must be L, kg or count. Convert mL or g explicitly with a documented factor before import and retain the untouched export. The loader never guesses a conversion, date format, density or missing owner. Dates are ISO YYYY-MM-DD; native Excel date cells are supported. Formulas, duplicate headings, duplicate barcodes within a batch, malformed CSV and changed duplicate rows fail the whole batch.

Imports start new locally managed stock records. Imported hazard fields remain unreviewed. Review hazard status and source documents, record declared site maxima independently of stock counts, and confirm emergency access. Existing LabCup access rules, floorplans, automatic safety sheet sourcing, chemical structures, labels, photos, equipment bookings, training, historic movement logs and regulatory reports are not reconstructed by this importer. Export and retain their originals separately. Source links are stored without fetching attachments. The import does not call LabCup or change anything there.

For a single authorised inventory export, import and reconcile in one working day. Mapping and safety review depend on the quality and scope of the export. Enterprise DNA handles mapping, additional history, shared access and integrations in a scoped custom version. Keep the existing operational system until the owner accepts the reconciliation and the replacement arrangements.
