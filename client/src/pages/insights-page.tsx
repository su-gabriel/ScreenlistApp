import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Share2, Film, BookmarkPlus, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { InsightCard, InsightSection, ThemeTag, ProgressBar } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Show } from "@shared/schema";

// Define TypeScript interfaces for our insights data
interface GenreBreakdown {
  name: string;
  percentage: number;
}

interface ViewingPatterns {
  averageEpisodesPerWeek: number;
  friendsAverageEpisodesPerWeek: number;
  allUsersAverageEpisodesPerWeek: number;
  
  completionRate: number;
  friendsCompletionRate: number;
  allUsersCompletionRate: number;
  
  diversityScore: number;
  friendsDiversityScore: number;
  allUsersDiversityScore: number;
  
  nightOwl: boolean;
  bingePercentage: number;
  friendsBingePercentage: number;
  allUsersBingePercentage: number;
}

interface CharacterType {
  type: string;
  icon: string;
  color: string;
  description: string;
}

interface DetailedInsights {
  viewerType: string;
  viewerDescription: string;
  themes: string[];
  relatedInterests: string[];
  genreBreakdown: GenreBreakdown[];
  viewingPatterns: ViewingPatterns;
  characterAffinity: CharacterType[];
  characterInsight: string;
}

export default function InsightsPage() {
  const { user } = useAuth();
  
  // Fetch user's watchlist and watch history
  const { data: watchlist = [], isLoading: loadingWatchlist } = useQuery<Show[]>({
    queryKey: ["/api/watchlist"],
  });
  
  const { data: watchHistory = [], isLoading: loadingWatchHistory } = useQuery<Show[]>({
    queryKey: ["/api/user/watch-history"],
  });
  
  // Calculate total shows the user has interacted with
  const totalShows = watchlist.length + watchHistory.length;
  const hasEnoughShows = totalShows >= 5;
  
  // Only fetch insights if user has enough shows
  const { data: insights, isLoading: loadingInsights } = useQuery<DetailedInsights>({
    queryKey: ["/api/insights/detailed"],
    enabled: hasEnoughShows,
  });
  
  const isLoading = loadingWatchlist || loadingWatchHistory || (hasEnoughShows && loadingInsights);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">Personality Insights</h1>
          <p className="text-zinc-400">Discovering what your watch history reveals about you...</p>
        </div>
        
        <div className="animate-pulse space-y-8">
          <div className="bg-zinc-900 rounded-lg h-60"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 rounded-lg h-80"></div>
            <div className="bg-zinc-900 rounded-lg h-80"></div>
          </div>
          <div className="bg-zinc-900 rounded-lg h-60"></div>
        </div>
      </div>
    );
  }
  
  if (!hasEnoughShows) {
    const remainingShows = 5 - totalShows;
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">Personality Insights</h1>
          <p className="text-zinc-400">Discover what your watch history reveals about you.</p>
        </div>
        
        <div className="bg-zinc-900 rounded-lg p-8 text-center mb-8">
          <h2 className="text-xl font-bold mb-4">Unlock Your Viewing Personality</h2>
          <p className="text-zinc-400 mb-6">
            To generate personalized insights, add at least 5 shows to your watchlist or watch history.
          </p>
          
          <div className="mb-6 max-w-md mx-auto">
            <div className="flex justify-between text-sm mb-2">
              <span>Shows Added</span>
              <span>{totalShows} of 5</span>
            </div>
            <Progress value={(totalShows / 5) * 100} className="h-2" />
          </div>
          
          <p className="text-zinc-400 mb-6">
            Add {remainingShows} more {remainingShows === 1 ? 'show' : 'shows'} to unlock your viewing personality.
          </p>
          
          <Link href="/explore">
            <Button className="mt-4 bg-indigo-900 hover:bg-indigo-800">
              <Plus className="h-4 w-4 mr-2" /> Discover Shows
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-zinc-900">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <BookmarkPlus className="h-5 w-5 text-indigo-400 mr-2" />
                <h3 className="text-lg font-bold">Your Watchlist</h3>
              </div>
              <p className="text-zinc-400 mb-4">
                {watchlist.length === 0 
                  ? "You haven't added any shows to your watchlist yet." 
                  : `You have ${watchlist.length} show${watchlist.length === 1 ? '' : 's'} in your watchlist.`}
              </p>
              <Link href="/profile">
                <Button variant="outline" size="sm">View Watchlist</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Film className="h-5 w-5 text-indigo-400 mr-2" />
                <h3 className="text-lg font-bold">Your Watch History</h3>
              </div>
              <p className="text-zinc-400 mb-4">
                {watchHistory.length === 0 
                  ? "You haven't added any shows to your watch history yet." 
                  : `You have watched ${watchHistory.length} show${watchHistory.length === 1 ? '' : 's'}.`}
              </p>
              <Link href="/profile">
                <Button variant="outline" size="sm">View History</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!insights) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">Personality Insights</h1>
          <p className="text-zinc-400">Discover what your watch history reveals about you.</p>
        </div>
        
        <div className="bg-zinc-900 rounded-lg p-8 text-center">
          <p className="text-zinc-400">
            We're preparing your personalized insights. Please check back soon!
          </p>
          <Link href="/explore">
            <Button className="mt-4 bg-indigo-900 hover:bg-indigo-800">
              Discover More Shows
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Personality Insights</h1>
        <p className="text-zinc-400">Discover what your watch history reveals about you.</p>
      </div>
      
      {/* Primary Insight */}
      <InsightSection title="Your Viewing Personality">
        <div className="bg-zinc-900 rounded-lg p-6 md:p-8 shadow-[5px_5px_0px_rgba(183,28,28,0.6)]">
          <h2 className="text-2xl font-bold mb-2 text-amber-500">Your Viewing Personality</h2>
          <h3 className="text-xl mb-4">You're a <span className="font-bold">{insights.viewerType}</span></h3>
          
          <p className="text-zinc-400 mb-6">{insights.viewerDescription}</p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="font-medium mb-2 text-white">Themes You Connect With</h4>
              <div className="flex flex-wrap gap-2">
                {insights.themes.map((theme, index) => (
                  <ThemeTag key={index}>{theme}</ThemeTag>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 text-white">You Might Also Enjoy</h4>
              <div className="flex flex-wrap gap-2">
                {insights.relatedInterests.map((interest, index) => (
                  <ThemeTag key={index}>{interest}</ThemeTag>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button className="bg-indigo-900 hover:bg-indigo-800">
              <Share2 className="mr-2 h-4 w-4" /> Share My Viewing Personality
            </Button>
          </div>
        </div>
      </InsightSection>
      
      {/* Viewing Habits Visualization */}
      <InsightSection title="Your Viewing Habits">
        <div className="grid md:grid-cols-2 gap-6">
          <InsightCard title="Genre Breakdown">
            <div className="space-y-4">
              {insights.genreBreakdown.map((genre) => (
                <ProgressBar 
                  key={genre.name}
                  label={genre.name}
                  value={genre.percentage}
                />
              ))}
            </div>
          </InsightCard>
          
          <InsightCard title="How You Compare">
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Weekly Episodes Watched</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>You</span>
                      <span>{insights.viewingPatterns.averageEpisodesPerWeek} episodes</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600" 
                        style={{ width: `${(insights.viewingPatterns.averageEpisodesPerWeek / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Your Friends</span>
                      <span>{insights.viewingPatterns.friendsAverageEpisodesPerWeek} episodes</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500" 
                        style={{ width: `${(insights.viewingPatterns.friendsAverageEpisodesPerWeek / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>All Users</span>
                      <span>{insights.viewingPatterns.allUsersAverageEpisodesPerWeek} episodes</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-zinc-500" 
                        style={{ width: `${(insights.viewingPatterns.allUsersAverageEpisodesPerWeek / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Show Completion Rate</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>You</span>
                      <span>{insights.viewingPatterns.completionRate}%</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600" 
                        style={{ width: `${insights.viewingPatterns.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Your Friends</span>
                      <span>{insights.viewingPatterns.friendsCompletionRate}%</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500" 
                        style={{ width: `${insights.viewingPatterns.friendsCompletionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>All Users</span>
                      <span>{insights.viewingPatterns.allUsersCompletionRate}%</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-zinc-500" 
                        style={{ width: `${insights.viewingPatterns.allUsersCompletionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Binge Watching Tendency</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>You</span>
                      <span>{insights.viewingPatterns.bingePercentage}%</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600" 
                        style={{ width: `${insights.viewingPatterns.bingePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Your Friends</span>
                      <span>{insights.viewingPatterns.friendsBingePercentage}%</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500" 
                        style={{ width: `${insights.viewingPatterns.friendsBingePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>All Users</span>
                      <span>{insights.viewingPatterns.allUsersBingePercentage}%</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-zinc-500" 
                        style={{ width: `${insights.viewingPatterns.allUsersBingePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-950 p-3 rounded-md">
                <p className="text-sm text-zinc-400">
                  {insights.viewingPatterns.nightOwl 
                    ? "You're a Night Owl! You tend to watch shows later in the evening compared to most users." 
                    : "You're an Early Bird! You tend to watch shows earlier in the day compared to most users."}
                </p>
              </div>
            </div>
          </InsightCard>
        </div>
      </InsightSection>
      
      {/* Character Affinity */}
      <InsightSection title="Character Type Affinity">
        <div className="bg-zinc-900 rounded-lg p-6 shadow-[5px_5px_0px_rgba(183,28,28,0.6)]">
          <p className="text-zinc-400 mb-6">Based on your watch history, you tend to connect with these character types:</p>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {insights.characterAffinity.map((character) => (
              <div key={character.type} className="bg-zinc-950 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: character.color }}
                  >
                    <span className="text-lg">{character.icon}</span>
                  </div>
                  <h3 className="font-medium">{character.type}</h3>
                </div>
                <p className="text-sm text-zinc-400">{character.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-zinc-950 rounded-lg border-l-4 border-amber-500">
            <h4 className="font-medium mb-2">What This Means</h4>
            <p className="text-sm text-zinc-400">{insights.characterInsight}</p>
          </div>
        </div>
      </InsightSection>
    </div>
  );
}
