// Production defaults to the same origin; Vite proxies /api during development.
// A tiny public runtime config lets static deployments point at the existing API
// without rebuilding the JavaScript bundle or exposing secrets.
const runtimeApiBase = typeof window !== 'undefined'
  ? window.__FINANCIAL_ADVISORY_CONFIG__?.apiBaseUrl
  : '';
const API_BASE = (runtimeApiBase || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Returns or generates a persistent distributed correlation ID for tracing.
 */
export function getCorrelationId() {
  if (typeof window === 'undefined') return 'cid-test-correlation-id';
  try {
    let id = window.sessionStorage?.getItem('x-correlation-id');
    if (!id) {
      id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
          });
      window.sessionStorage?.setItem('x-correlation-id', id);
    }
    return id;
  } catch {
    return 'cid-fallback-id';
  }
}

function buildHeaders(customHeaders = {}) {
  const correlationId = getCorrelationId();
  return {
    'Content-Type': 'application/json',
    ...(correlationId ? { 'X-Correlation-ID': correlationId } : {}),
    ...customHeaders
  };
}

async function requestJson(path, options = {}) {
  const headers = buildHeaders(options.headers);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  const contentType = response.headers?.get?.('content-type') || '';
  let payload = null;

  if ((contentType.includes('application/json') || response.ok) && typeof response.json === 'function') {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const detail = payload?.detail ?? null;
    const message = typeof detail === 'string' ? detail : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, detail);
  }

  if (payload === null) {
    throw new ApiError('The analysis service returned an unreadable response.', response.status);
  }

  return payload;
}

export function getAnalysisErrorMessage(error) {
  if (error?.name === 'AbortError') return null;
  if (error?.status === 422) {
    return 'Some profile values are outside the supported planning range. Review the latest entries and try again.';
  }
  if (error?.status === 429) {
    return 'The analysis engine is receiving too many requests. Wait a moment, then retry; your inputs remain saved.';
  }
  if (error?.status === 503) {
    return 'The analysis engine is still starting or temporarily unavailable. Your inputs remain saved; retry shortly.';
  }
  if (error?.status >= 500) {
    return 'The analysis engine encountered a temporary calculation error. Your inputs remain saved; retry shortly.';
  }
  return 'The analysis service could not be reached. Check your connection and retry; your inputs remain saved locally.';
}

export async function fetchFullAnalysis(profile, signal) {
  const { validateAnalysisResponse } = await import('./analysisSchema');
  const payload = await requestJson('/api/analyze', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(profile),
    signal
  });
  return validateAnalysisResponse(payload);
}

export async function fetchConsultantInsight(profile, step, signal) {
  try {
    return await requestJson('/api/consultant/insight', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ profile, step }),
      signal
    });
  } catch (err) {
    if (err.name !== 'AbortError') console.warn('[API] Could not fetch consultant insight:', err);
    return null;
  }
}

export async function fetchChatReply(profile, messages, signal) {
  try {
    return await requestJson('/api/chat', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ profile, messages }),
      signal
    });
  } catch (err) {
    if (err.name !== 'AbortError') console.warn('[API] Could not fetch chat reply:', err);
    return null;
  }
}

/**
 * Fetch multi-asset historical regime stress testing simulation (/api/lab/stress-test).
 */
export async function fetchStressTest(payload, signal) {
  return await requestJson('/api/lab/stress-test', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(payload),
    signal
  });
}

/**
 * Real-Time Streaming AI & Client Synchronization (SSE).
 * Parses tokens and structured function events:
 * - highlight_metric
 * - delta_badge
 * - patch_proposal / optimization_patch
 * - statutory_citation
 *
 * @param {Object} profile
 * @param {Array} messages
 * @param {Function} onChunk - Receives raw token text chunks
 * @param {Function|AbortSignal} [onEventOrSignal] - Structured event callback or AbortSignal
 * @param {AbortSignal} [maybeSignal] - AbortSignal if onEvent callback is supplied
 */
export async function streamChatReply(profile, messages, onChunk, onEventOrSignal, maybeSignal) {
  let onEvent = null;
  let signal = null;

  if (typeof onEventOrSignal === 'function') {
    onEvent = onEventOrSignal;
    signal = maybeSignal || null;
  } else if (onEventOrSignal && typeof onEventOrSignal === 'object') {
    signal = onEventOrSignal;
  }

  try {
    const headers = buildHeaders();
    const response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ profile, messages }),
      signal
    });

    if (!response.ok) {
      // Fallback to non-streaming if stream is unsupported
      const nonStreamData = await fetchChatReply(profile, messages, signal);
      if (nonStreamData?.reply) {
        onChunk(nonStreamData.reply);
        return;
      }
      throw new ApiError('The advisory service did not return a usable response.', response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Parse standard multi-line or single line SSE frame
        const subLines = trimmed.split('\n');
        let currentEventType = null;
        let currentDataString = null;

        for (const sub of subLines) {
          const s = sub.trim();
          if (s.startsWith('event:')) {
            currentEventType = s.slice(6).trim();
          } else if (s.startsWith('data:')) {
            currentDataString = s.slice(5).trim();
          }
        }

        if (currentDataString === '[DONE]') {
          return;
        }

        if (currentDataString) {
          try {
            const parsed = JSON.parse(currentDataString);
            const eventName = currentEventType || parsed.event;
            const eventData = parsed.data || parsed;

            if (eventName === 'token' || parsed.token) {
              const tokenText = parsed.token || eventData?.token || '';
              if (tokenText) onChunk(tokenText);
            } else if (eventName && ['highlight_metric', 'delta_badge', 'patch_proposal', 'optimization_patch', 'statutory_citation', 'done'].includes(eventName)) {
              if (onEvent) {
                onEvent({ event: eventName, data: eventData });
              }
            } else if (typeof parsed === 'string') {
              onChunk(parsed);
            } else if (onEvent && parsed.event) {
              onEvent(parsed);
            }
          } catch {
            // Raw text fallback
            onChunk(currentDataString);
          }
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      if (err instanceof ApiError) throw err;
      console.warn('[API] Stream interrupted, attempting standard reply:', err);
      const fallback = await fetchChatReply(profile, messages, signal);
      if (fallback?.reply) {
        onChunk(fallback.reply);
        return;
      }
      throw err;
    }
  }
}
