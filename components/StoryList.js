'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StoryCard from './StoryCard';

const LANG_LABELS = { es: 'Español', en: 'Inglés', fr: 'Francés', it: 'Italiano', ca: 'Català' };
const TIPOS = ['Personaje sonoro', 'Contenido digital', 'Juegos', 'Disco para grabación'];
const SORT_OPTIONS = [
  { value: 'path', label: 'Código K' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
];

function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function FilterBar({ label, children }) {
  return (
    <div className="filter-group">
      <span className="filter-group-label">{label}</span>
      <div className="filter-chips">{children}</div>
    </div>
  );
}

export default function StoryList({ stories }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState(null);
  const [tipo, setTipo] = useState(null);
  const [onlyNfc, setOnlyNfc] = useState(false);
  const [sort, setSort] = useState('path');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    let result = stories.filter(s => {
      if (lang && s.idioma !== lang) return false;
      if (tipo && s.tipo !== tipo) return false;
      if (onlyNfc && !s.nfc_code) return false;
      if (q) {
        const haystack = normalize([s.titulo, s.path, s.sku, s.coleccion].filter(Boolean).join(' '));
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sort === 'az') result = [...result].sort((a, b) => normalize(a.titulo).localeCompare(normalize(b.titulo)));
    else if (sort === 'za') result = [...result].sort((a, b) => normalize(b.titulo).localeCompare(normalize(a.titulo)));
    else result = [...result].sort((a, b) => (a.path ?? 'zzz').localeCompare(b.path ?? 'zzz'));

    return result;
  }, [stories, search, lang, tipo, onlyNfc, sort]);

  const toggle = useCallback((id) => setExpandedId(prev => prev === id ? null : id), []);
  const uniqueLangs = Array.from(new Set(stories.map(s => s.idioma).filter(Boolean))).sort();
  const activeFilters = [lang, tipo, onlyNfc || null].filter(Boolean).length;
  const nfcCount = stories.filter(s => s.nfc_code).length;

  return (
    <>
      <header className="header">
        <h1>🎵 Fabada Musical</h1>
        <p>Graba etiquetas NFC para tu FABA · {stories.length} cuentos</p>
        <input
          className="search-bar"
          type="search"
          placeholder="Buscar cuento, código, colección..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoComplete="off"
        />
      </header>

      <div className="filters-panel">
        <FilterBar label="🌍 Idioma">
          <button className={`filter-btn${!lang ? ' active' : ''}`} onClick={() => setLang(null)}>Todos</button>
          {uniqueLangs.map(l => (
            <button key={l} className={`filter-btn${lang === l ? ' active' : ''}`} onClick={() => setLang(l)}>
              {LANG_LABELS[l] ?? l}
            </button>
          ))}
        </FilterBar>

        <FilterBar label="📦 Tipo">
          <button className={`filter-btn${!tipo ? ' active' : ''}`} onClick={() => setTipo(null)}>Todos</button>
          {TIPOS.map(t => (
            <button key={t} className={`filter-btn${tipo === t ? ' active' : ''}`} onClick={() => setTipo(t)}>
              {t}
            </button>
          ))}
        </FilterBar>

        <FilterBar label="🔢 Orden">
          {SORT_OPTIONS.map(o => (
            <button key={o.value} className={`filter-btn${sort === o.value ? ' active' : ''}`} onClick={() => setSort(o.value)}>
              {o.label}
            </button>
          ))}
        </FilterBar>

        <FilterBar label="📳 NFC">
          <button
            className={`filter-btn${onlyNfc ? ' active' : ''}`}
            onClick={() => setOnlyNfc(v => !v)}
          >
            Solo con NFC ({nfcCount})
          </button>
        </FilterBar>
      </div>

      <div className="stats">
        {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        {activeFilters > 0 && ` · ${activeFilters} filtro${activeFilters !== 1 ? 's' : ''}`}
        {(search || activeFilters > 0) && (
          <button className="clear-filters" onClick={() => { setSearch(''); setLang(null); setTipo(null); setOnlyNfc(false); }}>
            ✕ Limpiar
          </button>
        )}
      </div>

      <div className="list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <p>No se encontraron cuentos con esos filtros</p>
          </div>
        ) : (
          filtered.map((story, i) => {
            const id = story.path ?? story.titulo + i;
            return (
              <StoryCard
                key={id + i}
                story={story}
                expanded={expandedId === id}
                onToggle={() => toggle(id)}
                onDetail={() => router.push(`/cuento/${encodeURIComponent(story.path ?? story.titulo)}`)}
              />
            );
          })
        )}
      </div>
    </>
  );
}
