# Inventory record checks

Checked 8 November 2026. Scope: New Zealand workplace inventory records. A competent person establishes applicability, exceptions, hazard classifications, segregation and emergency arrangements. The system checks recorded evidence. It does not certify a site, prescribe chemical handling, calculate legal storage thresholds or classify mixtures. Australian sites need their state or territory rules mapped before use.

[WorkSafe inventory guidance](https://www.worksafe.govt.nz/topic-and-industry/hazardous-substances/managing/inventory/) describes site-specific inventory, peak expected quantities, locations, storage requirements, safety information and waste. It also explains emergency access after evacuation and exceptions, including some laboratories. Check applicability before relying on these prompts.

| Rule | Implemented record check | Basis |
|---|---|---|
| INV-CLASS | Unknown hazardous status needs review | Local conservative policy: unknown is never treated as non-hazardous |
| INV-MAX | Missing or overdue declared maximum, or recorded onsite quantity above it | WorkSafe inventory guidance; due date is an operator policy |
| INV-STORAGE | Missing storage and segregation notes | WorkSafe inventory guidance |
| INV-UN | UN number applicability not reviewed | WorkSafe inventory guidance; a reviewed substance can have no UN number |
| INV-ACCESS | Missing or overdue emergency access arrangement | WorkSafe inventory guidance; the review interval is local policy |
| SDS-REVIEW | Missing safety sheet reference or overdue review | WorkSafe safety data sheet guidance; the due date is local policy |

[WorkSafe safety data sheet guidance](https://www.worksafe.govt.nz/topic-and-industry/hazardous-substances/managing/safety-data-sheets/) explains obtaining current sheets, keeping the information with inventory and making it accessible to affected workers and emergency services. A stored reference is only a pointer. This software neither downloads a sheet nor proves its accuracy, availability or currency.

Run `npm run chemicals -- compliance --json`. Results identify site, record and rule. No findings means only that these fields passed these checks. It does not establish legal compliance. The stocktake attention interval of 90 days and expiry lookahead of 30 days are local demo policies, not statutory deadlines. Quantities use L, kg or count per substance. No density conversion or addition across incompatible units occurs.

Waste remains in the onsite total until an operator records offsite collection with evidence. [WorkSafe hazardous waste guidance](https://www.worksafe.govt.nz/topic-and-industry/hazardous-substances/managing/hazardous-waste/) covers waste inventory information. A handover draft is not an approved transport document, waste classification or disposal instruction. The operator and collection provider establish those separately.

The demo uses fictional substances and incomplete safety information deliberately. Never use its records to handle a real chemical.
