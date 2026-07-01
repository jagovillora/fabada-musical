'use client';

import { useState, useEffect } from 'react';

const LANG_FLAGS = { es: '🇪🇸', en: '🇬🇧', fr: '🇫🇷', it: '🇮🇹' };
const SHORTCUT_NAME = 'FABA NFC';

function formatNfcCode(code) {
  if (!code) return null;
  return {
    prefix: code.slice(0, 8),
    pathDigits: code.slice(8, 12),
    suffix: code.slice(12),
  };
}

export default function StoryCard({ story, expanded, onToggle }) {
  const [status, setStatus] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [platform, setPlatform] = useState('unknown');
  const [hasWebNFC, setHasWebNFC] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    setPlatform(isIOS ? 'ios' : isAndroid ? 'android' : 'desktop');
    setHasWebNFC(typeof NDEFReader !== 'undefined');
  }, []);

  const code = story.nfc_code;
  const parts = formatNfcCode(code);

  async function writeNFC() {
    setStatus('writing');
    setStatusMsg('📡 Acerca la etiqueta NFC al teléfono…');
    try {
      const ndef = new NDEFReader();
      await ndef.write({ records: [{ recordType: 'text', data: code, lang: 'es' }] });
      setStatus('success');
      setStatusMsg('✅ ¡Etiqueta grabada!');
    } catch (err) {
      setStatus('error');
      const msgs = {
        NotAllowedError: '❌ Permiso denegado. Activa NFC en ajustes.',
        NotSupportedError: '❌ NFC no disponible en este dispositivo.',
        AbortError: '⚠️ Cancelado. Vuelve a intentarlo.',
      };
      setStatusMsg(msgs[err.name] ?? `❌ ${err.message}`);
    }
  }

  function openShortcut() {
    // Pass the NFC code to the pre-installed shortcut
    const url = `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}&input=${encodeURIComponent(code)}`;
    window.location.href = url;
    setStatus('writing');
    setStatusMsg('📲 Abriendo Shortcuts… acerca la etiqueta cuando te lo pida.');
    // Reset after a moment (we can't detect Shortcuts result from web)
    setTimeout(() => setStatus(null), 6000);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus('success');
      setStatusMsg('✅ Código copiado');
      setTimeout(() => setStatus(null), 2500);
    } catch {
      setStatus('error');
      setStatusMsg('Copia manualmente: ' + code);
    }
  }

  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';

  return (
    <div className={`card${expanded ? ' expanded' : ''}`}>
      <div
        className="card-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggle()}
      >
        <div className={`path-badge${!code ? ' no-nfc' : ''}`}>
          {story.path ?? 'SIN CÓDIGO'}
        </div>
        <div className="card-info">
          <div className="card-title">{story.titulo}</div>
          <div className="card-meta">
            {story.idioma && <span className="meta-tag">{LANG_FLAGS[story.idioma] ?? '🌍'} {story.idioma}</span>}
            {story.duracion && <span className="meta-tag">⏱ {story.duracion}</span>}
            {story.edad && <span className="meta-tag">👶 {story.edad}</span>}
            {story.capitulos && <span className="meta-tag">📑 {story.capitulos} caps</span>}
            {story.tipo && <span className="tipo-badge">{story.tipo}</span>}
          </div>
        </div>
        <span className="chevron">›</span>
      </div>

      {expanded && (
        <div className="card-body">
          {story.url && (
            <div style={{ marginTop: 10 }}>
              <a href={story.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#f97316', textDecoration: 'none', fontWeight: 500 }}>
                🔗 Ver en myfaba.es ↗
              </a>
            </div>
          )}

          <div className="nfc-section">
            <div className="nfc-label">Código a grabar</div>

            {code ? (
              <>
                <div className="nfc-code-box">
                  {parts.prefix}<span title={`Path: ${story.path}`}>{parts.pathDigits}</span>{parts.suffix}
                </div>

                {/* Android: Web NFC direct write */}
                {(isAndroid || hasWebNFC) && (
                  <div className="action-row">
                    <button className="btn btn-primary" onClick={writeNFC} disabled={status === 'writing'}>
                      📳 Escribir en NFC
                    </button>
                    <button className="btn btn-secondary" onClick={copyCode}>
                      📋 Copiar
                    </button>
                  </div>
                )}

                {/* iOS: Shortcuts flow */}
                {isIOS && !hasWebNFC && (
                  <>
                    <div className="action-row">
                      <button className="btn btn-primary" onClick={openShortcut}>
                        📲 Escribir con Shortcuts
                      </button>
                      <button className="btn btn-secondary" onClick={copyCode}>
                        📋 Copiar
                      </button>
                    </div>
                    <div className="ios-shortcut-box">
                      <div className="ios-shortcut-title">¿Primera vez? Instala el Shortcut (30 seg)</div>
                      <ol className="ios-steps">
                        <li>
                          <a href="/FABA_NFC.shortcut" className="ios-install-link">
                            ⬇️ Toca aquí para instalar el Shortcut
                          </a>
                          {' '}→ pulsa <strong>Añadir Shortcut</strong>
                        </li>
                        <li>Vuelve aquí y pulsa <strong>Escribir con Shortcuts</strong></li>
                        <li>Shortcuts se abre solo, acerca la etiqueta NTAG213 y graba</li>
                      </ol>
                    </div>
                  </>
                )}

                {/* Desktop fallback */}
                {!isIOS && !isAndroid && !hasWebNFC && (
                  <div className="action-row">
                    <button className="btn btn-secondary" onClick={copyCode}>
                      📋 Copiar código
                    </button>
                  </div>
                )}

                {status && (
                  <div className={`status-msg ${status}`}>{statusMsg}</div>
                )}
              </>
            ) : (
              <div className="no-nfc-msg">
                Contenido solo digital — sin código de etiqueta NFC asignable.
              </div>
            )}
          </div>

          {story.sku && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
              SKU: {story.sku}{story.id ? ` · ID: ${story.id}` : ''}{story.coleccion ? ` · ${story.coleccion}` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
