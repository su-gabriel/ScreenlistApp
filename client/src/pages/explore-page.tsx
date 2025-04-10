import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShowCard } from "@/components/ui/show-card";
import { GenreCard } from "@/components/ui/genre-card";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Show } from "@shared/schema";

// Local alias for API response show objects - different from database Show type
interface ShowData {
  id: number;
  title: string;
  posterUrl: string | null;
  backdropUrl?: string | null;
  overview: string;
  rating: string;
  year: string;
  genres?: number[];
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get user's watchlist
  const { data: watchlist = [] } = useQuery<Show[]>({
    queryKey: ["/api/watchlist"],
  });
  
  // Create a set of show IDs that are in the watchlist for quick lookup
  const watchlistIds = new Set(watchlist.map((show) => show.id));
  
  // Fetch trending shows
  const { data: trendingShows = [], isLoading: loadingTrending } = useQuery<Show[]>({
    queryKey: ["/api/shows/trending"],
  });
  
  // Fetch acclaimed shows
  const { data: acclaimedShows = [], isLoading: loadingAcclaimed } = useQuery<Show[]>({
    queryKey: ["/api/shows/acclaimed"],
  });
  
  // Define Genre interface
  interface Genre {
    id: number;
    name: string;
    imageUrl: string;
  }
  
  // Fetch genres with images
  const { data: genres = [], isLoading: loadingGenres } = useQuery<Genre[]>({
    queryKey: ["/api/genres"],
  });
  
  // Define search results interface
  interface SearchResults {
    results: Show[];
    page: number;
    totalPages: number;
    totalResults: number;
  }
  
  // Search results query
  const { data: searchResults, isLoading: loadingSearch } = useQuery<SearchResults>({
    queryKey: ["/api/shows/search", searchQuery, selectedGenre], // Include dependencies in the queryKey
    enabled: searchQuery.length > 0 || selectedGenre !== "all",
    queryFn: async ({ signal }) => {
      let url = "/api/shows/search";
      
      // Add appropriate query parameters based on what's selected
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append("q", searchQuery);
      }
      
      if (selectedGenre !== "all") {
        params.append("genre", selectedGenre);
      }

      // Add cache-busting timestamp parameter
      params.append("_t", Date.now().toString());
      
      // Append query parameters to URL if there are any
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, { 
        signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to search shows");
      }
      
      const data: SearchResults = await response.json();
      return data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
  
  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async (showId: number) => {
      return await apiRequest("POST", "/api/watchlist", {
        userId: (queryClient.getQueryData(["/api/user"]) as any)?.id,
        showId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Added to watchlist",
        description: "Show has been added to your watchlist",
      });
    },
    onError: (error: Error) => {
      console.error("Failed to add to watchlist:", error);
      toast({
        title: "Failed to add to watchlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove from watchlist mutation
  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (showId: number) => {
      return await apiRequest("DELETE", `/api/watchlist/${showId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Removed from watchlist",
        description: "Show has been removed from your watchlist",
      });
    },
    onError: (error: Error) => {
      console.error("Failed to remove from watchlist:", error);
      toast({
        title: "Failed to remove from watchlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAddToWatchlist = (showId: number) => {
    addToWatchlistMutation.mutate(showId);
  };
  
  const handleRemoveFromWatchlist = (showId: number) => {
    removeFromWatchlistMutation.mutate(showId);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search will automatically trigger via the query dependency
  };
  
  const handleGenreClick = (genreId: number) => {
    setSelectedGenre(genreId.toString());
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Explore Shows</h1>
        <p className="text-zinc-400">Discover new shows by genre or search by title.</p>
      </div>
      
      {/* Search and Filter Section */}
      <div className="bg-zinc-900 rounded-lg p-4 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search shows..."
                className="w-full bg-zinc-950 text-white py-3 px-4 pr-10 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit"
                variant="ghost" 
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <Search className="h-5 w-5 text-zinc-400" />
              </Button>
            </div>
          </div>
          
          <div>
            <Select 
              value={selectedGenre} 
              onValueChange={setSelectedGenre}
            >
              <SelectTrigger className="w-[180px] bg-zinc-950">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {!loadingGenres && genres?.map(genre => (
                  <SelectItem key={genre.id} value={genre.id.toString()}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
      </div>
      
      {/* Search Results (when search is active) */}
      {(searchQuery || selectedGenre !== "all") && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {selectedGenre !== "all" 
              ? `Shows in ${genres.find(g => g.id.toString() === selectedGenre)?.name || "Selected Genre"}`
              : "Search Results"}
          </h2>
          
          {loadingSearch ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-lg overflow-hidden animate-pulse">
                  <div className="relative pb-[140%] bg-zinc-800"></div>
                  <div className="p-3">
                    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults?.results?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {searchResults.results.map((show: Show) => (
                <ShowCard
                  key={show.id}
                  show={show}
                  inWatchlist={watchlistIds.has(show.id)}
                  onAddToWatchlist={(id) => handleAddToWatchlist(id)}
                  onRemoveFromWatchlist={(id) => handleRemoveFromWatchlist(id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-lg p-8 text-center">
              <p className="text-zinc-400">
                No shows found matching your search criteria.
              </p>
            </div>
          )}
        </section>
      )}
      
      {/* Show original content when no search is active */}
      {!searchQuery && selectedGenre === "all" && (
        <>
          {/* Trending Shows */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Trending This Week</h2>
            
            {loadingTrending ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-zinc-900 rounded-lg overflow-hidden animate-pulse">
                    <div className="relative pb-[140%] bg-zinc-800"></div>
                    <div className="p-3">
                      <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : trendingShows?.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {trendingShows.map((show, index) => (
                  <ShowCard
                    key={show.id}
                    show={show}
                    inWatchlist={watchlistIds.has(show.id)}
                    onAddToWatchlist={(id) => handleAddToWatchlist(id)}
                    onRemoveFromWatchlist={(id) => handleRemoveFromWatchlist(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-lg p-8 text-center">
                <p className="text-zinc-400">
                  No trending shows available at the moment.
                </p>
              </div>
            )}
          </section>
          
          {/* Critically Acclaimed */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Critically Acclaimed</h2>
            
            {loadingAcclaimed ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-zinc-900 rounded-lg overflow-hidden animate-pulse">
                    <div className="relative pb-[140%] bg-zinc-800"></div>
                    <div className="p-3">
                      <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : acclaimedShows?.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {acclaimedShows.map((show) => (
                  <ShowCard
                    key={show.id}
                    show={show}
                    inWatchlist={watchlistIds.has(show.id)}
                    onAddToWatchlist={(id) => handleAddToWatchlist(id)}
                    onRemoveFromWatchlist={(id) => handleRemoveFromWatchlist(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-lg p-8 text-center">
                <p className="text-zinc-400">
                  No acclaimed shows available at the moment.
                </p>
              </div>
            )}
          </section>
          
          {/* Genre Browse */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Browse by Genre</h2>
            
            {loadingGenres ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="rounded-lg overflow-hidden animate-pulse bg-zinc-800 h-28"></div>
                ))}
              </div>
            ) : genres?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {genres.map((genre) => (
                  <GenreCard
                    key={genre.id}
                    id={genre.id}
                    name={genre.name}
                    imageUrl={genre.imageUrl}
                    onClick={handleGenreClick}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-lg p-8 text-center">
                <p className="text-zinc-400">
                  No genres available at the moment.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
