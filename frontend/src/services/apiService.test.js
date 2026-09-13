import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
const mockProfile = {
  age: 35,
  income: 75000,
  is_married: true,
  num_children: 2,
  risk_profile: 'medium',
};

const mockAnalysis = {
  tax: { gross_income: 75000, net_income: 48000, effective_tax_rate: 0.28 },
  investment: { projected_p50: 250000, portfolio_label: 'Balanced' },
  retirement: { pension_gap_monthly: 800 },
  optimization: { summary: { financial_health_score: 82 } },
};

beforeEach(() => {
  vi.resetModules();
  global.fetch = mockFetch;
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('apiService', () => {
  beforeEach(async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:8000');
    await vi.importActual('../services/apiService');
  });

  describe('fetchFullAnalysis', () => {
    it('returns analysis data on successful response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysis,
      });

      const { fetchFullAnalysis } = await import('../services/apiService');
      const result = await fetchFullAnalysis(mockProfile, { signal: { aborted: false } });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/analyze',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockProfile),
        })
      );
      expect(result).toEqual(mockAnalysis);
    });

    it('returns null on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { fetchFullAnalysis } = await import('../services/apiService');
      const result = await fetchFullAnalysis(mockProfile, { signal: { aborted: false } });

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('returns null on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { fetchFullAnalysis } = await import('../services/apiService');
      const result = await fetchFullAnalysis(mockProfile, { signal: { aborted: false } });

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('returns null when request is aborted', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { fetchFullAnalysis } = await import('../services/apiService');
      const result = await fetchFullAnalysis(mockProfile, { signal: { aborted: true } });

      expect(result).toBeNull();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('fetchConsultantInsight', () => {
    it('returns insight data on successful response', async () => {
      const mockInsight = { insight: 'Test insight', analysis: mockAnalysis };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInsight,
      });

      const { fetchConsultantInsight } = await import('../services/apiService');
      const result = await fetchConsultantInsight(mockProfile, 'profile');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/consultant/insight',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: mockProfile, step: 'profile' }),
        })
      );
      expect(result).toEqual(mockInsight);
    });

    it('returns null on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { fetchConsultantInsight } = await import('../services/apiService');
      const result = await fetchConsultantInsight(mockProfile, 'tax');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('returns null on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { fetchConsultantInsight } = await import('../services/apiService');
      const result = await fetchConsultantInsight(mockProfile, 'investment');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('fetchChatReply', () => {
    it('uses the supported non-streaming fallback endpoint with the browser session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: 'A secure fallback response.' }),
      });

      const { fetchChatReply } = await import('../services/apiService');
      await expect(fetchChatReply(mockProfile, [{ role: 'user', content: 'Help' }])).resolves.toEqual({ reply: 'A secure fallback response.' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/chat',
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      );
    });
  });
});
