const AppState = (() => {
  const STORAGE_KEYS = {
    CATALOG: 'streamflix_catalog',
    USER: 'streamflix_user',
    FAVORITES: 'streamflix_favorites',
    THEME: 'streamflix_theme'
  };

  const defaults = {
    catalog: [
      { id: 1, title: 'Cosmos Infinito', type: 'serie', genre: 'Sci-Fi', year: 2024, rating: 9.1, thumb: '', desc: 'Uma jornada épica pelos confins do universo descobrindo civilizações perdidas.', featured: true },
      { id: 2, title: 'Sombras do Passado', type: 'filme', genre: 'Drama', year: 2023, rating: 8.7, thumb: '', desc: 'Um detetive obcecado reabre um caso misterioso que mudou sua vida para sempre.', featured: false },
      { id: 3, title: 'Rindo até Chorar', type: 'serie', genre: 'Comédia', year: 2024, rating: 8.2, thumb: '', desc: 'Quatro amigos atravessam situações absurdamente engraçadas no cotidiano.', featured: false },
      { id: 4, title: 'Katana no Vento', type: 'anime', genre: 'Ação', year: 2024, rating: 9.4, thumb: '', desc: 'Uma guerreira solitária busca vingança num Japão feudal repleto de magia.', featured: false },
      { id: 5, title: 'Planeta Azul III', type: 'doc', genre: 'Documentário', year: 2024, rating: 9.6, thumb: '', desc: 'Explorando os oceanos mais profundos e criaturas nunca antes documentadas.', featured: false },
      { id: 6, title: 'Noite Eterna', type: 'filme', genre: 'Terror', year: 2023, rating: 7.9, thumb: '', desc: 'Em uma cidade sem sol, os sobreviventes enfrentam criaturas das trevas.', featured: false },
    ],
    user: null,
    favorites: [],
    theme: 'dark'
  };

  const load = (key) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS[key.toUpperCase()]);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const save = (key, value) => {
    try {
      localStorage.setItem(STORAGE_KEYS[key.toUpperCase()], JSON.stringify(value));
    } catch {}
  };

  const getCatalog = () => load('catalog') ?? defaults.catalog;
  const saveCatalog = (data) => save('catalog', data);

  const getUser = () => load('user');
  const saveUser = (user) => save('user', user);
  const logout = () => localStorage.removeItem(STORAGE_KEYS.USER);

  const getFavorites = () => load('favorites') ?? [];
  const saveFavorites = (list) => save('favorites', list);

  const isAdmin = () => {
    const u = getUser();
    return u && u.role === 'admin';
  };

  const addContent = (item) => {
    const catalog = getCatalog();
    const newItem = { ...item, id: Date.now() };
    catalog.push(newItem);
    saveCatalog(catalog);
    return newItem;
  };

  const updateContent = (id, updates) => {
    const catalog = getCatalog();
    const idx = catalog.findIndex(c => c.id === id);
    if (idx === -1) return false;
    catalog[idx] = { ...catalog[idx], ...updates };
    saveCatalog(catalog);
    return true;
  };

  const removeContent = (id) => {
    const catalog = getCatalog().filter(c => c.id !== id);
    saveCatalog(catalog);
  };

  const getById = (id) => getCatalog().find(c => c.id === id);

  const getByType = (type) => getCatalog().filter(c => c.type === type);

  const getFeatured = () => {
    const cat = getCatalog();
    const feat = cat.find(c => c.featured);
    return feat ?? cat[0] ?? null;
  };

  const toggleFavorite = (id) => {
    const favs = getFavorites();
    const idx = favs.indexOf(id);
    if (idx === -1) favs.push(id);
    else favs.splice(idx, 1);
    saveFavorites(favs);
    return favs.includes(id);
  };

  const isFavorite = (id) => getFavorites().includes(id);

  return {
    getCatalog, saveCatalog, getUser, saveUser, logout, isAdmin,
    getFavorites, saveFavorites, toggleFavorite, isFavorite,
    addContent, updateContent, removeContent, getById, getByType, getFeatured,
    defaults
  };
})();

const UI = (() => {
  const showToast = (msg, type = 'info') => {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    const icons = { success: '✓', error: '✕', info: '●' };
    toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
    toast.className = `toast ${type}`;
    requestAnimationFrame(() => {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    });
  };

  const getTypeTag = (type) => {
    const map = { serie: 'Série', filme: 'Filme', doc: 'Doc', anime: 'Anime' };
    return `<span class="tag tag-${type}">${map[type] ?? type}</span>`;
  };

  const renderCard = (item, rank = null) => {
    const thumbHTML = item.thumb
      ? `<img class="card-thumb" src="${item.thumb}" alt="${item.title}" loading="lazy">`
      : `<div class="card-thumb-placeholder">
           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m8 21 4-4 4 4"/><path d="M12 17v4"/></svg>
           <span>${item.title}</span>
         </div>`;

    const rankBadge = rank !== null ? `<div class="rank-badge">#${rank}</div>` : '';

    return `
      <div class="card" data-id="${item.id}">
        ${rankBadge}
        ${thumbHTML}
        <div class="card-overlay">
          <div class="card-play">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
        <div class="card-info">
          <div class="card-title">${item.title}</div>
          <div class="card-meta">
            <span class="card-rating">★ ${item.rating}</span>
            <span>${item.year}</span>
          </div>
        </div>
      </div>`;
  };

  const renderNavState = () => {
    const user = AppState.getUser();
    const navRight = document.getElementById('nav-right');
    if (!navRight) return;

    if (user) {
      navRight.innerHTML = `
        ${AppState.isAdmin() ? `<span class="admin-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>Admin</span>` : ''}
        <div class="avatar" title="${user.name}" onclick="window.location.href='config.html'">${user.name[0].toUpperCase()}</div>
        <button class="btn btn-ghost btn-sm" onclick="handleLogout()">Sair</button>`;
      const adminBar = document.getElementById('admin-bar');
      if (adminBar && AppState.isAdmin()) adminBar.classList.add('visible');
    } else {
      navRight.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm">Entrar</a>`;
    }
  };

  return { showToast, getTypeTag, renderCard, renderNavState };
})();

function handleLogout() {
  AppState.logout();
  UI.showToast('Até logo!', 'info');
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}

document.addEventListener('DOMContentLoaded', () => {
  UI.renderNavState();
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
});
