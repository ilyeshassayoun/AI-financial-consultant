import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCurrentSession, listProfiles } from './authService';

const response = (status, body = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(body),
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('authenticated API session recovery', () => {
  it('preserves the HTTP status on API failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(403, { detail: 'Account disabled' })));

    await expect(listProfiles()).rejects.toMatchObject({
      name: 'AuthApiError',
      status: 403,
      detail: 'Account disabled',
    });
  });

  it('refreshes an expired access session and retries the original request', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(401, { detail: 'Authentication required' }))
      .mockResolvedValueOnce(response(200, { user: { id: 7 } }))
      .mockResolvedValueOnce(response(200, { user: { id: 7, email: 'client@example.com' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getCurrentSession()).resolves.toEqual({
      user: { id: 7, email: 'client@example.com' },
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/auth\/refresh$/);
    expect(fetchMock.mock.calls[2][0]).toMatch(/\/api\/auth\/me$/);
  });

  it('returns the original authentication error when refresh also expires', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(401, { detail: 'Authentication required' }))
      .mockResolvedValueOnce(response(401, { detail: 'Invalid or expired refresh token' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getCurrentSession()).rejects.toEqual(
      expect.objectContaining({ status: 401, message: 'Authentication required' }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
