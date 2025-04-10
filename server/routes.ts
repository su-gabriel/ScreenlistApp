import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { mockShows, mockGenres, mockInsights, mockDetailedInsights, generateRecommendations } from "./mocks/data";
import fetch from "node-fetch";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Check if TMDB API key is properly configured
if (!TMDB_API_KEY) {
  console.error("WARNING: TMDB_API_KEY is not configured. TMDb API endpoints will not work correctly!");
}

// TMDb API type definitions
interface TMDbTVShow {
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

interface TMDbGenre {
  id: number;
  name: string;
}

interface TMDbNetworkOrCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country?: string;
}

interface TMDbCreator {
  id: number;
  name: string;
  profile_path: string | null;
}

interface TMDbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface TMDbCrewMember {
  id: number;
  name: string;
  department: string;
  job: string;
  profile_path: string | null;
}

interface TMDbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

interface TMDbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface TMDbPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

interface TMDbTVShowDetails {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genres: TMDbGenre[];
  origin_country: string[];
  original_language: string;
  original_name: string;
  created_by: TMDbCreator[];
  episode_run_time: number[];
  homepage: string;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  networks: TMDbNetworkOrCompany[];
  number_of_episodes: number;
  number_of_seasons: number;
  production_companies: TMDbNetworkOrCompany[];
  status: string;
  type: string;
  credits: {
    cast: TMDbCastMember[];
    crew: TMDbCrewMember[];
  };
  videos: {
    results: TMDbVideo[];
  };
  recommendations: TMDbPaginatedResponse<TMDbTVShow>;
  similar: TMDbPaginatedResponse<TMDbTVShow>;
  "watch/providers": {
    results: {
      [country: string]: {
        link: string;
        flatrate?: TMDbProvider[];
        rent?: TMDbProvider[];
        buy?: TMDbProvider[];
      };
    };
  };
}

// Helper function for TMDb API requests
async function fetchFromTMDb<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  try {
    if (!TMDB_API_KEY) {
      throw new Error("TMDb API key is not configured");
    }
    
    const url = new URL(`${TMDB_API_BASE}${endpoint}`);
    
    // Add API key and other params
    url.searchParams.append("api_key", TMDB_API_KEY);
    url.searchParams.append("language", "en-US");
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    console.log(`Making request to TMDb API: ${url.toString().replace(/api_key=([^&]+)/, 'api_key=HIDDEN')}`);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TMDb API error: ${response.status}, ${errorText}`);
      throw new Error(`TMDb API error: ${response.status}, ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`TMDb API success: ${endpoint}`);
    return data as T;
  } catch (error) {
    console.error(`Error fetching from TMDb: ${error}`);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // User streaming services routes
  app.post("/api/user/streaming-services", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { userId, serviceIds } = req.body;
    
    try {
      // First, delete existing user streaming services
      await storage.deleteUserStreamingServices(userId);
      
      // Then add the new ones
      for (const serviceId of serviceIds) {
        await storage.addUserStreamingService(userId, serviceId);
      }
      
      const services = await storage.getUserStreamingServices(userId);
      res.status(200).json(services);
    } catch (error) {
      console.error("Error updating user streaming services:", error);
      res.status(500).send("Failed to update streaming services");
    }
  });

  app.get("/api/user/streaming-services", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const services = await storage.getUserStreamingServices(req.user.id);
      res.status(200).json(services);
    } catch (error) {
      console.error("Error fetching user streaming services:", error);
      res.status(500).send("Failed to fetch streaming services");
    }
  });

  // User genres routes
  app.post("/api/user/genres", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { userId, genreIds } = req.body;
    
    try {
      // First, delete existing user genres
      await storage.deleteUserGenres(userId);
      
      // Then add the new ones
      for (const genreId of genreIds) {
        await storage.addUserGenre(userId, genreId);
      }
      
      const genres = await storage.getUserGenres(userId);
      res.status(200).json(genres);
    } catch (error) {
      console.error("Error updating user genres:", error);
      res.status(500).send("Failed to update genres");
    }
  });

  app.get("/api/user/genres", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const genres = await storage.getUserGenres(req.user.id);
      res.status(200).json(genres);
    } catch (error) {
      console.error("Error fetching user genres:", error);
      res.status(500).send("Failed to fetch genres");
    }
  });

  // Watch history routes
  app.post("/api/user/watch-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { userId, shows } = req.body;
    
    try {
      for (const show of shows) {
        // First try to find by TMDb ID if available
        let existingShow;
        if (show.id) {
          existingShow = await storage.getShowByTMDbId(show.id);
          console.log(`Looking for show with TMDb ID ${show.id} in database: ${!!existingShow}`);
        }
        
        // If not found by TMDb ID, try by title
        if (!existingShow && show.title) {
          existingShow = await storage.getShowByTitle(show.title);
          console.log(`Looking for show with title "${show.title}" in database: ${!!existingShow}`);
        }
        
        let showId;
        
        if (existingShow) {
          showId = existingShow.id;
          console.log(`Using existing show with ID ${showId}`);
        } else {
          // Check if we need to fetch from TMDb
          let tmdbShow = null;
          if (show.id) {
            try {
              console.log(`Fetching show ${show.id} from TMDb API for watch history`);
              tmdbShow = await fetchFromTMDb<TMDbTVShowDetails>(`/tv/${show.id}`, {
                append_to_response: "credits,videos,recommendations,similar,watch/providers"
              });
              console.log(`Successfully fetched show from TMDb: ${tmdbShow.name}`);
            } catch (error) {
              console.error(`Failed to fetch show details from TMDb: ${error}`);
            }
          }
          
          // Create the show with appropriate data
          const newShow = await storage.createShow({
            tmdbId: show.id || null,
            title: show.title || (tmdbShow ? tmdbShow.name : "Unknown"),
            posterUrl: show.posterUrl || (tmdbShow && tmdbShow.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbShow.poster_path}` : null),
            backdropUrl: show.backdropUrl || (tmdbShow && tmdbShow.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbShow.backdrop_path}` : null),
            overview: show.overview || (tmdbShow ? tmdbShow.overview : null),
            year: show.year || (tmdbShow && tmdbShow.first_air_date ? tmdbShow.first_air_date.split('-')[0] : null),
            rating: show.rating || (tmdbShow ? tmdbShow.vote_average.toFixed(1) : null),
            genreIds: show.genreIds || (tmdbShow ? tmdbShow.genres.map(g => g.id) : []),
            streamingServiceId: null
          });
          
          showId = newShow.id;
          console.log(`Created new show in database with ID ${showId}`);
        }
        
        await storage.addToWatchHistory(userId, showId);
      }
      
      const watchHistory = await storage.getUserWatchHistory(userId);
      res.status(200).json(watchHistory);
    } catch (error) {
      console.error("Error updating watch history:", error);
      res.status(500).send("Failed to update watch history");
    }
  });

  app.get("/api/user/watch-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const watchHistory = await storage.getUserWatchHistory(req.user.id);
      res.status(200).json(watchHistory);
    } catch (error) {
      console.error("Error fetching watch history:", error);
      res.status(500).send("Failed to fetch watch history");
    }
  });
  
  app.delete("/api/user/watch-history/:showId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const showId = parseInt(req.params.showId);
    
    try {
      // For now, we'll just remove the show from watch history but we could add more functionality
      // like updating watch counts, etc. in a real app
      await storage.removeFromWatchHistory(req.user.id, showId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error removing from watch history:", error);
      res.status(500).send("Failed to remove from watch history");
    }
  });

  // User settings routes
  app.post("/api/user/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { userId, emailNotifications, darkMode, shareData } = req.body;
    
    try {
      const settings = await storage.createUserSettings({
        userId,
        emailNotifications,
        darkMode,
        shareData
      });
      
      res.status(200).json(settings);
    } catch (error) {
      console.error("Error creating user settings:", error);
      res.status(500).send("Failed to create user settings");
    }
  });

  app.patch("/api/user/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const settings = await storage.updateUserSettings(req.user.id, req.body);
      res.status(200).json(settings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).send("Failed to update user settings");
    }
  });

  app.get("/api/user/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const settings = await storage.getUserSettings(req.user.id);
      res.status(200).json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).send("Failed to fetch user settings");
    }
  });

  // User profile route
  app.get("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const user = await storage.getUser(req.user.id);
      const watchHistory = await storage.getUserWatchHistory(req.user.id);
      const watchlist = await storage.getUserWatchlist(req.user.id);
      const services = await storage.getUserStreamingServices(req.user.id);
      
      const profile = {
        ...user,
        watchedCount: watchHistory.length,
        watchlistCount: watchlist.length,
        recommendationCount: 86, // This would normally be calculated
        hasCompletedOnboarding: services.length > 0, // Simple check for now
      };
      
      res.status(200).json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).send("Failed to fetch user profile");
    }
  });

  // Watchlist routes
  app.post("/api/watchlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { userId, showId } = req.body;
    console.log(`POST /api/watchlist - Adding show ${showId} to user ${userId}'s watchlist`);
    
    try {
      // First, make sure this show exists in our database
      // First look up by TMDb ID
      console.log(`Looking for show with TMDb ID ${showId} in our database`);
      let show = await storage.getShowByTMDbId(showId);
      console.log(`Show ${showId} exists in database: ${!!show}`);
      
      if (!show) {
        console.log(`Fetching show ${showId} from TMDb API`);
        // If not, fetch it from TMDb and save it to our database
        const tmdbShow = await fetchFromTMDb<TMDbTVShowDetails>(`/tv/${showId}`, {
          append_to_response: "credits,videos,recommendations,similar,watch/providers"
        });
        
        console.log(`Successfully fetched show from TMDb: ${tmdbShow.name}`);
        
        // Create the show in our database
        show = await storage.createShow({
          tmdbId: tmdbShow.id,
          title: tmdbShow.name,
          posterUrl: tmdbShow.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbShow.poster_path}` : null,
          backdropUrl: tmdbShow.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbShow.backdrop_path}` : null,
          overview: tmdbShow.overview,
          year: tmdbShow.first_air_date ? tmdbShow.first_air_date.split('-')[0] : null,
          rating: tmdbShow.vote_average.toFixed(1),
          genreIds: tmdbShow.genres.map(g => g.id)
        });
        
        console.log(`Created show in database: ${show.id} (TMDb ID: ${show.tmdbId}) - ${show.title}`);
      }
      
      // Now add to watchlist - Use our internal database ID
      console.log(`Adding show with database ID ${show.id} (TMDb ID: ${showId}) to user ${userId}'s watchlist`);
      const watchlistItem = await storage.addToWatchlist(userId, show.id);
      console.log(`Watchlist item created: ${JSON.stringify(watchlistItem)}`);
      
      res.status(201).json(watchlistItem);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).send("Failed to add to watchlist");
    }
  });

  app.get("/api/watchlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    console.log(`GET /api/watchlist - Fetching watchlist for user ${req.user.id}`);
    
    try {
      const watchlist = await storage.getUserWatchlist(req.user.id);
      console.log(`Retrieved ${watchlist.length} shows from user's watchlist`);
      console.log(`Watchlist item IDs: ${watchlist.map(show => show.id).join(', ')}`);
      
      res.status(200).json(watchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).send("Failed to fetch watchlist");
    }
  });

  app.delete("/api/watchlist/:showId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const showId = parseInt(req.params.showId);
    
    try {
      console.log(`Attempting to remove show ${showId} from user ${req.user.id}'s watchlist`);
      
      // If showId is a TMDb ID, we need to find the corresponding internal ID
      let internalShowId = showId;
      const show = await storage.getShowByTMDbId(showId);
      
      if (show) {
        // If we found it by TMDb ID, use the internal ID
        internalShowId = show.id;
        console.log(`Found show in database with TMDb ID ${showId}, using internal ID ${internalShowId}`);
      } else {
        // If we didn't find it by TMDb ID, assume it's an internal ID already
        console.log(`No show found with TMDb ID ${showId}, assuming it's an internal ID`);
      }
      
      await storage.removeFromWatchlist(req.user.id, internalShowId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).send("Failed to remove from watchlist");
    }
  });

  // Shows routes
  app.get("/api/shows/trending", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Verify API key is available
      if (!TMDB_API_KEY) {
        throw new Error("TMDB API key is not configured");
      }
      
      // Fetch trending TV shows from TMDb API
      const response = await fetchFromTMDb<TMDbPaginatedResponse<TMDbTVShow>>("/trending/tv/week");
      
      // Map the results to our format
      const trendingShows = response.results.slice(0, 12).map((show) => ({
        id: show.id,
        title: show.name,
        posterUrl: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
        backdropUrl: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : null,
        genreIds: show.genre_ids || [],
        overview: show.overview,
        rating: show.vote_average.toFixed(1),
        year: show.first_air_date ? show.first_air_date.substring(0, 4) : "Unknown",
        trending: true
      }));
      
      res.status(200).json(trendingShows);
    } catch (error) {
      console.error("Error fetching trending shows:", error);
      res.status(500).json({ 
        error: `Failed to fetch trending shows: ${(error as Error).message}`,
        message: "Please ensure the TMDB_API_KEY environment variable is properly set"
      });
    }
  });

  app.get("/api/shows/acclaimed", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Verify API key is available
      if (!TMDB_API_KEY) {
        throw new Error("TMDB API key is not configured");
      }
      
      // Fetch top-rated TV shows from TMDb API
      const response = await fetchFromTMDb<TMDbPaginatedResponse<TMDbTVShow>>("/tv/top_rated");
      
      // Map the results to our format
      const acclaimedShows = response.results.slice(0, 12).map((show) => ({
        id: show.id,
        title: show.name,
        posterUrl: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
        backdropUrl: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : null,
        genreIds: show.genre_ids || [],
        overview: show.overview,
        rating: show.vote_average.toFixed(1),
        year: show.first_air_date ? show.first_air_date.substring(0, 4) : "Unknown",
        trending: false
      }));
      
      res.status(200).json(acclaimedShows);
    } catch (error) {
      console.error("Error fetching acclaimed shows:", error);
      res.status(500).json({ 
        error: `Failed to fetch acclaimed shows: ${(error as Error).message}`,
        message: "Please ensure the TMDB_API_KEY environment variable is properly set"
      });
    }
  });

  app.get("/api/shows/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Set cache control headers to prevent caching
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    try {
      const query = req.query.q as string || '';
      const genreId = req.query.genre as string;
      const page = req.query.page as string || '1';
      
      // Debug information
      console.log(`Searching shows with: query="${query}", genreId="${genreId}", page=${page}`);
      
      // Priority order for genres (used when a show has multiple genres)
      const primaryGenrePriority = [
        10759, // Action & Adventure (high priority)
        10765, // Sci-Fi & Fantasy
        9648,  // Mystery
        80,    // Crime
        18,    // Drama
        35,    // Comedy
        10751, // Family
        16,    // Animation
        99,    // Documentary
        10768, // War & Politics
        37     // Western
      ];
      
      // Allow requesting shows by genre only
      if (genreId && genreId !== 'all') {
        // For genre discovery
        const endpoint = "/discover/tv";
        const params: Record<string, string> = { 
          page,
          with_genres: genreId,
          sort_by: "popularity.desc",
          language: "en-US"
        };
        
        console.log(`Making genre-based search request with genre ID: ${genreId}`);
        
        // First, get the genre name for better logging
        let genreName = "Unknown Genre";
        try {
          const genresResponse = await fetchFromTMDb<{ genres: TMDbGenre[] }>("/genre/tv/list");
          genreName = genresResponse.genres.find(g => g.id.toString() === genreId)?.name || "Unknown Genre";
          console.log(`Searching for genre: ${genreName} (ID: ${genreId})`);
        } catch (error) {
          console.error("Error fetching genre name:", error);
        }
        
        // Make the API request for shows with this genre
        const response = await fetchFromTMDb<TMDbPaginatedResponse<TMDbTVShow>>(endpoint, params);
        
        console.log(`Found ${response.results.length} total shows for genre ID ${genreId}`);
        
        // Filter the results to include shows that have the selected genre
        // This will include shows even if the genre is not their primary genre
        const filteredResults = response.results.filter(show => {
          if (!show.genre_ids || show.genre_ids.length === 0) {
            return false;
          }
          
          // Convert genreId to number for comparison
          const genreIdNum = parseInt(genreId);
          
          // Include the show if it has the selected genre
          return show.genre_ids.includes(genreIdNum);
        });
        
        console.log(`Filtered to ${filteredResults.length} shows with ${genreName} as primary genre`);
        
        // Log the first show to verify it has the correct primary genre
        if (filteredResults.length > 0) {
          const sampleShow = filteredResults[0];
          console.log(`Sample show: ${sampleShow.name}, genreIds: ${JSON.stringify(sampleShow.genre_ids)}`);
        }
        
        // Make a request to get all genres for better display
        let genresMap: Record<number, string> = {};
        try {
          const genresResponse = await fetchFromTMDb<{ genres: TMDbGenre[] }>("/genre/tv/list");
          genresResponse.genres.forEach(genre => {
            genresMap[genre.id] = genre.name;
          });
        } catch (error) {
          console.error("Error fetching genres:", error);
        }
        
        // Map the results to our format
        const searchResults = filteredResults.map((show) => {
          // Get all genre names for this show
          const genres = (show.genre_ids || [])
            .map(id => genresMap[id] || "Unknown")
            .filter(name => name !== "Unknown");
            
          return {
            id: show.id,
            title: show.name,
            posterUrl: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
            backdropUrl: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : null,
            overview: show.overview,
            rating: show.vote_average.toFixed(1),
            year: show.first_air_date ? show.first_air_date.substring(0, 4) : "Unknown",
            genreIds: show.genre_ids || [],
            genres: genres,
            primaryGenre: genreName
          };
        });
        
        return res.status(200).json({
          results: searchResults,
          page: parseInt(page),
          totalPages: response.total_pages,
          totalResults: filteredResults.length
        });
      } else if (query) {
        // For keyword search
        const endpoint = "/search/tv";
        const params: Record<string, string> = { 
          page,
          query,
          language: "en-US"
        };
        
        console.log(`Making keyword search request with query: "${query}"`);
        
        // Make the API request
        const response = await fetchFromTMDb<TMDbPaginatedResponse<TMDbTVShow>>(endpoint, params);
        
        console.log(`Found ${response.results.length} shows for query "${query}"`);
        
        // Make a request to get all genres for better display
        let genresMap: Record<number, string> = {};
        try {
          const genresResponse = await fetchFromTMDb<{ genres: TMDbGenre[] }>("/genre/tv/list");
          genresResponse.genres.forEach(genre => {
            genresMap[genre.id] = genre.name;
          });
        } catch (error) {
          console.error("Error fetching genres:", error);
        }
        
        // Map the results to our format
        const searchResults = response.results.map((show) => {
          // Determine primary genre using our priority list
          let primaryGenre = "Unknown";
          let primaryGenreId = -1;
          
          if (show.genre_ids && show.genre_ids.length > 0) {
            if (show.genre_ids.length === 1) {
              // If there's only one genre, that's the primary
              primaryGenreId = show.genre_ids[0];
            } else {
              // Find the highest priority genre
              let highestPriority = 999;
              
              for (const id of show.genre_ids) {
                const priority = primaryGenrePriority.indexOf(id);
                if (priority !== -1 && priority < highestPriority) {
                  primaryGenreId = id;
                  highestPriority = priority;
                }
              }
              
              // If no priority genre is found, use the first one
              if (primaryGenreId === -1 && show.genre_ids.length > 0) {
                primaryGenreId = show.genre_ids[0];
              }
            }
            
            // Get the genre name from our map
            if (primaryGenreId !== -1 && genresMap[primaryGenreId]) {
              primaryGenre = genresMap[primaryGenreId];
            }
          }
          
          // Get all genre names for this show
          const genres = (show.genre_ids || [])
            .map(id => genresMap[id] || "Unknown")
            .filter(name => name !== "Unknown");
            
          return {
            id: show.id,
            title: show.name,
            posterUrl: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
            backdropUrl: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : null,
            overview: show.overview,
            rating: show.vote_average.toFixed(1),
            year: show.first_air_date ? show.first_air_date.substring(0, 4) : "Unknown",
            genreIds: show.genre_ids || [],
            genres: genres,
            primaryGenre
          };
        });
        
        return res.status(200).json({
          results: searchResults,
          page: parseInt(page),
          totalPages: response.total_pages,
          totalResults: response.total_results
        });
      } else {
        return res.status(400).json({ error: "A search query or genre filter is required" });
      }
    } catch (error) {
      console.error("Error searching shows:", error);
      res.status(500).json({ 
        error: `Failed to search shows: ${(error as Error).message}`,
        message: "Please ensure the TMDB_API_KEY environment variable is properly set"
      });
    }
  });

  app.get("/api/shows/:id", async (req, res) => {
    try {
      const showId = parseInt(req.params.id);
      if (isNaN(showId)) {
        return res.status(400).send("Invalid show ID");
      }
      
      // Fetch show details from TMDb
      const tmdbShow = await fetchFromTMDb<TMDbTVShowDetails>(`/tv/${showId}`, {
        append_to_response: "credits,videos,recommendations,similar,watch/providers"
      });
      
      // Check if show exists in our database (for watchlist status)
      let inWatchlist = false;
      if (req.isAuthenticated()) {
        // First find if the show with this TMDb ID is in our database
        const dbShow = await storage.getShowByTMDbId(showId);
        
        if (dbShow) {
          // If it is, check if it's in the user's watchlist using our database ID
          const watchlist = await storage.getUserWatchlist(req.user.id);
          inWatchlist = watchlist.some(item => item.id === dbShow.id);
        }
      }
      
      // Format the response
      const formattedShow = {
        id: tmdbShow.id,
        title: tmdbShow.name,
        description: tmdbShow.overview,
        posterUrl: tmdbShow.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbShow.poster_path}` : null,
        backdropUrl: tmdbShow.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbShow.backdrop_path}` : null,
        year: tmdbShow.first_air_date ? tmdbShow.first_air_date.substring(0, 4) : "Unknown",
        genres: tmdbShow.genres.map((g) => g.name),
        episodes: tmdbShow.number_of_episodes,
        seasons: tmdbShow.number_of_seasons,
        runtime: tmdbShow.episode_run_time.length > 0 ? tmdbShow.episode_run_time[0] : 0,
        rating: tmdbShow.vote_average.toFixed(1),
        status: tmdbShow.status,
        networks: tmdbShow.networks.map((n) => ({
          id: n.id,
          name: n.name,
          logoUrl: n.logo_path ? `https://image.tmdb.org/t/p/w200${n.logo_path}` : null
        })),
        creator: tmdbShow.created_by.length > 0 ? tmdbShow.created_by[0].name : "Unknown",
        cast: tmdbShow.credits.cast.slice(0, 10).map((c) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : null
        })),
        similar: tmdbShow.similar.results.slice(0, 8).map((s) => ({
          id: s.id,
          title: s.name,
          posterUrl: s.poster_path ? `https://image.tmdb.org/t/p/w200${s.poster_path}` : null,
          year: s.first_air_date ? s.first_air_date.substring(0, 4) : "Unknown",
          rating: s.vote_average.toFixed(1)
        })),
        videos: tmdbShow.videos.results
          .filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))
          .slice(0, 3)
          .map((v) => ({
            id: v.id,
            key: v.key,
            name: v.name,
            type: v.type
          })),
        watchProviders: tmdbShow["watch/providers"].results.US 
          ? {
              link: tmdbShow["watch/providers"].results.US.link,
              flatrate: tmdbShow["watch/providers"].results.US.flatrate || [],
              rent: tmdbShow["watch/providers"].results.US.rent || [],
              buy: tmdbShow["watch/providers"].results.US.buy || [],
            } 
          : null,
        inWatchlist
      };
      
      res.status(200).json(formattedShow);
    } catch (error) {
      console.error("Error fetching show:", error);
      res.status(500).send(`Failed to fetch show: ${(error as Error).message}`);
    }
  });
  
  app.get("/api/recommendations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get user's preferences
      const userGenres = await storage.getUserGenres(req.user.id);
      const userWatchlist = await storage.getUserWatchlist(req.user.id);
      
      let recommendations: any[] = [];
      
      // If user has preferred genres, use them to fetch recommendations
      if (userGenres.length > 0) {
        // Select a random genre from user's preferences
        const randomGenre = userGenres[Math.floor(Math.random() * userGenres.length)];
        
        // Use discover endpoint with genre filter
        const response = await fetchFromTMDb<TMDbPaginatedResponse<TMDbTVShow>>("/discover/tv", {
          with_genres: randomGenre.id.toString(),
          sort_by: "popularity.desc",
          page: "1"
        });
        
        // Make a request to get all genres for better display
        let genresMap: Record<number, string> = {};
        try {
          const genresResponse = await fetchFromTMDb<{ genres: TMDbGenre[] }>("/genre/tv/list");
          genresResponse.genres.forEach(genre => {
            genresMap[genre.id] = genre.name;
          });
        } catch (error) {
          console.error("Error fetching genres:", error);
        }
        
        // Format the results
        recommendations = response.results.slice(0, 10).map(show => {
          // Map genre IDs to names
          const genres = (show.genre_ids || [])
            .map(id => genresMap[id] || "Unknown")
            .filter(name => name !== "Unknown");
            
          return {
            id: show.id,
            title: show.name,
            posterUrl: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
            backdropUrl: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : null,
            overview: show.overview,
            rating: show.vote_average.toFixed(1),
            year: show.first_air_date ? show.first_air_date.substring(0, 4) : "Unknown",
            genreIds: show.genre_ids || [],
            genres: genres
          };
        });
      } else {
        // If no preferred genres, get popular shows
        const response = await fetchFromTMDb<TMDbPaginatedResponse<TMDbTVShow>>("/tv/popular", {
          page: "1"
        });
        
        // Make a request to get all genres for better display
        let genresMap: Record<number, string> = {};
        try {
          const genresResponse = await fetchFromTMDb<{ genres: TMDbGenre[] }>("/genre/tv/list");
          genresResponse.genres.forEach(genre => {
            genresMap[genre.id] = genre.name;
          });
        } catch (error) {
          console.error("Error fetching genres:", error);
        }
        
        // Format the results
        recommendations = response.results.slice(0, 10).map(show => {
          // Map genre IDs to names
          const genres = (show.genre_ids || [])
            .map(id => genresMap[id] || "Unknown")
            .filter(name => name !== "Unknown");
            
          return {
            id: show.id,
            title: show.name,
            posterUrl: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
            backdropUrl: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : null,
            overview: show.overview,
            rating: show.vote_average.toFixed(1),
            year: show.first_air_date ? show.first_air_date.substring(0, 4) : "Unknown",
            genreIds: show.genre_ids || [],
            genres: genres
          };
        });
      }
      
      // Filter out shows that are already in the user's watchlist
      const watchlistIds = new Set(userWatchlist.map(show => show.id));
      recommendations = recommendations.filter(show => !watchlistIds.has(show.id));
      
      res.status(200).json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).send(`Failed to fetch recommendations: ${(error as Error).message}`);
    }
  });



  app.get("/api/genres", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Fetch genres from TMDb
      const response = await fetchFromTMDb<{ genres: TMDbGenre[] }>("/genre/tv/list");
      
      // Genre background images - mapping popular genre images
      const genreImages: Record<number, string> = {
        10759: "https://image.tmdb.org/t/p/w500/xDEVdWduhRjcYd0Vz9YwXk1dTu0.jpg", // Action & Adventure
        16: "https://image.tmdb.org/t/p/w500/wUWrX8Ua4IKVCWQgXvOF448BFIl.jpg",   // Animation
        35: "https://image.tmdb.org/t/p/w500/5qNHVYQvY9tSjIWDYp0Jzyl8FjS.jpg",   // Comedy
        80: "https://image.tmdb.org/t/p/w500/6t6r1VGQTTQecN4V0sZUqGLEMQO.jpg",   // Crime
        99: "https://image.tmdb.org/t/p/w500/pWBgjkG8ASxkqS8iGrEuUYnueKP.jpg",   // Documentary
        18: "https://image.tmdb.org/t/p/w500/3p39i93xnJ3iAAz5s0gjGXxbcNO.jpg",   // Drama
        10751: "https://image.tmdb.org/t/p/w500/3O7KINg6oJEmGlHXA3fMk2aw7Ui.jpg", // Family
        10762: "https://image.tmdb.org/t/p/w500/4cPIkL7kQAJQxHyW7biE6yjYzpX.jpg", // Kids
        9648: "https://image.tmdb.org/t/p/w500/rnFcbgaVlZML7FqdGPd5OFPW7Zq.jpg",  // Mystery
        10763: "https://image.tmdb.org/t/p/w500/czQbDpjbiAH7LHNP1lKhjy6Bbs.jpg",  // News
        10764: "https://image.tmdb.org/t/p/w500/z8TGv7Jdnptgel231J6KKZmG9QI.jpg", // Reality
        10765: "https://image.tmdb.org/t/p/w500/xHrp5yGXMRkJmE7ctpbcMxzpM17.jpg", // Sci-Fi & Fantasy
        10766: "https://image.tmdb.org/t/p/w500/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg", // Soap
        10767: "https://image.tmdb.org/t/p/w500/AjQP728h0PI40bHWQkFYbNX0J3S.jpg", // Talk
        10768: "https://image.tmdb.org/t/p/w500/fXRXAqnrWOGKKSu8lHJzuTcyHME.jpg", // War & Politics
        37: "https://image.tmdb.org/t/p/w500/qUi3Fgo2i6riiGIQqx4sSIbQXDP.jpg"     // Western
      };
      
      // Create a mapping for genre primary classification
      // These genres will be used as the primary genre when a show has multiple genres
      const primaryGenrePriority = [
        10759, // Action & Adventure (high priority)
        10765, // Sci-Fi & Fantasy
        9648,  // Mystery
        80,    // Crime
        18,    // Drama
        35,    // Comedy
        10751, // Family
        16,    // Animation
        99,    // Documentary
        10768, // War & Politics
        37     // Western
      ];
      
      // Add image URLs to genres and add a priority field for sorting
      const genresWithImages = response.genres.map(genre => {
        // Assign a priority based on the index in the primaryGenrePriority array
        // Lower number = higher priority
        const priorityIndex = primaryGenrePriority.indexOf(genre.id);
        const priority = priorityIndex >= 0 ? priorityIndex : 999; // Default to low priority if not in list
        
        return {
          ...genre,
          priority,
          imageUrl: genreImages[genre.id] || `https://ui-avatars.com/api/?name=${encodeURIComponent(genre.name)}&background=random&color=fff&size=256`
        };
      });
      
      res.status(200).json(genresWithImages);
    } catch (error) {
      console.error("Error fetching genres:", error);
      res.status(500).send(`Failed to fetch genres: ${(error as Error).message}`);
    }
  });

  // Insights routes
  app.get("/api/insights", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get user's watch history and watchlist
      const watchHistory = await storage.getUserWatchHistory(req.user.id);
      const watchlist = await storage.getUserWatchlist(req.user.id);
      
      // Combine watch history and watchlist for analysis
      const allShows = [...watchHistory, ...watchlist];
      
      // If the user doesn't have enough shows, return a specific message
      if (allShows.length < 5) {
        return res.status(400).json({
          error: "Not enough data",
          message: `You need at least 5 shows in your watchlist or watch history. You currently have ${allShows.length}.`
        });
      }
      
      // Extract all genres from the shows
      const genreIds = allShows.flatMap(show => show.genreIds || []);
      
      // Get genre information to map IDs to names
      const genresResponse = await fetchFromTMDb<{ genres: TMDbGenre[] }>("/genre/tv/list");
      const genreMap = new Map();
      genresResponse.genres.forEach(genre => {
        genreMap.set(genre.id, genre.name);
      });
      
      // Count genre frequencies
      const genreCounts: Record<string, number> = {};
      genreIds.forEach(id => {
        const genreName = genreMap.get(id) || "Unknown";
        genreCounts[genreName] = (genreCounts[genreName] || 0) + 1;
      });
      
      // Calculate percentage for each genre
      const totalGenres = genreIds.length;
      const genrePercentages: Record<string, number> = {};
      for (const genre in genreCounts) {
        genrePercentages[genre] = Math.round((genreCounts[genre] / totalGenres) * 100);
      }
      
      // Determine primary genre (most frequent)
      let primaryGenre = "Drama"; // Default
      let maxCount = 0;
      for (const genre in genreCounts) {
        if (genreCounts[genre] > maxCount) {
          maxCount = genreCounts[genre];
          primaryGenre = genre;
        }
      }
      
      // Simplified insights based on primary genre
      let viewerType, viewerDescription, themes;
      
      switch (primaryGenre) {
        case "Action & Adventure":
          viewerType = "Thrill Seeker";
          viewerDescription = "You enjoy fast-paced, adrenaline-fueled content with bold characters and high stakes.";
          themes = ["Action", "Adventure", "Heroism", "Survival"];
          break;
        case "Comedy":
          viewerType = "Comedy Enthusiast";
          viewerDescription = "You appreciate shows that bring joy and laughter, with clever writing and relatable situations.";
          themes = ["Humor", "Satire", "Relationships", "Social Commentary"];
          break;
        case "Sci-Fi & Fantasy":
          viewerType = "Imagination Explorer";
          viewerDescription = "You're drawn to imaginative worlds, speculative concepts, and unique visions of what could be.";
          themes = ["World-building", "Technology", "Magic", "Human Potential"];
          break;
        case "Drama":
          viewerType = "Character-driven Explorer";
          viewerDescription = "You gravitate toward shows with complex characters and narrative depth, exploring the human condition.";
          themes = ["Character Development", "Moral Ambiguity", "Psychological Depth", "Relationships"];
          break;
        case "Crime":
          viewerType = "Mystery Analyzer";
          viewerDescription = "You enjoy piecing together clues and analyzing complex situations with high stakes and moral questions.";
          themes = ["Justice", "Morality", "Suspense", "Investigation"];
          break;
        case "Documentary":
          viewerType = "Knowledge Seeker";
          viewerDescription = "You value learning about the real world, appreciating factual content that expands your understanding.";
          themes = ["Education", "History", "Society", "Nature"];
          break;
        default:
          viewerType = "Eclectic Viewer";
          viewerDescription = "You have diverse tastes that span multiple genres, showing an appreciation for various types of storytelling.";
          themes = ["Variety", "Character", "Storytelling", "Emotional Range"];
      }
      
      // Create custom insights object
      const insights = {
        viewerType,
        viewerDescription,
        characterDrivenPercentage: Math.floor(Math.random() * 30) + 50, // Random value between 50-80%
        preferredShowTypes: `${primaryGenre.toLowerCase()} with strong character development`,
        themes,
        themeDescription: "Your viewing history suggests you're drawn to content that resonates with these themes."
      };
      
      res.status(200).json(insights);
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).send(`Failed to generate insights: ${(error as Error).message}`);
    }
  });

  app.get("/api/insights/detailed", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get user's watch history and watchlist
      const watchHistory = await storage.getUserWatchHistory(req.user.id);
      const watchlist = await storage.getUserWatchlist(req.user.id);
      
      // Combine watch history and watchlist for analysis
      const allShows = [...watchHistory, ...watchlist];
      
      // If the user doesn't have enough shows, return a specific message
      if (allShows.length < 5) {
        return res.status(400).json({
          error: "Not enough data",
          message: `You need at least 5 shows in your watchlist or watch history. You currently have ${allShows.length}.`
        });
      }
      
      // Extract all genres from the shows
      const genreIds = allShows.flatMap(show => show.genreIds || []);
      
      // Get genre information to map IDs to names
      const genresResponse = await fetchFromTMDb<{ genres: TMDbGenre[] }>("/genre/tv/list");
      const genreMap = new Map();
      genresResponse.genres.forEach(genre => {
        genreMap.set(genre.id, genre.name);
      });
      
      // Count genre frequencies
      const genreCounts: Record<string, number> = {};
      genreIds.forEach(id => {
        const genreName = genreMap.get(id) || "Unknown";
        genreCounts[genreName] = (genreCounts[genreName] || 0) + 1;
      });
      
      // Determine primary genre (most frequent)
      let primaryGenre = "Drama"; // Default
      let maxCount = 0;
      for (const genre in genreCounts) {
        if (genreCounts[genre] > maxCount) {
          maxCount = genreCounts[genre];
          primaryGenre = genre;
        }
      }
      
      // Sort genres by count for genre breakdown
      const sortedGenres = Object.entries(genreCounts)
        .map(([name, count]) => ({ 
          name, 
          percentage: Math.round((count as number / genreIds.length) * 100) 
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5); // Get top 5 genres
      
      // If we have fewer than 5 genres, add "Other" to make up the difference
      if (sortedGenres.length < 5) {
        const totalPercentage = sortedGenres.reduce((sum, genre) => sum + genre.percentage, 0);
        if (totalPercentage < 100) {
          sortedGenres.push({ name: "Other", percentage: 100 - totalPercentage });
        }
      }
      
      // Simplified insights based on primary genre (same as the basic insights)
      let viewerType, viewerDescription, themes, relatedInterests, characterTypes;
      
      switch (primaryGenre) {
        case "Action & Adventure":
          viewerType = "Thrill Seeker";
          viewerDescription = "Based on your watch history, you gravitate toward fast-paced, adrenaline-fueled content with bold characters and high stakes. You enjoy stories that keep you on the edge of your seat.";
          themes = ["Action", "Adventure", "Heroism", "Survival", "Excitement"];
          relatedInterests = ["Action Films", "Adventure Games", "Superhero Comics", "Survival Literature"];
          characterTypes = [
            {
              type: "Bold Heroes",
              icon: "🦸",
              color: "#1a237e",
              description: "You connect with courageous protagonists who take decisive action in the face of danger."
            },
            {
              type: "Strategic Masterminds",
              icon: "🧠",
              color: "#b71c1c",
              description: "You appreciate characters who can outsmart their opponents using intelligence and planning."
            },
            {
              type: "Reluctant Champions",
              icon: "👤",
              color: "#ffc107",
              description: "You resonate with ordinary people who rise to extraordinary challenges when needed."
            }
          ];
          break;
        case "Comedy":
          viewerType = "Comedy Enthusiast";
          viewerDescription = "Your viewing preferences show you appreciate content that brings joy and laughter, with clever writing and relatable situations. You enjoy shows that offer both humor and heart.";
          themes = ["Humor", "Satire", "Relationships", "Social Commentary", "Life Lessons"];
          relatedInterests = ["Comedy Specials", "Humorous Essays", "Satire", "Sitcom Analysis"];
          characterTypes = [
            {
              type: "Witty Underdogs",
              icon: "😏",
              color: "#1a237e",
              description: "You connect with characters who use humor as a coping mechanism while facing life's challenges."
            },
            {
              type: "Lovable Eccentrics",
              icon: "🤪",
              color: "#b71c1c",
              description: "You enjoy unique, quirky characters who march to their own beat and bring color to their world."
            },
            {
              type: "Ensemble Players",
              icon: "👥",
              color: "#ffc107",
              description: "You appreciate well-developed friend groups or families where the comedy comes from their dynamics."
            }
          ];
          break;
        case "Sci-Fi & Fantasy":
          viewerType = "Imagination Explorer";
          viewerDescription = "Based on your watch history, you're drawn to imaginative worlds, speculative concepts, and unique visions of possible futures or alternate realities. You value creativity and big ideas in storytelling.";
          themes = ["World-building", "Technology", "Magic", "Human Potential", "Ethical Dilemmas"];
          relatedInterests = ["Speculative Fiction", "Role-playing Games", "Futurism", "Scientific Discovery"];
          characterTypes = [
            {
              type: "Visionary Innovators",
              icon: "💡",
              color: "#1a237e",
              description: "You connect with forward-thinking characters who push boundaries and explore new possibilities."
            },
            {
              type: "Ethical Navigators",
              icon: "⚖️",
              color: "#b71c1c",
              description: "You appreciate characters who wrestle with moral questions in unfamiliar or complex situations."
            },
            {
              type: "Adaptive Survivors",
              icon: "🛡️",
              color: "#ffc107",
              description: "You resonate with characters who show resilience and ingenuity in strange or challenging environments."
            }
          ];
          break;
        case "Drama":
          viewerType = "Character-driven Explorer";
          viewerDescription = "Based on your watch history, you gravitate toward shows with complex characters and narrative depth. You enjoy exploring the human condition through storytelling and prefer shows that make you think.";
          themes = ["Character Development", "Moral Ambiguity", "Psychological Depth", "Relationships", "Ethical Dilemmas"];
          relatedInterests = ["Literary Fiction", "Character Studies", "Indie Films", "Psychological Thrillers"];
          characterTypes = [
            {
              type: "Complex Protagonists",
              icon: "👤",
              color: "#1a237e",
              description: "You gravitate toward morally ambiguous main characters who undergo significant personal growth."
            },
            {
              type: "Enigmatic Antagonists",
              icon: "👻",
              color: "#b71c1c",
              description: "You appreciate villains with compelling backstories and understandable motivations."
            },
            {
              type: "Intellectual Mentors",
              icon: "🧠",
              color: "#ffc107",
              description: "You respond to wise, thoughtful characters who challenge others to grow intellectually."
            }
          ];
          break;
        case "Crime":
          viewerType = "Mystery Analyzer";
          viewerDescription = "Your watch history reveals you enjoy piecing together clues and analyzing complex situations with high stakes and moral questions. You're drawn to narratives that challenge your problem-solving skills.";
          themes = ["Justice", "Morality", "Suspense", "Investigation", "Truth"];
          relatedInterests = ["Mystery Novels", "True Crime Podcasts", "Puzzles", "Investigative Journalism"];
          characterTypes = [
            {
              type: "Brilliant Detectives",
              icon: "🔍",
              color: "#1a237e",
              description: "You connect with observant, analytical characters who see what others miss."
            },
            {
              type: "Flawed Justice-Seekers",
              icon: "⚖️",
              color: "#b71c1c",
              description: "You appreciate characters driven by a strong moral compass, even when they themselves struggle."
            },
            {
              type: "Procedural Experts",
              icon: "📋",
              color: "#ffc107",
              description: "You resonate with methodical professionals who approach problems systematically."
            }
          ];
          break;
        case "Documentary":
          viewerType = "Knowledge Seeker";
          viewerDescription = "Your viewing choices suggest you value learning about the real world and expanding your understanding of different subjects, people, and phenomena. You appreciate factual content that informs and challenges.";
          themes = ["Education", "History", "Society", "Nature", "Human Experience"];
          relatedInterests = ["Non-fiction Books", "Podcasts", "Museums", "Cultural Events"];
          characterTypes = [
            {
              type: "Revolutionary Thinkers",
              icon: "💭",
              color: "#1a237e",
              description: "You're drawn to historical or contemporary figures who changed paradigms with new ideas."
            },
            {
              type: "Passionate Experts",
              icon: "👨‍🔬",
              color: "#b71c1c",
              description: "You connect with specialists who deeply understand their field and communicate with enthusiasm."
            },
            {
              type: "Cultural Witnesses",
              icon: "👁️",
              color: "#ffc107",
              description: "You appreciate individuals who observe, document, and share important events or phenomena."
            }
          ];
          break;
        default:
          viewerType = "Eclectic Viewer";
          viewerDescription = "Your watch history shows diverse tastes that span multiple genres, demonstrating an appreciation for various types of storytelling and content. You value variety and are open to different viewing experiences.";
          themes = ["Variety", "Character", "Storytelling", "Emotional Range", "Versatility"];
          relatedInterests = ["Multi-genre Fiction", "Varied Media", "Cultural Exploration", "Artistic Diversity"];
          characterTypes = [
            {
              type: "Adaptable Protagonists",
              icon: "🔄",
              color: "#1a237e",
              description: "You connect with versatile characters who thrive in different situations and settings."
            },
            {
              type: "Genre-Spanning Icons",
              icon: "🌟",
              color: "#b71c1c",
              description: "You appreciate characters who effectively blend elements from different storytelling traditions."
            },
            {
              type: "Unexpected Heroes",
              icon: "🦸",
              color: "#ffc107",
              description: "You're drawn to characters who defy expectations and conventional categorization."
            }
          ];
      }
      
      // Generate viewing patterns comparison data
      // In a real app, this would come from analyzing actual user data
      const userComparisonData = {
        averageEpisodesPerWeek: Math.floor(Math.random() * 8) + 3,
        friendsAverageEpisodesPerWeek: Math.floor(Math.random() * 8) + 3,
        allUsersAverageEpisodesPerWeek: 5,
        
        completionRate: Math.floor(Math.random() * 30) + 60, // 60-90%
        friendsCompletionRate: Math.floor(Math.random() * 30) + 60,
        allUsersCompletionRate: 73,
        
        diversityScore: Math.floor(Math.random() * 30) + 60, // 60-90%
        friendsDiversityScore: Math.floor(Math.random() * 30) + 60,
        allUsersDiversityScore: 68,
        
        nightOwl: Math.random() > 0.5, // Random boolean
        bingePercentage: Math.floor(Math.random() * 40) + 30, // 30-70%
        friendsBingePercentage: Math.floor(Math.random() * 40) + 30,
        allUsersBingePercentage: 55
      };
      
      // Create personalized insight
      const characterInsight = `Your preference for ${primaryGenre} shows suggests you value ${themes[0].toLowerCase()} and ${themes[1].toLowerCase()} in the stories you watch. The character types you connect with reflect an appreciation for complexity and depth in storytelling.`;
      
      // Create detailed insights object
      const detailedInsights = {
        viewerType,
        viewerDescription,
        themes,
        relatedInterests,
        genreBreakdown: sortedGenres,
        viewingPatterns: userComparisonData,
        characterAffinity: characterTypes,
        characterInsight
      };
      
      res.status(200).json(detailedInsights);
    } catch (error) {
      console.error("Error generating detailed insights:", error);
      res.status(500).send(`Failed to generate detailed insights: ${(error as Error).message}`);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
