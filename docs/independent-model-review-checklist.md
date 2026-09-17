# Independent Model Review Checklist

The model is not independently certified. A reviewer who did not author the implementation must complete and sign this checklist before the product claims external validation.

## Review Scope

- Confirm supported household types, planning year, and explicit exclusions.
- Recalculate representative § 32a EStG cases, social contributions, church tax, allowances, and edge cases from primary sources.
- Reconcile SGB VI pension points, access factors, nominal/real values, and total versus incremental savings.
- Review investment return, volatility, correlation, fee, inflation, tax, and Monte Carlo assumptions.
- Reconcile each named instrument basket with the simulated strategic allocation and quantify proxy error.
- Review insurance needs formulas, applicability gates, and wording against licensed-advice boundaries.
- Challenge cash-flow feasibility, sequencing, debt treatment, negative values, zeros, and extreme inputs.

## Required Evidence

- Reviewer name, credentials, independence declaration, date, and reviewed commit SHA
- Primary-source citations and parameter effective dates
- Reproduction workbook or scripts with expected/actual results
- Severity-ranked findings, remediation owner, and retest outcome
- Signed decision: approved, approved with limitations, or rejected

## Ongoing Control

Repeat review after a statutory parameter update, model-assumption change, material formula change, or at least annually. The UI and exports must continue to say “model-generated” and “DIN-informed” unless the completed review explicitly supports stronger wording.
