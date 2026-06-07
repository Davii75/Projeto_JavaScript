/*
  StreamFlix + TMDB API
  Arquivo corrigido.
  Use somente a API Key v3 dentro de TMDB_API_KEY.
*/

console.log("api.js carregou!");

const TMDB_API_KEY = "53483ee626fe630e76068bf7c4f31b2e";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_URL = "https://image.tmdb.org/t/p/w500";

const StreamFlixAPI = (() => {
  const hasApiKey = () =>
    TMDB_API_KEY &&
    TMDB_API_KEY.trim().length > 8 &&
    TMDB_API_KEY !== "SUA_CHAVE_TMDB_AQUI";

  const genreMap = {
    28: "Ação",
    12: "Ação",
    16: "Anime",
    35: "Comédia",
    80: "Drama",
    99: "Documentário",
    18: "Drama",
    10751: "Drama",
    14: "Sci-Fi",
    36: "Documentário",
    27: "Terror",
    10402: "Drama",
    9648: "Terror",
    10749: "Romance",
    878: "Sci-Fi",
    10770: "Drama",
    53: "Terror",
    10752: "Ação",
    37: "Ação",
    10759: "Ação",
    10762: "Anime",
    10763: "Documentário",
    10764: "Documentário",
    10765: "Sci-Fi",
    10766: "Drama",
    10767: "Documentário",
    10768: "Ação"
  };

  const safeFetch = async (url) => {
    if (!hasApiKey()) {
      console.warn("Chave TMDB ausente ou inválida.");
      return { results: [] };
    }

    try {
      console.log("Buscando na TMDB:", url);
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erro TMDB:", response.status, errorData);
        return { results: [] };
      }

      const data = await response.json();
      console.log("Resposta TMDB:", data);
      return data;
    } catch (error) {
      console.error("Erro ao buscar dados da TMDB:", error);
      return { results: [] };
    }
  };

  const getGenre = (ids = []) => {
    if (!ids.length) return "Drama";
    return genreMap[ids[0]] ?? "Drama";
  };

  const normalizeMovie = (movie, index = 0) => ({
    id: 900000000 + Number(movie.id),
    tmdbId: movie.id,
    title: movie.title || movie.original_title || "Sem título",
    type: "filme",
    genre: getGenre(movie.genre_ids),
    year: movie.release_date ? movie.release_date.split("-")[0] : "—",
    rating: movie.vote_average ? Number(movie.vote_average.toFixed(1)) : 0,
    thumb: movie.poster_path ? `${TMDB_IMG_URL}${movie.poster_path}` : "",
    desc: movie.overview || "Sinopse não disponível em português.",
    featured: index === 0,
    source: "tmdb"
  });

  const normalizeSerie = (serie, index = 0) => ({
    id: 800000000 + Number(serie.id),
    tmdbId: serie.id,
    title: serie.name || serie.original_name || "Sem título",
    type: "serie",
    genre: getGenre(serie.genre_ids),
    year: serie.first_air_date ? serie.first_air_date.split("-")[0] : "—",
    rating: serie.vote_average ? Number(serie.vote_average.toFixed(1)) : 0,
    thumb: serie.poster_path ? `${TMDB_IMG_URL}${serie.poster_path}` : "",
    desc: serie.overview || "Sinopse não disponível em português.",
    featured: index === 0,
    source: "tmdb"
  });

  const getPopularMovies = async () => {
    const data = await safeFetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`
    );

    return (data.results || [])
      .filter(item => item.poster_path)
      .slice(0, 12)
      .map(normalizeMovie);
  };

  const getTrendingMovies = async () => {
    const data = await safeFetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=pt-BR`
    );

    return (data.results || [])
      .filter(item => item.poster_path)
      .slice(0, 12)
      .map(normalizeMovie);
  };

  const getPopularSeries = async () => {
    const data = await safeFetch(
      `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`
    );

    return (data.results || [])
      .filter(item => item.poster_path)
      .slice(0, 12)
      .map(normalizeSerie);
  };

  const searchMovies = async (query) => {
    if (!query || query.trim().length < 2) return [];

    const data = await safeFetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`
    );

    return (data.results || [])
      .filter(item => item.poster_path)
      .slice(0, 12)
      .map(normalizeMovie);
  };

  const getApiCatalog = async () => {
    const [popularMovies, trendingMovies, popularSeries] = await Promise.all([
      getPopularMovies(),
      getTrendingMovies(),
      getPopularSeries()
    ]);

    const joined = [...popularMovies, ...trendingMovies, ...popularSeries];
    const unique = new Map();

    joined.forEach(item => {
      if (!unique.has(item.id)) unique.set(item.id, item);
    });

    return Array.from(unique.values());
  };

  const getFullCatalog = async () => {
    const localCatalog = AppState.getCatalog().map(item => ({
      ...item,
      source: item.source || "admin"
    }));

    const apiCatalog = await getApiCatalog();
    return [...localCatalog, ...apiCatalog];
  };

  return {
    hasApiKey,
    getPopularMovies,
    getTrendingMovies,
    getPopularSeries,
    searchMovies,
    getApiCatalog,
    getFullCatalog
  };
})();

// Compatibilidade: caso algum arquivo antigo chame getPopularMovies() direto.
async function getPopularMovies() {
  return StreamFlixAPI.getPopularMovies();
}
