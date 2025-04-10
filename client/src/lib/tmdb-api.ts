// TMDb API Service

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// Common query params for API requests
// We're using our backend API instead of direct TMDB calls from frontend
// This is intentionally empty since our backend will add the API key
const defaultParams = {
  language: "en-US",
};

// Image sizes as defined by TMDb
export const ImageSize = {
  Poster: {
    Small: "w185",
    Medium: "w342",
    Large: "w500",
    Original: "original",
  },
  Backdrop: {
    Small: "w300",
    Medium: "w780",
    Large: "w1280",
    Original: "original",
  },
  Profile: {
    Small: "w45",
    Medium: "w185",
    Large: "h632",
    Original: "original",
  },
};

// Helper to construct image URLs
export function getImageUrl(path: string | null, size = ImageSize.Poster.Medium): string {
  if (!path) return "/placeholder-poster.jpg";
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

// Function to make API requests
async function fetchFromTMDb(endpoint: string, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  
  // Add default params and additional params to the URL
  Object.entries({ ...defaultParams, ...params }).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString());
  });

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`TMDb API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// ---- TV Show API Endpoints ----

// Get popular TV shows
export async function getPopularTVShows(page = 1) {
  return fetchFromTMDb("/tv/popular", { page });
}

// Get top rated TV shows
export async function getTopRatedTVShows(page = 1) {
  return fetchFromTMDb("/tv/top_rated", { page });
}

// Get TV shows currently airing
export async function getOnAirTVShows(page = 1) {
  return fetchFromTMDb("/tv/on_the_air", { page });
}

// Get TV shows airing today
export async function getAiringTodayTVShows(page = 1) {
  return fetchFromTMDb("/tv/airing_today", { page });
}

// Get detailed information about a specific TV show
export async function getTVShowDetails(id: number) {
  return fetchFromTMDb(`/tv/${id}`, { 
    append_to_response: "credits,videos,recommendations,similar,watch/providers" 
  });
}

// Search for TV shows by title
export async function searchTVShows(query: string, page = 1) {
  return fetchFromTMDb("/search/tv", { query, page });
}

// Get TV shows by genre
export async function getTVShowsByGenre(genreId: number, page = 1) {
  return fetchFromTMDb("/discover/tv", { 
    with_genres: genreId,
    page,
    sort_by: "popularity.desc"
  });
}

// ---- Genre API Endpoints ----

// Get list of TV show genres
export async function getTVGenres() {
  return fetchFromTMDb("/genre/tv/list");
}

// ---- Provider API Endpoints ----

// Get list of watch providers (streaming services)
export async function getWatchProviders() {
  return fetchFromTMDb("/watch/providers/tv", { watch_region: "US" });
}

// Get TV shows by provider
export async function getTVShowsByProvider(providerId: number, page = 1) {
  return fetchFromTMDb("/discover/tv", { 
    with_watch_providers: providerId,
    watch_region: "US",
    page
  });
}

// ---- Type Definitions ----

export interface TMDbPaginatedResponse {
  page: number;
  results: any[];
  total_pages: number;
  total_results: number;
}

export interface TMDbTVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
  original_name: string;
}

export interface TMDbTVShowDetails extends TMDbTVShow {
  created_by: {
    id: number;
    name: string;
    profile_path: string | null;
  }[];
  episode_run_time: number[];
  genres: {
    id: number;
    name: string;
  }[];
  homepage: string;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  last_episode_to_air: {
    id: number;
    name: string;
    overview: string;
    air_date: string;
    episode_number: number;
    season_number: number;
    still_path: string | null;
  };
  next_episode_to_air: {
    id: number;
    name: string;
    overview: string;
    air_date: string;
    episode_number: number;
    season_number: number;
    still_path: string | null;
  } | null;
  networks: {
    id: number;
    name: string;
    logo_path: string | null;
  }[];
  number_of_episodes: number;
  number_of_seasons: number;
  production_companies: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  seasons: {
    id: number;
    name: string;
    overview: string;
    air_date: string | null;
    episode_count: number;
    poster_path: string | null;
    season_number: number;
  }[];
  status: string;
  type: string;
  credits: {
    cast: {
      id: number;
      name: string;
      profile_path: string | null;
      character: string;
      order: number;
    }[];
    crew: {
      id: number;
      name: string;
      profile_path: string | null;
      job: string;
      department: string;
    }[];
  };
  videos: {
    results: {
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }[];
  };
  recommendations: TMDbPaginatedResponse;
  similar: TMDbPaginatedResponse;
  "watch/providers": {
    results: {
      [country: string]: {
        link: string;
        flatrate?: {
          provider_id: number;
          provider_name: string;
          logo_path: string;
        }[];
        rent?: {
          provider_id: number;
          provider_name: string;
          logo_path: string;
        }[];
        buy?: {
          provider_id: number;
          provider_name: string;
          logo_path: string;
        }[];
      };
    };
  };
}

export interface TMDbGenre {
  id: number;
  name: string;
}

export interface TMDbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface TMDbProviderResponse {
  results: TMDbProvider[];
}