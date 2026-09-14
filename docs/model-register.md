# Financial Model Register

This register identifies the decision models exposed by the application. A model is suitable for release only when its parameters, units, limitations, validation cases, and reviewer are recorded here. Outputs are planning estimates, not binding tax, legal, insurance, or investment advice.

## Validation status

| Model | Owner in code | Inputs and units | Validation status | Principal limitations |
| --- | --- | --- | --- | --- |
| German annual income-tax estimate | `backend/tax_calculator.py` | Annual EUR income and deductions; household attributes | 2026 tariff boundaries and selected allowances have automated boundary tests. Parameters are versioned in `backend/statutory_parameters.py`. | Not a payroll or tax-return calculator; incomplete income types and document-specific deductions. |
| Social-insurance estimate | `backend/tax_calculator.py` | Annual EUR employment income; household and insurance attributes | Rate and ceiling behavior has unit coverage. | Average supplementary health-insurance rate; private-health contribution treatment is simplified. |
| Household investment projection | `backend/investment_engine.py` | EUR capital and contributions; annual decimal returns, volatility, inflation, and fees | Deterministic seed, percentile ordering, fee monotonicity, input bounds, and a repeatable convergence diagnostic are tested. Model ID: `household-investment-projection`. | Capital-market assumptions and correlations are scenario inputs, not forecasts; regime shifts and product tracking differences are not estimated. |
| Multi-strategy investment lab | `backend/advanced_investment_engine.py` | Five allocation scenarios using shared nominal assumptions and shocks | Deterministic comparisons, fee/inflation invariants, tax bridge, suitability gates, and property cash-flow edge cases are tested. Model ID: `multi-strategy-investment-lab`. | This is a comparison model, so its outputs must not be silently substituted for the household projection. Annual sampling omits intra-year drawdowns. |
| Historical stress test | `backend/stress_test_engine.py` | EUR capital/cash flow, portfolio weights, withdrawal rate | Scenario and failure behavior have regression tests. | Illustrative historical regimes; limited asset proxies and no guarantee that future crises follow them. |
| Pension-gap estimate | `backend/retirement_planner.py` | Annual EUR income, ages, pension points, inflation | Formula and boundary tests cover accumulation and retirement cases. | Requires official DRV records for a personal estimate; future pension values and inflation are assumptions. |
| Insurance needs estimate | `backend/insurance_engine.py` | Monthly EUR spending/income, dependants, debts, existing cover | Priority and needs-calculation tests cover major branches. | Product terms, exclusions, health underwriting, and insurer suitability require licensed review. |
| Financial-health score | `backend/advisory_engine.py` | Cross-domain model outputs | Component and regression tests cover score bounds and recommendations. | Internal prioritisation heuristic; it is not a DIN 77230 certification or conformity assessment. |

## 2026 tax parameter provenance

Parameter set `de-tax-2026.1` currently covers the § 32a EStG tariff boundaries, €12,348 Grundfreibetrag, €259 monthly child benefit, €9,756 child allowance, and €40,700 joint Solidaritätszuschlag threshold. Primary references:

- [Federal Ministry of Finance: key tax changes and 2025/2026 tables](https://www.bundesfinanzministerium.de/Content/DE/Standardartikel/Themen/Steuern/das-aendert-sich-2025.html)
- [Federal Ministry of Finance: key tax changes for 2026](https://www.bundesfinanzministerium.de/Monatsberichte/Ausgabe/2026/02/Inhalte/Kapitel-2-Analysen/2-5-wichtigste-steuerliche-aenderungen-2026-pdf.pdf)

## Release review checklist

- Record the parameter-set version in the API result.
- Add an independently calculated reference case for every material formula change.
- Verify nominal/real, annual/monthly, gross/net, and decimal/percentage units.
- Confirm frontend displays server results or labels any offline approximation.
- Review changes to assumptions separately from changes to implementation.
- Record reviewer, review date, unresolved limitations, and next statutory review date.

## Automated validation evidence

- `backend/tests/fixtures/tax_2026_reference_cases.json` records tariff-boundary expected values independently from the calculator implementation and links them to the published § 32a equations.
- `backend/model_validation.py` compares P10, P50, and P90 estimates at increasing sample sizes against a deterministic larger run. Its tolerance measures sampling stability only, not forecast accuracy.
- Investment tests require higher fees to reduce outcomes under identical shocks, positive inflation to keep real values below nominal values, and losses not to consume the saver allowance.
- `backend/tests/test_cross_surface_consistency.py` verifies that tax, investment, and retirement values exported in the audit dossier exactly match the canonical analysis response. This test also prevents nested tax fields from silently exporting as zero.

## Open validation work

1. Replace undocumented investment return, volatility, and correlation assumptions with a dated capital-market-assumption dataset or label them as user-editable scenarios.
2. Reconcile the client-side time-travel and stress-test approximations with server model contracts.
3. Add reference cases reviewed by a German tax professional and a qualified financial planner.
4. Add a statutory update procedure and automated warning when a parameter set is outside its supported year.
