'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const LANG_FLAGS = { es: '🇪🇸', en: '🇬🇧', fr: '🇫🇷', it: '🇮🇹', ca: '🏳️' };

function NFCWriter({ story }) {
  const code = story.nfc_code;
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState('');
  const [platform, setPlatform] = useState('unknown');
  const [hasWebNFC, setHasWebNFC] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setPlatform(/iphone|ipad|ipod/i.test(ua) ? 'ios' : /android/i.test(ua) ? 'android' : 'desktop');
    setHasWebNFC(typeof NDEFReader !== 'undefined');
  }, []);

  async function write() {
    setStatus('writing'); setMsg('📡 Acerca la etiqueta NTAG213…');
    try {
      const ndef = new NDEFReader();
      await ndef.write({ records: [{ recordType: 'text', data: code, lang: 'es' }] });
      setStatus('success'); setMsg('✅ ¡Etiqueta grabada!');
    } catch (err) {
      setStatus('error');
      setMsg({ NotAllowedError: '❌ Permiso denegado.', AbortError: '⚠️ Cancelado.' }[err.name] ?? `❌ ${err.message}`);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus('success'); setMsg('✅ Código copiado');
      setTimeout(() => setStatus(null), 2000);
    } catch { setStatus('error'); setMsg('Copia: ' + code); }
  }

  if (!code) return (
    <div className="detail-no-nfc">Sin código NFC asignable (contenido solo digital)</div>
  );

  const prefix = code.slice(0, 8), pathDigits = code.slice(8, 12), suffix = code.slice(12);
  const isIOS = platform === 'ios';

  return (
    <div className="detail-nfc">
      <div className="nfc-label">Código a grabar en la etiqueta</div>
      <div className="nfc-code-box detail-code">
        {prefix}<span>{pathDigits}</span>{suffix}
      </div>
      <div className="action-row" style={{ marginTop: 10 }}>
        {(hasWebNFC || (!isIOS && platform === 'android')) && (
          <button className="btn btn-primary" onClick={write} disabled={status === 'writing'}>
            📳 Escribir en NFC
          </button>
        )}
        <button className="btn btn-secondary" onClick={copy}>📋 Copiar</button>
      </div>
      {isIOS && !hasWebNFC && (
        <div className="ios-nfc-tools-guide" style={{ marginTop: 10 }}>
          <div className="ios-nfc-tools-title">Cómo grabarlo en iPhone</div>
          <div className="ios-nfc-tools-steps">
            <div className="ios-nfc-step"><span className="ios-nfc-num">1</span><span>Pulsa <strong>Copiar</strong> arriba</span></div>
            <div className="ios-nfc-step"><span className="ios-nfc-num">2</span><span><strong>NFC Tools</strong> → Escribir → Texto → pega → acerca etiqueta</span></div>
          </div>
        </div>
      )}
      {status && <div className={`status-msg ${status}`} style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}

export default function DetailClient({ story }) {
  const router = useRouter();

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={() => router.back()}>← Volver</button>

      <div className="detail-hero">
        {(story.image_hd || story.image) && (
          <img src={story.image_hd || story.image} alt={story.titulo} className="detail-img" />
        )}
        <div className="detail-hero-info">
          {story.path && <div className="path-badge" style={{ marginBottom: 8 }}>{story.path}</div>}
          <h1 className="detail-title">{story.titulo}</h1>
          <div className="card-meta" style={{ marginTop: 8 }}>
            {story.idioma && <span className="meta-tag">{LANG_FLAGS[story.idioma] ?? '🌍'} {story.idioma}</span>}
            {story.duracion && <span className="meta-tag">⏱ {story.duracion}</span>}
            {story.edad && <span className="meta-tag">👶 {story.edad}</span>}
            {story.capitulos && <span className="meta-tag">📑 {story.capitulos} pistas</span>}
            {story.coleccion && <span className="meta-tag">📚 {story.coleccion}</span>}
            {story.price && <span className="meta-tag">💶 {story.price} €</span>}
          </div>
          {story.tipo && <div className="tipo-badge" style={{ marginTop: 8 }}>{story.tipo}</div>}
        </div>
      </div>

      {story.description && (
        <div className="detail-section">
          <div className="detail-section-title">Descripción</div>
          <p className="detail-description">{story.description}</p>
        </div>
      )}

      <div className="detail-section">
        <NFCWriter story={story} />
      </div>

      {(story.url || story.sku) && (
        <div className="detail-section detail-meta-footer">
          {story.sku && <span>SKU: {story.sku}</span>}
          {story.id && <span>ID: {story.id}</span>}
          {story.url && (
            <a href={story.url} target="_blank" rel="noopener noreferrer" className="detail-ext-link">
              Ver en tienda ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
