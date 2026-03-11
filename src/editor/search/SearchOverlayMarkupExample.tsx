import './searchOverlay.css';

const SearchOverlayMarkupExample = () => {
  return (
    <div className="wb-search-overlay-scope">
      <div className="wb-search-overlay-backdrop" role="presentation">
        <section className="wb-search-overlay-panel" aria-label="Búsqueda rápida">
          <h2 className="wb-search-overlay-group-header">Resultados recientes</h2>
          <button className="wb-search-overlay-item" type="button">
            Configuración del sitio
            <span className="wb-search-overlay-item-hint">⌘K</span>
          </button>
          <button className="wb-search-overlay-item" type="button">
            Biblioteca de bloques
            <span className="wb-search-overlay-item-hint">Enter</span>
          </button>
          <button className="wb-search-overlay-cta" type="button">
            Ver todos los resultados
          </button>
        </section>
      </div>
    </div>
  );
};

export default SearchOverlayMarkupExample;
