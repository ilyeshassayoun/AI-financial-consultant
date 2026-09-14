import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdvisorDrawer from '../components/AdvisorDrawer';
import * as apiService from '../services/apiService';
import { useProfileStore } from '../stores/profileStore';

describe('SSE Client Synchronization & Real-Time AI Streaming (R2)', () => {
  const mockProfile = {
    age: 32,
    income: 65000,
    monthly_investment: 500,
    retirement_age: 67
  };

  const mockAnalysis = {
    tax: { gross_tax: 16000, net_income: 49000, effective_tax_rate: 0.246 },
    retirement: { pension_gap_monthly: 642 }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useProfileStore.setState({
      profile: { ...mockProfile },
      scenarioOverrides: {}
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses SSE stream chunks into tokens and structured function events via streamChatReply', async () => {
    const ssePayload = [
      'event: token\ndata: {"token": "In accordance with § 32a EStG, "}\n\n',
      'event: highlight_metric\ndata: {"target": "pension_gap", "severity": "warning", "tooltip": "Net Rentenlücke €642/mo"}\n\n',
      'event: delta_badge\ndata: {"target": "effective_tax_rate", "old_val": "34.2%", "new_val": "31.8%", "delta": "-2.4%"}\n\n',
      'event: patch_proposal\ndata: {"proposal_id": "opt-etf-1", "title": "Increase ETF Investment", "patch": {"monthly_investment": 750}, "impact": {"pension_gap": "-€300/mo"}}\n\n',
      'event: statutory_citation\ndata: {"statute": "§ 32a EStG", "title": "Income Tax Tariff Zone", "official_url": "https://www.gesetze-im-internet.de/estg/__32a.html"}\n\n',
      'data: [DONE]\n\n'
    ].join('');

    const mockReadableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(ssePayload));
        controller.close();
      }
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'text/event-stream' },
      body: mockReadableStream
    });

    const receivedTokens = [];
    const receivedEvents = [];

    await apiService.streamChatReply(
      mockProfile,
      [{ role: 'user', content: 'Audit my taxes' }],
      (token) => receivedTokens.push(token),
      (event) => receivedEvents.push(event)
    );

    expect(receivedTokens.join('')).toContain('In accordance with § 32a EStG');
    expect(receivedEvents).toHaveLength(4);
    expect(receivedEvents.map(e => e.event)).toEqual([
      'highlight_metric',
      'delta_badge',
      'patch_proposal',
      'statutory_citation'
    ]);
  });

  it('renders AdvisorDrawer and handles structured SSE events in real-time UI', async () => {
    const mockOnApplyPatch = vi.fn();

    // Mock streamChatReply to invoke token and events directly
    vi.spyOn(apiService, 'streamChatReply').mockImplementation(async (prof, msgs, onChunk, onEvent) => {
      onChunk('Here is your optimized retirement mandate.');
      if (onEvent) {
        onEvent({
          event: 'highlight_metric',
          data: { target: 'pension_gap', tooltip: 'Net Rentenlücke €642/mo detected' }
        });
        onEvent({
          event: 'delta_badge',
          data: { target: 'effective_tax_rate', old_val: '34.2%', new_val: '31.8%', delta: '-2.4%' }
        });
        onEvent({
          event: 'patch_proposal',
          data: {
            proposal_id: 'patch-drv-etf',
            title: 'Close Pension Gap with ETF',
            description: 'Increase monthly contribution by €250/mo to close 100% of the statutory gap.',
            patch: { monthly_investment: 750 },
            impact: { pension_gap_reduction: '€642/mo' }
          }
        });
        onEvent({
          event: 'statutory_citation',
          data: {
            statute: '§ 32a EStG',
            title: 'Tariff Progressionszone',
            official_url: 'https://www.gesetze-im-internet.de/estg/__32a.html'
          }
        });
      }
    });

    render(
      <AdvisorDrawer
        isOpen={true}
        onClose={vi.fn()}
        profile={mockProfile}
        analysis={mockAnalysis}
        onApplyPatch={mockOnApplyPatch}
      />
    );

    // Submit a query
    const input = screen.getByPlaceholderText(/Ask about your financial plan/i);
    const form = input.closest('form');
    fireEvent.change(input, { target: { value: 'How can I close my pension gap?' } });
    fireEvent.submit(form);

    // Verify token output
    await waitFor(() => {
      expect(screen.getByText(/Here is your optimized retirement mandate/i)).toBeInTheDocument();
    });

    // Verify highlight banner
    expect(screen.getByTestId('highlight-banner')).toBeInTheDocument();
    expect(screen.getByText(/Focused Metric:/i)).toBeInTheDocument();

    // Verify delta badges bar
    expect(screen.getByTestId('delta-badges-bar')).toBeInTheDocument();
    expect(screen.getByText(/effective_tax_rate: 34.2% → 31.8% \(-2.4%\)/i)).toBeInTheDocument();

    // Verify statutory citation link
    expect(screen.getByText(/§ 32a EStG · Tariff Progressionszone/i)).toBeInTheDocument();

    // Verify OptimizationPatchCard
    const patchCard = screen.getByTestId('optimization-patch-card');
    expect(patchCard).toBeInTheDocument();
    expect(screen.getByText(/Close Pension Gap with ETF/i)).toBeInTheDocument();

    // Test "Preview Impact" button
    const previewBtn = screen.getByRole('button', { name: /preview impact/i });
    fireEvent.click(previewBtn);
    expect(screen.getByText(/previewing\.\.\./i)).toBeInTheDocument();
    expect(useProfileStore.getState().scenarioOverrides.monthly_investment).toBe(750);

    // Test "Apply to Profile" button
    const applyBtn = screen.getByRole('button', { name: /apply to profile/i });
    fireEvent.click(applyBtn);
    expect(mockOnApplyPatch).toHaveBeenCalledWith({ monthly_investment: 750 });
    expect(screen.getByText(/applied to profile/i)).toBeInTheDocument();
  });
});
