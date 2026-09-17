import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { canonicalStringify, computeSha256Checksum, buildStatutoryAuditPayload, generateAuditDossier } from '../services/cryptoAudit';
import AuditDossierModal from '../components/AuditDossierModal';

describe('Cryptographic Calculation Verification & Audit Dossier (R5)', () => {
  it('canonicalizes JSON deterministically independent of property insertion order (RFC 8785)', () => {
    const objA = { b: 2, a: 1, nested: { y: 20, x: 10 } };
    const objB = { nested: { x: 10, y: 20 }, a: 1, b: 2 };

    expect(canonicalStringify(objA)).toBe(canonicalStringify(objB));
    expect(canonicalStringify(objA)).toBe('{"a":1,"b":2,"nested":{"x":10,"y":20}}');
  });

  it('computes a 64-character lowercase hexadecimal SHA-256 checksum with cryptographic avalanche effect', async () => {
    const input1 = { age: 30, income: 60000 };
    const input2 = { age: 30, income: 60001 }; // 1 euro difference

    const hash1 = await computeSha256Checksum(input1);
    const hash2 = await computeSha256Checksum(input2);

    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    expect(hash2).toMatch(/^[a-f0-9]{64}$/);
    expect(hash1).not.toBe(hash2);
  });

  it('generates a calculation snapshot with references and a stamped checksum', async () => {
    const profile = { age: 35, income: 75000, monthly_investment: 600 };
    const analysis = {
      tax: { tax_amount: 18500, net_income: 56500, effective_tax_rate: 0.246 },
      retirement: { state_pension_monthly: 1420, pension_gap_monthly: 520 },
      investment: { projected_p50: 320000 },
      advisory_plan: { financial_resilience_score: 85 }
    };

    const fixedTimestamp = '2026-09-14T11:00:00.000Z';
    const dossier = await generateAuditDossier(profile, analysis, fixedTimestamp);

    expect(dossier.engine_version).toBe('Fintech-Actuarial-Engine-v2026.1');
    expect(dossier.planning_references).toHaveLength(4);
    expect(dossier.integrity_check.algorithm).toBe('SHA-256');
    expect(dossier.integrity_check.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(dossier.recorded_profile_inputs.income).toBe(75000);
    expect(dossier.model_outputs.gross_tax).toBe(18500);
    expect(dossier.model_outputs.projected_state_pension_monthly).toBe(1420);
    expect(dossier.model_outputs.pension_gap_monthly).toBe(520);
    expect(dossier.review_status.independently_reviewed).toBe(false);
  });

  it('preserves intentional zero values instead of replacing them with defaults', () => {
    const { recordedInputs, modelOutputs } = buildStatutoryAuditPayload(
      { income: 0, initial_amount: 0, monthly_investment: 0 },
      { advisory_plan: { financial_resilience_score: 0 } },
    );

    expect(recordedInputs.income).toBe(0);
    expect(recordedInputs.initial_amount).toBe(0);
    expect(recordedInputs.monthly_investment).toBe(0);
    expect(modelOutputs.financial_resilience_score).toBe(0);
  });

  it('renders AuditDossierModal with checksum seal and download trigger', async () => {
    const profile = { age: 30, income: 60000 };
    const analysis = { tax: { net_income: 42000 } };
    const onClose = vi.fn();

    render(
      <AuditDossierModal
        isOpen={true}
        onClose={onClose}
        profile={profile}
        analysis={analysis}
      />
    );

    expect(screen.getByRole('dialog', { name: /calculation record & integrity check/i })).toBeInTheDocument();
    expect(screen.getByText(/snapshot integrity/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('dossier-checksum')).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /download calculation snapshot \(json\)/i });
    expect(downloadBtn).toBeInTheDocument();

    const copyBtn = screen.getByRole('button', { name: /copy sha-256 checksum/i });
    fireEvent.click(copyBtn);
    expect(screen.getByText(/copied/i)).toBeInTheDocument();
  });
});
