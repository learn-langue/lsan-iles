export interface ChatTurnMsg { role: 'user' | 'assistant'; content: string }
export interface ProviderConfig { provider: 'gemini' | 'openai'; model: string; apiKey: string }

/** Appel direct depuis le navigateur, sans serveur intermédiaire. */
export async function complete(cfg: ProviderConfig, system: string, turns: ChatTurnMsg[], signal?: AbortSignal): Promise<string> {
  if (cfg.provider === 'gemini') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: turns.map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.content }] })),
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message ?? `Erreur Gemini ${res.status}`);
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('');
    if (!text) throw new Error('Réponse vide de Gemini.');
    return text;
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'system', content: system }, ...turns],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `Erreur OpenAI ${res.status}`);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Réponse vide d’OpenAI.');
  return text;
}
