/**
 * Calculation Snapshot & Integrity Service (RFC 8785 JCS + SHA-256)
 * Generates deterministic canonical serialization and tamper-evident SHA-256 calculation checksums
 * over statutory inputs (§ 32a EStG, SGB VI, DIN 77230) and actuarial projection outputs.
 */

// Pure-JS standard SHA-256 implementation fallback for environments without subtle crypto
function jsSha256(bytes) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const l = bytes.length;
  const bitLen = l * 8;
  const newLen = (((l + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(newLen);
  padded.set(bytes);
  padded[l] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(newLen - 4, bitLen, false);

  for (let i = 0; i < newLen; i += 64) {
    const W = new Uint32Array(64);
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(i + t * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rightRotate(W[t - 15], 7) ^ rightRotate(W[t - 15], 18) ^ (W[t - 15] >>> 3);
      const s1 = rightRotate(W[t - 2], 17) ^ rightRotate(W[t - 2], 19) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;

    for (let t = 0; t < 64; t++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return H.map(val => val.toString(16).padStart(8, '0')).join('');
}

/**
 * RFC 8785 JSON Canonicalization Scheme (JCS).
 * Lexicographical property ordering, no whitespace, IEEE 754 float representation.
 */
export function canonicalStringify(obj) {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) throw new TypeError('Non-finite numbers cannot be canonicalized');
    return Object.is(obj, -0) ? '0' : String(obj);
  }
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalStringify(item)).join(',') + ']';
  }
  if (typeof obj === 'object') {
    const sortedKeys = Object.keys(obj).sort();
    const entries = sortedKeys.map(k => JSON.stringify(k) + ':' + canonicalStringify(obj[k]));
    return '{' + entries.join(',') + '}';
  }
  return JSON.stringify(obj);
}

/**
 * Computes deterministic SHA-256 checksum over input string or object.
 */
export async function computeSha256Checksum(data) {
  const canonical = typeof data === 'string' ? data : canonicalStringify(data);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(canonical);

  const subtle = (typeof window !== 'undefined' && window.crypto?.subtle)
    || (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle);

  if (subtle && typeof subtle.digest === 'function') {
    try {
      const hashBuffer = await subtle.digest('SHA-256', bytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return jsSha256(bytes);
    }
  }

  return jsSha256(bytes);
}

function finiteNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Extracts and standardizes statutory inputs and outputs for tamper-evident audit.
 */
export function buildStatutoryAuditPayload(profile = {}, analysis = {}) {
  const recordedInputs = {
    age: finiteNumber(profile.age, 30),
    retirement_age: finiteNumber(profile.retirement_age, 67),
    longevity_age: finiteNumber(profile.longevity_age, 95),
    income: finiteNumber(profile.income, 60000),
    secondary_income: finiteNumber(profile.secondary_income),
    tax_class: finiteNumber(profile.tax_class, 1),
    is_married: Boolean(profile.is_married),
    has_dependents: Boolean(profile.has_dependents),
    num_children: finiteNumber(profile.num_children),
    church_tax: Boolean(profile.church_tax),
    is_saxony: Boolean(profile.is_saxony),
    initial_amount: finiteNumber(profile.initial_amount, 5000),
    monthly_investment: finiteNumber(profile.monthly_investment, 500),
    investment_years: finiteNumber(profile.investment_years, 20),
    risk_profile: String(profile.risk_profile || 'medium'),
    investment_strategy: String(profile.investment_strategy || 'balanced_60_40'),
    safe_withdrawal_rate: finiteNumber(profile.safe_withdrawal_rate, 0.035),
    target_pension_ratio: finiteNumber(profile.target_pension_ratio, 0.8),
    existing_insurances: Array.isArray(profile.existing_insurances) ? [...profile.existing_insurances].sort() : ['Liability']
  };

  const tax = analysis.tax || {};
  const pension = analysis.retirement || {};
  const investment = analysis.investment || {};
  const plan = analysis.advisory_plan || {};

  const modelOutputs = {
    gross_tax: finiteNumber(tax.tax_amount ?? tax.gross_tax),
    net_income: finiteNumber(tax.net_income),
    effective_rate: finiteNumber(tax.effective_tax_rate ?? tax.effective_rate),
    marginal_rate: finiteNumber(tax.marginal_tax_rate ?? tax.marginal_rate),
    projected_state_pension_monthly: finiteNumber(
      pension.state_pension_monthly
        ?? pension.state_pension_monthly_real_gross
        ?? pension.projected_statutory_pension
        ?? pension.net_pension_monthly
    ),
    pension_gap_monthly: finiteNumber(pension.pension_gap_monthly),
    terminal_wealth_p50: finiteNumber(investment.projected_p50 ?? investment.terminal_wealth),
    portfolio_label: String(investment.portfolio_label || 'Balanced'),
    financial_resilience_score: finiteNumber(plan.financial_resilience_score, 75)
  };

  return { recordedInputs, modelOutputs };
}

/**
 * Generates a calculation snapshot with a SHA-256 integrity fingerprint.
 * The fingerprint detects later changes; it is not an external audit or
 * independent certification of the calculations.
 */
export async function generateAuditDossier(profile = {}, analysis = {}, customTimestamp = null) {
  const { recordedInputs, modelOutputs } = buildStatutoryAuditPayload(profile, analysis);
  const timestamp = customTimestamp || new Date().toISOString();

  const statutoryStandards = [
    'Workflow informed by DIN 77230 household analysis categories',
    '§ 32a EStG Income Tax Tariff Progressionszone Formulas',
    'SGB VI Statutory Pension Calculation (Entgeltpunkte & Access Factor)',
    '§ 20 InvStG 30% Equity Fund Partial Exemption (Teilfreistellung)'
  ];

  // The payload over which the cryptographic hash is strictly evaluated
  const coreSignablePayload = {
    standards: statutoryStandards,
    inputs: recordedInputs,
    outputs: modelOutputs,
    timestamp
  };

  const checksum = await computeSha256Checksum(coreSignablePayload);

  return {
    dossier_id: `dossier-${timestamp.slice(0, 10)}-${checksum.slice(0, 8)}`,
    timestamp,
    engine_version: 'Fintech-Actuarial-Engine-v2026.1',
    review_status: {
      profile_inputs: 'self-reported',
      calculation_outputs: 'model-generated',
      independently_reviewed: false
    },
    planning_references: statutoryStandards,
    integrity_check: {
      algorithm: 'SHA-256',
      checksum,
      tamper_evident: true,
      assurance: 'Integrity check only; not an independent audit or certification',
      canonicalization: 'RFC 8785 JSON Canonicalization Scheme'
    },
    recorded_profile_inputs: recordedInputs,
    model_outputs: modelOutputs
  };
}

/**
 * Triggers a browser download of the calculation snapshot as a JSON file.
 */
export function downloadDossierFile(dossier) {
  const jsonContent = JSON.stringify(dossier, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `calculation_snapshot_${dossier?.integrity_check?.checksum?.slice(0, 12) || 'unavailable'}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
