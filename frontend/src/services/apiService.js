// Production defaults to the same origin; Vite proxies /api during development.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function fetchFullAnalysis(profile, signal) {
  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
      signal
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    if (err.name !== 'AbortError') console.warn('[API] Could not fetch backend analysis:', err);
    return null;
  }
}

export async function fetchConsultantInsight(profile, step, signal) {
  try {
    const response = await fetch(`${API_BASE}/api/consultant/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, step }),
      signal
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    if (err.name !== 'AbortError') console.warn('[API] Could not fetch consultant insight:', err);
    return null;
  }
}

export async function fetchChatReply(profile, messages, signal) {
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, messages }),
      signal
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    if (err.name !== 'AbortError') console.warn('[API] Could not fetch chat reply:', err);
    return null;
  }
}

export async function streamChatReply(profile, messages, onChunk, signal) {
  try {
    const response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: 'POST',
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

