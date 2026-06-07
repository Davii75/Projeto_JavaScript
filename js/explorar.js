document.addEventListener('DOMContentLoaded', async () => {
  const resultsGrid = document.getElementById('explorar-results');
  const resultsTitle = document.getElementById('explorar-results-title');
  let activeGenre = null;
  let catalog = [];

  await loadCatalog();
  renderAllGenres();
  setupGenreCards();
  setupFavList();

  async function loadCatalog() {
    if (typeof StreamFlixAPI !== 'undefined') {
      catalog = await StreamFlixAPI.getFullCatalog();

      // Remove conteúdos sem imagem
      catalog = catalog.filter(item => item.thumb && item.thumb.trim() !== "");
    } else {
      catalog = AppState.getCatalog().filter(item => item.thumb && item.thumb.trim() !== "");
    }

    window.streamflixCatalog = catalog;
  }

  function findContentById(id) {
    return catalog.find(item => Number(item.id) === Number(id));
  }

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
    const items = genre ? catalog.filter(c =>
      c.genre.toLowerCase() === genre.toLowerCase() ||
      c.type.toLowerCase() === genre.toLowerCase()
    ) : catalog;

    resultsTitle.textContent = genre ? `Gênero: ${genre}` : 'Todo o Catálogo';
    renderResults(items);
  }

  function renderAllGenres() {
    filterByGenre(null);
  }

  function renderResults(items) {
    if (!items.length) {
      resultsGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <p>Nenhum conteúdo encontrado.</p>
        </div>
      `;
      return;
    }

    resultsGrid.innerHTML = items.map(item => UI.renderCard(item)).join('');

    resultsGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const id = Number(card.dataset.id);
        const item = findContentById(id);
        if (item) openContentModal(item);
      });
    });
  }

  function openContentModal(item) {
    const overlay = document.getElementById('content-modal');
    const isFav = AppState.isFavorite(item.id);
    const typeMap = { serie: 'Série', filme: 'Filme', doc: 'Documentário', anime: 'Anime' };

    overlay.querySelector('#modal-title').textContent = item.title;
    overlay.querySelector('#modal-type').textContent =
      item.source === 'tmdb'
        ? `${typeMap[item.type] ?? item.type} · TMDB`
        : typeMap[item.type] ?? item.type;

    overlay.querySelector('#modal-year').textContent = item.year;
    overlay.querySelector('#modal-rating').textContent = `★ ${item.rating}`;
    overlay.querySelector('#modal-genre').textContent = item.genre;
    overlay.querySelector('#modal-desc').textContent = item.desc;

    const favBtn = overlay.querySelector('#modal-fav-btn');
    favBtn.textContent = isFav ? '♥ Nos Favoritos' : '+ Adicionar';
    favBtn.dataset.id = item.id;

  favBtn.onclick = () => {
  const user = AppState.getUser();

  if (!user) {
    UI.showToast('Faça login para adicionar aos favoritos.', 'error');

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 900);

    return;
  }

  const now = AppState.toggleFavorite(item.id);
  favBtn.textContent = now ? '♥ Nos Favoritos' : '+ Adicionar';

  UI.showToast(
    now ? 'Adicionado aos favoritos!' : 'Removido dos favoritos.',
    now ? 'success' : 'info'
  );

  setupFavList();
};

    overlay.classList.add('open');
  }

  document.getElementById('modal-close')?.addEventListener('click', () => {
    document.getElementById('content-modal').classList.remove('open');
  });

  document.getElementById('content-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('content-modal')) {
      document.getElementById('content-modal').classList.remove('open');
    }
  });

  function setupFavList() {
    const favSection = document.getElementById('fav-section');
    const favGrid = document.getElementById('fav-grid');
    if (!favSection || !favGrid) return;

    const favIds = AppState.getFavorites();
    const favItems = favIds.map(id => findContentById(id)).filter(Boolean);

    if (!favItems.length) {
      favSection.classList.add('hidden');
      return;
    }

    favSection.classList.remove('hidden');
    favGrid.innerHTML = favItems.map(item => UI.renderCard(item)).join('');

    favGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const id = Number(card.dataset.id);
        const item = findContentById(id);
        if (item) openContentModal(item);
      });
    });
  }
});
