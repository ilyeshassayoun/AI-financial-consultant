// Production defaults to the same origin; Vite proxies /api during development.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function requestJson(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
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
  return requestJson('/api/analyze', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
    signal
  });
}

export async function fetchConsultantInsight(profile, step, signal) {
  try {
    return await requestJson('/api/consultant/insight', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, messages }),
      signal
    });
  } catch (err) {
    if (err.name !== 'AbortError') console.warn('[API] Could not fetch chat reply:', err);
    return null;
  }
}

export async function streamChatReply(profile, messages, onChunk, signal) {
  try {
    const response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, messages }),
      signal
    });
    if (!response.ok) {
      // Fallback to non-streaming if stream is unsupported
      const nonStreamData = await fetchChatReply(profile, messages, signal);
      if (nonStreamData?.reply) {
        onChunk(nonStreamData.reply);
      }
      return;
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
        if (trimmed.startsWith('data: ')) {
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') return;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.token) {
              onChunk(parsed.token);
            }
          } catch {
            // Raw text fallback
            onChunk(payload);
          }
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('[API] Stream interrupted, attempting standard reply:', err);
      const fallback = await fetchChatReply(profile, messages, signal);
      if (fallback?.reply) onChunk(fallback.reply);
    }
  }
}
