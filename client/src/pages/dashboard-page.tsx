import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Brain, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ShowCard, ShowGrid, ShowCardData } from "@/components/ui/show-card";
import { InsightCard } from "@/components/ui/insight-card";
import { TMDbTVShow } from "@/lib/tmdb-api";
import { Show } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch trending shows
  const { data: trendingShows, isLoading: loadingTrending } = useQuery<ShowCardData[]>({
    queryKey: ["/api/shows/trending"],
  });

  // Fetch acclaimed shows
  const { data: acclaimedShows, isLoading: loadingAcclaimed } = useQuery<ShowCardData[]>({
    queryKey: ["/api/shows/acclaimed"],
  });
  
  // Fetch recommendations
  const { data: recommendations, isLoading: loadingRecommendations } = useQuery<ShowCardData[]>({
    queryKey: ["/api/recommendations"],
  });
  
  // Fetch watchlist
  const { data: watchlist, isLoading: loadingWatchlist } = useQuery<Show[]>({
    queryKey: ["/api/watchlist"],
  });
  
  // Fetch insights
  const { data: insights, isLoading: loadingInsights } = useQuery<{
    viewerType: string;
    viewerDescription: string;
    characterDrivenPercentage: number;
    preferredShowTypes: string;
    themes: string[];
    themeDescription: string;
  }>({
    queryKey: ["/api/insights"],
  });
  
  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async (showId: number) => {
      return await apiRequest("POST", "/api/watchlist", {
        userId: user?.id,
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
  
  // Handler functions for adding/removing from watchlist
  const handleAddToWatchlist = (showId: number) => {
    addToWatchlistMutation.mutate(showId);
  };
  
  const handleRemoveFromWatchlist = (showId: number) => {
    removeFromWatchlistMutation.mutate(showId);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Your Dashboard</h1>
        <p className="text-zinc-400">Welcome back, {user?.fullName || user?.username}! Here's what we found for you.</p>
      </div>
      
      {/* Trending Shows Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Trending Now</h2>
          <Link href="/explore">
            <Button variant="link" className="text-amber-500 hover:text-amber-400 p-0">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <ShowGrid 
          shows={trendingShows || []}
          loading={loadingTrending}
          emptyMessage="Unable to load trending shows at this time."
          watchlistItems={watchlist?.map(show => show.id) || []}
          onAddToWatchlist={handleAddToWatchlist}
          onRemoveFromWatchlist={handleRemoveFromWatchlist}
        />
      </section>

      {/* Top Rated Shows Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Critically Acclaimed</h2>
          <Link href="/explore">
            <Button variant="link" className="text-amber-500 hover:text-amber-400 p-0">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <ShowGrid 
          shows={acclaimedShows || []}
          loading={loadingAcclaimed}
          emptyMessage="Unable to load acclaimed shows at this time."
          watchlistItems={watchlist?.map(show => show.id) || []}
          onAddToWatchlist={handleAddToWatchlist}
          onRemoveFromWatchlist={handleRemoveFromWatchlist}
        />
      </section>
      
      {/* Recommendations Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recommended for You</h2>
          <Link href="/explore">
            <Button variant="link" className="text-amber-500 hover:text-amber-400 p-0">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        {loadingRecommendations ? (
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
        ) : recommendations?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommendations.slice(0, 4).map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                inWatchlist={show.inWatchlist}
                onAddToWatchlist={() => handleAddToWatchlist(show.id)}
                onRemoveFromWatchlist={() => handleRemoveFromWatchlist(show.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-lg p-8 text-center">
            <p className="text-zinc-400">
              No recommendations yet. Update your preferences or add more shows to your watch history.
            </p>
            <Link href="/profile">
              <Button className="mt-4 bg-indigo-900 hover:bg-indigo-800">
                Update Preferences
              </Button>
            </Link>
          </div>
        )}
      </section>
      
      {/* Personality Insights Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Personality Insights</h2>
        
        {loadingInsights ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-zinc-800 rounded w-full mb-4"></div>
                <div className="h-10 bg-zinc-800 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : insights ? (
          <div className="grid md:grid-cols-2 gap-6">
            <InsightCard title="Viewer Type" icon={<Brain className="h-5 w-5" />}>
              <p className="text-zinc-400 mb-4">
                Based on your watch history, you're a <span className="text-white font-medium">{insights.viewerType}</span>.
              </p>
              <p className="text-sm">
                {insights.viewerDescription}
              </p>
              
              <div className="mt-6">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Plot-driven</span>
                  <span>Character-driven</span>
                </div>
                <div className="bg-zinc-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-2" style={{ width: `${insights.characterDrivenPercentage}%` }}></div>
                </div>
              </div>
            </InsightCard>
            
            <InsightCard title="Viewing Habits">
              <p className="text-zinc-400 mb-4">
                You tend to watch <span className="text-white font-medium">{insights.preferredShowTypes}</span> with themes of:
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {insights.themes.map((theme, index) => (
                  <span key={index} className="text-xs px-2 py-1 bg-zinc-950 rounded">
                    {theme}
                  </span>
                ))}
              </div>
              
              <p className="text-sm">
                {insights.themeDescription}
              </p>
            </InsightCard>
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-lg p-8 text-center">
            <p className="text-zinc-400">
              Watch more shows to get personality insights based on your viewing habits.
            </p>
            <Link href="/explore">
              <Button className="mt-4 bg-indigo-900 hover:bg-indigo-800">
                Discover Shows
              </Button>
            </Link>
          </div>
        )}
      </section>
      
      {/* Watchlist Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your Watchlist</h2>
          <Link href="/profile">
            <Button variant="link" className="text-amber-500 hover:text-amber-400 p-0">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        {loadingWatchlist ? (
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
        ) : watchlist?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {watchlist.slice(0, 4).map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                inWatchlist={true}
                onRemoveFromWatchlist={() => handleRemoveFromWatchlist(show.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-lg p-8 text-center">
            <p className="text-zinc-400">
              Your watchlist is empty. Browse shows and add them to your watchlist.
            </p>
            <Link href="/explore">
              <Button className="mt-4 bg-indigo-900 hover:bg-indigo-800">
                Browse Shows
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
