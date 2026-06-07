

let streamflixCatalog = [];

const typeMap = {
  serie: 'Série',
  filme: 'Filme',
  doc: 'Documentário',
  anime: 'Anime'
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadCatalog();
  renderHero();
  renderContinueWatching();
  renderSeries();
  renderFilmes();
  renderAnimes();
  setupCardClicks();
  setupModalEvents();
});

async function loadCatalog() {
  if (typeof StreamFlixAPI !== 'undefined') {
    streamflixCatalog = (await StreamFlixAPI.getFullCatalog())
  .filter(item => item.thumb && item.thumb.trim() !== "");

    if (!StreamFlixAPI.hasApiKey()) {
      UI.showToast('Adicione sua chave TMDB no arquivo api.js.', 'info');
    }
  } else {
    streamflixCatalog = AppState.getCatalog();
  }

  window.streamflixCatalog = streamflixCatalog;
}

function findContentById(id) {
  return streamflixCatalog.find(item => Number(item.id) === Number(id));
}

function getFeaturedContent() {
  const localFeatured = streamflixCatalog.find(item => item.featured && item.source !== 'tmdb');
  if (localFeatured) return localFeatured;

  const apiFeatured = streamflixCatalog.find(item => item.source === 'tmdb' && item.thumb);
  return apiFeatured ?? streamflixCatalog[0] ?? null;
}

function renderHero() {
  const featured = getFeaturedContent();
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  const heroBadge = document.getElementById('hero-badge');
  const heroBg = document.getElementById('hero-bg-img');

  if (!featured) {
    document.getElementById('hero-content').innerHTML = `<p class="hero-empty">Nenhum conteúdo disponível ainda.</p>`;
    return;
  }

  heroTitle.textContent = featured.title;
  heroDesc.textContent = featured.desc;
  heroBadge.textContent = featured.source === 'tmdb'
    ? `${typeMap[featured.type] ?? featured.type} · TMDB`
    : typeMap[featured.type] ?? featured.type;

  if (featured.thumb) {
    heroBg.style.backgroundImage = `url(${featured.thumb})`;
  }

  document.getElementById('hero-play').addEventListener('click', () => {
    UI.showToast(`▶ Reproduzindo: ${featured.title}`, 'info');
  });

  const favBtn = document.getElementById('hero-fav');

favBtn.addEventListener('click', function() {
  const user = AppState.getUser();

  if (!user) {
    UI.showToast('Faça login para adicionar aos favoritos.', 'error');

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);

    return;
  }

  const isFav = AppState.toggleFavorite(featured.id);

  this.textContent = isFav ? '♥ Favoritado' : '+ Lista';

  UI.showToast(
    isFav ? 'Adicionado aos favoritos!' : 'Removido dos favoritos.',
    isFav ? 'success' : 'info'
  );
});

  if (AppState.isFavorite(featured.id)) {
    favBtn.textContent = '♥ Favoritado';
  }
}

function renderContinueWatching() {
  const slice = streamflixCatalog.slice(0, 8);
  const row = document.getElementById('continue-row');
  if (!row) return;

  if (!slice.length) {
    row.closest('.section').classList.add('hidden');
    return;
  }

  row.innerHTML = slice.map(item => UI.renderCard(item)).join('');
}

function renderSeries() {
  const series = streamflixCatalog.filter(item => item.type === 'serie').slice(0, 12);
  const row = document.getElementById('series-row');
  if (!row) return;

  if (!series.length) {
    row.closest('.section').classList.add('hidden');
    return;
  }

  row.innerHTML = series.map(item => UI.renderCard(item)).join('');
}

function renderFilmes() {
  const filmes = streamflixCatalog.filter(item => item.type === 'filme').slice(0, 12);
  const row = document.getElementById('filmes-row');
  if (!row) return;

  if (!filmes.length) {
    row.closest('.section').classList.add('hidden');
    return;
  }

  row.innerHTML = filmes.map(item => UI.renderCard(item)).join('');
}

function renderAnimes() {
  const animes = streamflixCatalog
    .filter(item => item.type === 'anime' || item.type === 'doc' || item.genre === 'Anime' || item.genre === 'Documentário')
    .slice(0, 12);

  const row = document.getElementById('extras-row');
  if (!row) return;

  if (!animes.length) {
    row.closest('.section').classList.add('hidden');
    return;
  }

  row.innerHTML = animes.map(item => UI.renderCard(item)).join('');
}

function setupCardClicks() {
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;

    const id = Number(card.dataset.id);
    const item = findContentById(id);

    if (item) {
      openContentModal(item);
    }
  });
}

function openContentModal(item) {
  const overlay = document.getElementById('content-modal');
  if (!overlay) return;

  const isFav = AppState.isFavorite(item.id);
  const modalTitle = overlay.querySelector('#modal-title');
  const modalType = overlay.querySelector('#modal-type');
  const modalYear = overlay.querySelector('#modal-year');
  const modalRating = overlay.querySelector('#modal-rating');
  const modalGenre = overlay.querySelector('#modal-genre');
  const modalDesc = overlay.querySelector('#modal-desc');
  const watchBtn = overlay.querySelector('#modal-watch-btn');
  const favBtn = overlay.querySelector('#modal-fav-btn');

  if (modalTitle) modalTitle.textContent = item.title || 'Sem título';
  if (modalType) {
    modalType.textContent = item.source === 'tmdb'
      ? `${typeMap[item.type] ?? item.type} · TMDB`
      : typeMap[item.type] ?? item.type;
  }
  if (modalYear) modalYear.textContent = item.year || '—';
  if (modalRating) modalRating.textContent = `★ ${item.rating ?? '—'}`;
  if (modalGenre) modalGenre.textContent = item.genre || 'Sem gênero';
  if (modalDesc) modalDesc.textContent = item.desc || 'Sem descrição disponível.';

  if (watchBtn) {
    watchBtn.onclick = () => {
      UI.showToast(`▶ Reproduzindo: ${item.title}`, 'info');
    };
  }

  if (favBtn) {
    favBtn.textContent = isFav ? '♥ Nos Favoritos' : '+ Adicionar';

    favBtn.onclick = () => {
      const user = AppState.getUser();

      if (!user) {
        UI.showToast('Faça login para adicionar aos favoritos.', 'error');

        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1000);

        return;
      }

      const now = AppState.toggleFavorite(item.id);
      favBtn.textContent = now ? '♥ Nos Favoritos' : '+ Adicionar';

      UI.showToast(
        now ? 'Adicionado aos favoritos!' : 'Removido dos favoritos.',
        now ? 'success' : 'info'
      );
    };
  }

  overlay.classList.add('open');
}

function setupModalEvents() {
  const overlay = document.getElementById('content-modal');
  const closeBtn = document.getElementById('modal-close');

  if (!overlay) return;

  const closeModal = () => {
    overlay.classList.remove('open');
  };

  closeBtn?.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeModal();
    }
  });
}
