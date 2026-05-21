document.addEventListener('DOMContentLoaded', () => {
  let activeFilter = 'todos';
  const grid = document.getElementById('trending-grid');
  const searchInput = document.getElementById('trending-search');

  renderTrending();
  setupFilters();
  setupSearch();
  setupTraversal();

  function getCatalogSorted() {
    return [...AppState.getCatalog()].sort((a, b) => b.rating - a.rating);
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
        const id = parseInt(card.dataset.id);
        const item = AppState.getById(id);
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
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderTrending(activeFilter, searchInput.value);
      }, 280);
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

        card.style.outline = rating >= 9 ? '2px solid var(--accent)' : '';

        highlighted.push({ pos: idx + 1, title, rating, siblings: sibCount });
      });

      demoBox.classList.remove('hidden');
      const list = demoBox.querySelector('#traversal-list');
      list.innerHTML = highlighted.map(h =>
        `<div class="dom-item">
          <span>#${h.pos} — <strong>${h.title}</strong></span>
          <span style="color:${h.rating >= 9 ? 'var(--accent)' : 'var(--text-muted)'}">★ ${h.rating}</span>
         </div>`
      ).join('');

      UI.showToast(`Traversal: ${cards.length} cards inspecionados`, 'success');

      setTimeout(() => {
        cards.forEach(c => c.style.outline = '');
      }, 2200);
    });
  }
});
