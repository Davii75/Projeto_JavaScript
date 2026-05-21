document.addEventListener('DOMContentLoaded', () => {
  renderHero();
  renderContinueWatching();
  renderSeries();
  renderFilmes();
  renderAnimes();
  setupCardClicks();
});

function renderHero() {
  const featured = AppState.getFeatured();
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  const heroBadge = document.getElementById('hero-badge');
  const heroBg = document.getElementById('hero-bg-img');

  if (!featured) {
    document.getElementById('hero-content').innerHTML = `<p class="hero-empty">Nenhum conteúdo disponível ainda.</p>`;
    return;
  }

  const typeMap = { serie: 'Série', filme: 'Filme', doc: 'Documentário', anime: 'Anime' };
  heroTitle.textContent = featured.title;
  heroDesc.textContent = featured.desc;
  heroBadge.textContent = typeMap[featured.type] ?? featured.type;
  if (featured.thumb) heroBg.style.backgroundImage = `url(${featured.thumb})`;

  document.getElementById('hero-play').addEventListener('click', () => {
    UI.showToast(`▶ Reproduzindo: ${featured.title}`, 'info');
  });

  document.getElementById('hero-fav').addEventListener('click', function() {
    const isFav = AppState.toggleFavorite(featured.id);
    this.textContent = isFav ? '♥ Favoritado' : '+ Lista';
    UI.showToast(isFav ? 'Adicionado aos favoritos!' : 'Removido dos favoritos.', isFav ? 'success' : 'info');
  });

  if (AppState.isFavorite(featured.id)) {
    document.getElementById('hero-fav').textContent = '♥ Favoritado';
  }
}

function renderContinueWatching() {
  const catalog = AppState.getCatalog();
  const slice = catalog.slice(0, 5);
  const row = document.getElementById('continue-row');
  if (!row) return;

  if (!slice.length) {
    row.closest('.section').classList.add('hidden');
    return;
  }

  row.innerHTML = slice.map(item => UI.renderCard(item)).join('');

  row.querySelectorAll('.progress-bar').forEach(bar => {
    bar.style.width = `${Math.floor(Math.random() * 80 + 10)}%`;
  });
}

function renderSeries() {
  const series = AppState.getByType('serie');
  const row = document.getElementById('series-row');
  if (!row) return;
  if (!series.length) { row.closest('.section').classList.add('hidden'); return; }
  row.innerHTML = series.map(item => UI.renderCard(item)).join('');
}

function renderFilmes() {
  const filmes = AppState.getByType('filme');
  const row = document.getElementById('filmes-row');
  if (!row) return;
  if (!filmes.length) { row.closest('.section').classList.add('hidden'); return; }
  row.innerHTML = filmes.map(item => UI.renderCard(item)).join('');
}

function renderAnimes() {
  const animes = AppState.getCatalog().filter(c => c.type === 'anime' || c.type === 'doc');
  const row = document.getElementById('extras-row');
  if (!row) return;
  if (!animes.length) { row.closest('.section').classList.add('hidden'); return; }
  row.innerHTML = animes.map(item => UI.renderCard(item)).join('');
}

function setupCardClicks() {
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) {
      const id = parseInt(card.dataset.id);
      const item = AppState.getById(id);
      if (item) UI.showToast(`▶ ${item.title}`, 'info');
    }
  });
}
