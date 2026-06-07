document.addEventListener('DOMContentLoaded', async () => {
  let activeFilter = 'todos';
  let catalog = [];
  const grid = document.getElementById('trending-grid');
  const searchInput = document.getElementById('trending-search');

  await loadCatalog();
  renderTrending();
  setupFilters();
  setupSearch();
  setupTraversal();

  async function loadCatalog() {
    if (typeof StreamFlixAPI !== 'undefined') {
      catalog = await StreamFlixAPI.getFullCatalog();
    } else {
      catalog = AppState.getCatalog();
    }

    window.streamflixCatalog = catalog;
  }

  function findContentById(id) {
    return catalog.find(item => Number(item.id) === Number(id));
  }

  function getCatalogSorted() {
    return [...catalog].sort((a, b) => Number(b.rating) - Number(a.rating));
  }

  function renderTrending(filter = 'todos', query = '') {
    let items = getCatalogSorted();

    if (filter !== 'todos') items = items.filter(c => c.type === filter);
    if (query) {
      const q = query.toLowerCase();
      items = items.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.genre.toLowerCase().includes(q)
      );
    }

    if (!items.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <p>Nenhum conteúdo encontrado.</p>
      </div>`;
      return;
    }

    grid.innerHTML = items.map((item, i) => UI.renderCard(item, i + 1)).join('');

    grid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const id = Number(card.dataset.id);
        const item = findContentById(id);
        if (item) UI.showToast(`▶ ${item.title}`, 'info');
      });
    });
  }

  function setupFilters() {
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.dataset.filter;
        renderTrending(activeFilter, searchInput?.value ?? '');
      });
    });
  }

  function setupSearch() {
    if (!searchInput) return;
    let debounceTimer;

    searchInput.addEventListener('input', async () => {
      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(async () => {
        const query = searchInput.value.trim();

        if (query.length >= 3 && typeof StreamFlixAPI !== 'undefined' && StreamFlixAPI.hasApiKey()) {
          const apiResults = await StreamFlixAPI.searchMovies(query);
          const localResults = AppState.getCatalog().filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.genre.toLowerCase().includes(query.toLowerCase())
          );

          const unique = new Map();
          [...localResults, ...apiResults].forEach(item => unique.set(item.id, item));
          catalog = Array.from(unique.values());
          renderTrending(activeFilter, query);
          return;
        }

        if (!query) {
          await loadCatalog();
        }

        renderTrending(activeFilter, query);
      }, 350);
    });
  }

  function setupTraversal() {
    const btn = document.getElementById('traversal-btn');
    const demoBox = document.getElementById('traversal-demo');
    if (!btn || !demoBox) return;

    btn.addEventListener('click', () => {
      const cards = grid.querySelectorAll('.card');
      if (!cards.length) return;

      cards.forEach(c => c.classList.remove('traversal-highlight'));

      const highlighted = [];
      cards.forEach((card, idx) => {
        const ratingEl = card.querySelector('.card-rating');
        if (!ratingEl) return;

        const ratingText = ratingEl.textContent.replace('★', '').trim();
        const rating = parseFloat(ratingText);

        const parent = card.parentElement;
        const siblings = parent ? parent.querySelectorAll('.card') : [];
        const sibCount = siblings.length;

        const titleEl = card.querySelector('.card-title');
        const title = titleEl ? titleEl.textContent : '—';

        card.style.outline = rating >= 8 ? '2px solid var(--accent)' : '';

        highlighted.push({ pos: idx + 1, title, rating, siblings: sibCount });
      });

      demoBox.classList.remove('hidden');
      const list = demoBox.querySelector('#traversal-list');
      list.innerHTML = highlighted.map(h =>
        `<div class="dom-item">
          <span>#${h.pos} — <strong>${h.title}</strong></span>
          <span style="color:${h.rating >= 8 ? 'var(--accent)' : 'var(--text-muted)'}">★ ${h.rating}</span>
         </div>`
      ).join('');

      UI.showToast(`Traversal: ${cards.length} cards inspecionados`, 'success');

      setTimeout(() => {
        cards.forEach(c => c.style.outline = '');
      }, 2200);
    });
  }
});
