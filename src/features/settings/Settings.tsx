import { useRef, useState } from 'react';
import { LANG_META } from '../../content';
import type { Lang } from '../../domain/types';
import { DEFAULT_MODELS, exportState, useApp } from '../../store/useApp';

export function Settings() {
  const s = useApp((x) => x.settings);
  const lang = useApp((x) => x.activeLang)!;
  const { updateSettings, updateAi, importState, resetLang } = useApp.getState();
  const [msg, setMsg] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  function download() {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lsan-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function upload(f: File) {
    try {
      const data = JSON.parse(await f.text());
      if (!confirm('Remplacer toute la progression actuelle par celle du fichier ?')) return;
      const key = s.ai.apiKey;
      importState(data);
      if (!useApp.getState().settings.ai.apiKey && key) updateAi({ apiKey: key });
      setMsg('✅ Sauvegarde importée.');
    } catch (e) {
      setMsg(`❌ ${(e as Error).message}`);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Réglages</h1>

      <section className="card space-y-3 p-4">
        <h2 className="font-extrabold">✍️ Écriture de la darija</h2>
        <div className="flex flex-wrap gap-2">
          <button className={`chip ${s.darijaScript === 'chat' ? 'chip-on' : ''}`} onClick={() => updateSettings({ darijaScript: 'chat' })}>Avec chiffres : sa7a, 3ammi</button>
          <button className={`chip ${s.darijaScript === 'latin' ? 'chip-on' : ''}`} onClick={() => updateSettings({ darijaScript: 'latin' })}>Sans chiffres : ṣaḥḥa, ʿammi</button>
        </div>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={s.showArabic} onChange={(e) => updateSettings({ showArabic: e.target.checked })} />
          Afficher l'écriture arabe sous les mots (<span dir="rtl" lang="ar">صحة</span>)
        </label>
      </section>

      <section className="card space-y-2 p-4">
        <h2 className="font-extrabold">🙋 On s'adresse à toi au…</h2>
        <p className="text-sm text-stone-500">En darija comme en kabyle, on ne parle pas pareil à un homme et à une femme. Le tuteur IA s'en sert pour accorder.</p>
        <div className="flex gap-2">
          {([['f', 'Féminin'], ['m', 'Masculin'], ['x', 'Non précisé']] as const).map(([g, label]) => (
            <button key={g} className={`chip flex-1 ${s.learnerGender === g ? 'chip-on' : ''}`} onClick={() => updateSettings({ learnerGender: g })}>{label}</button>
          ))}
        </div>
      </section>

      <section className="card space-y-2 p-4">
        <h2 className="font-extrabold">🎯 Objectif quotidien</h2>
        <div className="flex gap-2">
          {[20, 50, 100, 150].map((g) => <button key={g} className={`chip flex-1 ${s.dailyGoalXp === g ? 'chip-on' : ''}`} onClick={() => updateSettings({ dailyGoalXp: g })}>{g} XP</button>)}
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-extrabold">🤖 Tuteur IA</h2>
        <p className="text-sm text-stone-500">Ta clé reste dans ce navigateur (<code>localStorage</code>) et n'est envoyée qu'au fournisseur choisi. Elle n'est jamais incluse dans les exports.</p>
        <div className="flex gap-2">
          {(['gemini', 'openai'] as const).map((p) => (
            <button key={p} className={`chip flex-1 ${s.ai.provider === p ? 'chip-on' : ''}`} onClick={() => updateAi({ provider: p, model: DEFAULT_MODELS[p] })}>{p === 'gemini' ? 'Google Gemini' : 'OpenAI'}</button>
          ))}
        </div>
        <label className="block text-sm font-bold">Modèle
          <input className="card mt-1 w-full px-3 py-2 font-normal" value={s.ai.model} onChange={(e) => updateAi({ model: e.target.value.trim() })} />
        </label>
        <label className="block text-sm font-bold">Clé API
          <div className="mt-1 flex gap-2">
            <input type={showKey ? 'text' : 'password'} autoComplete="off" className="card w-full px-3 py-2 font-normal" placeholder={s.ai.provider === 'gemini' ? 'AIza…' : 'sk-…'} value={s.ai.apiKey} onChange={(e) => updateAi({ apiKey: e.target.value.trim() })} />
            <button className="chip px-3" onClick={() => setShowKey((v) => !v)}>{showKey ? '🙈' : '👁️'}</button>
          </div>
        </label>
        <p className="text-xs text-stone-400">{s.ai.provider === 'gemini' ? 'Clé gratuite sur aistudio.google.com' : 'Clé sur platform.openai.com'}. Usage personnel uniquement : quelqu'un ayant accès à ce navigateur peut lire la clé.</p>
      </section>

      <section className="card space-y-2 p-4">
        <h2 className="font-extrabold">💾 Sauvegarde</h2>
        <p className="text-sm text-stone-500">Tout est stocké sur cet appareil. Exporte un fichier pour changer d'appareil ou en garder une copie.</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary" onClick={download}>Exporter</button>
          <button className="btn-ghost" onClick={() => file.current?.click()}>Importer</button>
        </div>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        {msg && <p className="text-sm">{msg}</p>}
      </section>

      <section className="card space-y-2 p-4">
        <h2 className="font-extrabold text-rose-600">Zone sensible</h2>
        <button className="btn-ghost w-full text-rose-600" onClick={() => confirm(`Effacer toute la progression en ${LANG_META[lang as Lang].name} ?`) && resetLang(lang)}>
          Réinitialiser la progression en {LANG_META[lang].name}
        </button>
      </section>
      <p className="pb-4 text-center text-xs text-stone-400">Lsan — usage personnel, contenu à faire relire par un locuteur natif.</p>
    </div>
  );
}
