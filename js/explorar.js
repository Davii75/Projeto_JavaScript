document.addEventListener('DOMContentLoaded', () => {
  const resultsGrid = document.getElementById('explorar-results');
  const resultsTitle = document.getElementById('explorar-results-title');
  let activeGenre = null;

  renderAllGenres();
  setupGenreCards();
  setupFavList();

  function setupGenreCards() {
    document.querySelectorAll('.genre-card').forEach(card => {
      card.addEventListener('click', () => {
        const genre = card.dataset.genre;
        activeGenre = genre === activeGenre ? null : genre;

        document.querySelectorAll('.genre-card').forEach(c =>
          c.style.outline = c.dataset.genre === activeGenre ? '2px solid var(--accent)' : ''
        );

        filterByGenre(activeGenre);
      });
    });
  }

  function filterByGenre(genre) {
    const catalog = AppState.getCatalog();
    const items = genre ? catalog.filter(c =>
      c.genre.toLowerCase() === genre.toLowerCase() || c.type === genre
    ) : catalog;

    resultsTitle.textContent = genre ? `Gênero: ${genre}` : 'Todo o Catálogo';
    renderResults(items);
  }

  function renderAllGenres() {
    filterByGenre(null);
  }

  function renderResults(items) {
    if (!items.length) {
      resultsGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m8 21 4-4 4 4"/><path d="M12 17v4"/></svg>
        <p>Nenhum conteúdo neste gênero ainda.</p>
      </div>`;
      return;
    }

    resultsGrid.innerHTML = items.map(item => UI.renderCard(item)).join('');

    resultsGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        const item = AppState.getById(id);
        if (item) openContentModal(item);
      });
    });
  }

  function openContentModal(item) {
    const overlay = document.getElementById('content-modal');
    const isFav = AppState.isFavorite(item.id);
    const typeMap = { serie: 'Série', filme: 'Filme', doc: 'Documentário', anime: 'Anime' };

    overlay.querySelector('#modal-title').textContent = item.title;
    overlay.querySelector('#modal-type').textContent = typeMap[item.type] ?? item.type;
    overlay.querySelector('#modal-year').textContent = item.year;
    overlay.querySelector('#modal-rating').textContent = `★ ${item.rating}`;
    overlay.querySelector('#modal-genre').textContent = item.genre;
    overlay.querySelector('#modal-desc').textContent = item.desc;

    const favBtn = overlay.querySelector('#modal-fav-btn');
    favBtn.textContent = isFav ? '♥ Nos Favoritos' : '+ Adicionar';
    favBtn.dataset.id = item.id;

    favBtn.onclick = () => {
      const now = AppState.toggleFavorite(item.id);
      favBtn.textContent = now ? '♥ Nos Favoritos' : '+ Adicionar';
      UI.showToast(now ? 'Adicionado!' : 'Removido.', now ? 'success' : 'info');
      setupFavList();
    };

    overlay.classList.add('open');
  }

  document.getElementById('modal-close')?.addEventListener('click', () => {
    document.getElementById('content-modal').classList.remove('open');
  });

  document.getElementById('content-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('content-modal'))
      document.getElementById('content-modal').classList.remove('open');
  });

  function setupFavList() {
    const favSection = document.getElementById('fav-section');
    const favGrid = document.getElementById('fav-grid');
    if (!favSection || !favGrid) return;

    const favIds = AppState.getFavorites();
    if (!favIds.length) {
      favSection.classList.add('hidden');
      return;
    }

    favSection.classList.remove('hidden');
    const favItems = favIds.map(id => AppState.getById(id)).filter(Boolean);
    favGrid.innerHTML = favItems.map(item => UI.renderCard(item)).join('');
    favGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        const item = AppState.getById(id);
        if (item) openContentModal(item);
      });
    });
  }
});
