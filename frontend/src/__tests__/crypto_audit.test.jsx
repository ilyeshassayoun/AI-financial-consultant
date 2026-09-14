import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { canonicalStringify, computeSha256Checksum, generateAuditDossier } from '../services/cryptoAudit';
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

  it('generates an immutable audit dossier with statutory standards and stamped checksum', async () => {
    const profile = { age: 35, income: 75000, monthly_investment: 600 };
    const analysis = {
      tax: { gross_tax: 18500, net_income: 56500, effective_tax_rate: 0.246 },
      retirement: { pension_gap_monthly: 520 },
      investment: { projected_p50: 320000 },
      advisory_plan: { financial_resilience_score: 85 }
    };

    const fixedTimestamp = '2026-09-14T11:00:00.000Z';
    const dossier = await generateAuditDossier(profile, analysis, fixedTimestamp);

    expect(dossier.engine_version).toBe('Fintech-Actuarial-Engine-v2026.1');
    expect(dossier.statutory_standards).toHaveLength(4);
    expect(dossier.cryptographic_verification.algorithm).toBe('SHA-256');
    expect(dossier.cryptographic_verification.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(dossier.verified_profile_inputs.income).toBe(75000);
    expect(dossier.verified_statutory_outputs.pension_gap_monthly).toBe(520);
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

    expect(screen.getByRole('dialog', { name: /cryptographic statutory audit dossier/i })).toBeInTheDocument();
    expect(screen.getByText(/VERIFIED TAMPER-EVIDENT/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('dossier-checksum')).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /download verified audit dossier \(json\)/i });
    expect(downloadBtn).toBeInTheDocument();

    const copyBtn = screen.getByRole('button', { name: /copy sha-256 checksum/i });
    fireEvent.click(copyBtn);
    expect(screen.getByText(/copied/i)).toBeInTheDocument();
  });
});
