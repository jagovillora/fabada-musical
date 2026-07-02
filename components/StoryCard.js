'use client';

import { useState, useEffect } from 'react';

function IOSSection({ code, onCopy }) {
  return (
    <div className="ios-section">
      <button className="btn btn-primary btn-copy-big" onClick={onCopy}>
        📋 Copiar código
      </button>
      <div className="ios-nfc-tools-guide">
        <div className="ios-nfc-tools-title">Cómo grabarlo en el iPhone</div>
        <div className="ios-nfc-tools-steps">
          <div className="ios-nfc-step">
            <span className="ios-nfc-num">1</span>
            <span>Pulsa <strong>Copiar código</strong> arriba</span>
          </div>
          <div className="ios-nfc-step">
            <span className="ios-nfc-num">2</span>
            <span>Abre <strong>NFC Tools</strong> → Escribir → Añadir registro → Texto → pega el código → Escribe → acerca la etiqueta</span>
          </div>
        </div>
        <a
          href="https://apps.apple.com/es/app/nfc-tools/id1252962749"
          target="_blank"
          rel="noopener noreferrer"
          className="ios-nfc-tools-link"
        >
          ↗ Descargar NFC Tools (gratis)
        </a>
      </div>
    </div>
  );
}

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

export default function StoryCard({ story, expanded, onToggle, onDetail }) {
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
        {story.image ? (
          <img src={story.image} alt={story.titulo} className="card-thumb" loading="lazy" />
        ) : (
          <div className={`path-badge${!code ? ' no-nfc' : ''}`}>
            {story.path ?? 'SIN'}
          </div>
        )}
        <div className="card-info">
          <div className="card-title">{story.titulo}</div>
          {story.image && story.path && (
            <div className="path-inline">{story.path}</div>
          )}
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

                {/* iOS: NFC Tools guide */}
                {isIOS && !hasWebNFC && (
                  <IOSSection code={code} onCopy={copyCode} />
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

          <div className="card-footer">
            {story.sku && (
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                SKU: {story.sku}{story.id ? ` · ID: ${story.id}` : ''}{story.coleccion ? ` · ${story.coleccion}` : ''}
              </span>
            )}
            {story.path && (
              <button className="btn-detail" onClick={e => { e.stopPropagation(); onDetail?.(); }}>
                Ver detalle ↗
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
