import { Building2, Info, Layers3 } from 'lucide-react';

const money = value => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value ?? 0);
const percent = value => `${(value * 100).toFixed(1)}%`;
const fields = [
  ['Purchase price', 'property_price', '€', 1],
  ['Down payment', 'property_down_payment', '€', 1],
  ['Mortgage rate', 'mortgage_rate', '%', .1],
  ['Initial amortization', 'mortgage_amortization', '%', .1],
  ['Gross rental yield', 'gross_rental_yield', '%', .1],
  ['Annual appreciation', 'property_appreciation', '%', .1],
];

export default function PropertyView({ property, selected, profile, updateProfile }) {
  const occupancy = property.break_even_occupancy;
  const occupancyLabel = occupancy == null ? 'Not achievable (no rent)'
    : property.occupancy_feasible === false ? `Not achievable (${percent(occupancy)} required)` : percent(occupancy);

  return <div className="lab-property">
    <article className="lab-property-inputs">
      <div className="lab-chart-title"><div><span>Direct property case</span><h2>Leverage and cash-flow assumptions</h2></div><Building2 /></div>
      <div className="property-grid">{fields.map(([label, key, suffix, step]) => {
        const percentage = suffix === '%';
        return <label key={key}>{label}<div>
          <input type="number" min={key === 'property_appreciation' ? -20 : 0}
            max={percentage ? 100 : undefined} step={step}
            value={percentage ? Number(((profile[key] ?? 0) * 100).toFixed(2)) : profile[key] ?? 0}
            onChange={event => updateProfile({ [key]: Number(event.target.value) / (percentage ? 100 : 1) })} />
          <span>{suffix}</span>
        </div></label>;
      })}</div>
      <p className="property-warning"><Info size={14} />{property.warning}</p>
    </article>
    <article className="lab-property-results">
      <span>Leveraged property result · {property.horizon_years ?? profile.investment_years} years</span>
      <h2>{property.levered_irr == null ? 'Equity IRR not uniquely defined' : `${percent(property.levered_irr)} modeled equity IRR`}</h2>
      {property.levered_irr == null && <p>An IRR cannot be reported for these cash flows. Review the funding deficits and exit equity instead.</p>}
      <div className="property-result-grid">
        <div><small>Entry equity + costs</small><strong>{money((property.down_payment ?? 0) + (property.transaction_cost ?? 0))}</strong></div>
        <div><small>Scheduled monthly mortgage payment</small><strong>{money(property.monthly_mortgage_payment)}</strong></div>
        <div><small>Year-one net cash flow</small><strong className={property.annual_net_cash_flow < 0 ? 'negative' : ''}>{money(property.annual_net_cash_flow)}</strong></div>
        <div><small>Principal repaid</small><strong>{money(property.principal_paydown)}</strong></div>
        <div><small>Exit equity / remaining shortfall</small><strong className={property.exit_equity < 0 ? 'negative' : ''}>{money(property.exit_equity)}</strong></div>
        <div><small>Year-one break-even occupancy</small><strong>{occupancyLabel}</strong></div>
      </div>
      <div className="property-versus"><Layers3 />
        <div><span>Liquid portfolio median</span><strong>{money(selected.p50)}</strong></div>
        <div><span>Property exit equity</span><strong>{money(property.exit_equity)}</strong></div>
      </div>
      <p>These cases may require different initial capital and ongoing funding. Compare liquidity, concentration and cash-flow schedules—not only terminal values.</p>
    </article>
  </div>;
}
