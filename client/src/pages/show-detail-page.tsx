import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Bookmark, BookmarkCheck, Star, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { getStreamingServiceIcon } from '@/components/icons/streaming-icons';
import { Show } from '@shared/schema';

export default function ShowDetailPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute('/show/:id');
  const showId = params?.id ? parseInt(params.id) : null;

  // Fetch show details
  const { data: show, isLoading } = useQuery({
    queryKey: [`/api/shows/${showId}`],
    queryFn: async () => {
      // If this isn't a proper show ID, return early
      if (!showId) return null;
      
      const res = await fetch(`/api/shows/${showId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch show details');
      }
      return res.json();
    },
    enabled: !!showId,
  });

  // Define show type for watchlist
  interface WatchlistShow {
    id: number;
    title: string;
    genres: string[];
    posterUrl: string;
    streamingService: string;
    rating: string;
    inWatchlist: boolean;
  }

  // Check if in watchlist
  const { data: watchlist = [] } = useQuery<Show[]>({
    queryKey: ['/api/watchlist'],
  });

  const isInWatchlist = watchlist.some((item) => item.id === showId);
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist);

  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/watchlist', { 
        userId: user?.id, 
        showId 
      });
    },
    onSuccess: () => {
      setInWatchlist(true);
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      toast({
        title: 'Added to watchlist',
        description: `${show?.title} has been added to your watchlist`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add to watchlist',
        variant: 'destructive',
      });
    },
  });

  // Remove from watchlist mutation
  const removeFromWatchlistMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/watchlist/${showId}`);
    },
    onSuccess: () => {
      setInWatchlist(false);
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      toast({
        title: 'Removed from watchlist',
        description: `${show?.title} has been removed from your watchlist`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove from watchlist',
        variant: 'destructive',
      });
    },
  });

  // Add to watch history mutation
  const addToWatchHistoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/user/watch-history', { 
        userId: user?.id, 
        shows: [{ 
          id: show?.id,
          title: show?.title,
          posterUrl: show?.posterUrl,
          backdropUrl: show?.backdropUrl,
          overview: show?.description,
          rating: show?.rating,
          year: show?.year,
          genreIds: show?.genres?.map(g => g.id),
          genres: show?.genres
        }] 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/watch-history'] });
      toast({
        title: 'Added to watch history',
        description: `${show?.title} has been added to your watch history`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add to watch history',
        variant: 'destructive',
      });
    },
  });

  const handleWatchlistToggle = () => {
    if (inWatchlist) {
      removeFromWatchlistMutation.mutate();
    } else {
      addToWatchlistMutation.mutate();
    }
  };

  const handleMarkAsWatched = () => {
    addToWatchHistoryMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="bg-zinc-800 w-32 h-8 mb-6 rounded"></div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="bg-zinc-800 w-full md:w-80 h-[450px] rounded"></div>
            <div className="flex-1">
              <div className="bg-zinc-800 w-3/4 h-10 rounded mb-4"></div>
              <div className="bg-zinc-800 w-1/4 h-6 rounded mb-6"></div>
              <div className="bg-zinc-800 w-full h-32 rounded mb-6"></div>
              <div className="space-y-3">
                <div className="bg-zinc-800 w-3/4 h-6 rounded"></div>
                <div className="bg-zinc-800 w-1/2 h-6 rounded"></div>
                <div className="bg-zinc-800 w-2/3 h-6 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Show Not Found</h1>
          <p className="text-zinc-400 mb-6">The show you're looking for doesn't exist or has been removed.</p>
          <Link href="/explore">
            <Button className="bg-indigo-900 hover:bg-indigo-800">
              Explore Shows
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/explore" className="inline-flex items-center text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Browse
      </Link>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="md:w-80 flex-shrink-0">
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
            <img 
              src={show.posterUrl || "https://placehold.co/300x450/1e1e1e/f5f5f5?text=No+Image"} 
              alt={show.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-zinc-900 to-transparent">
              <div className="flex items-center space-x-2">
                <span className="bg-zinc-800 text-xs px-2 py-1 rounded flex items-center">
                  {getStreamingServiceIcon(show.streamingService)} {show.streamingService}
                </span>
                <span className={`text-xs px-2 py-1 ${parseFloat(show.rating) >= 8.5 ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-950'} rounded flex items-center`}>
                  <Star className="w-3 h-3 mr-1" /> {show.rating}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <Button 
              className={`w-full ${inWatchlist ? 'bg-red-800 hover:bg-red-700' : 'bg-indigo-900 hover:bg-indigo-800'}`}
              onClick={handleWatchlistToggle}
            >
              {inWatchlist ? (
                <>
                  <BookmarkCheck className="w-4 h-4 mr-2" /> In Watchlist
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 mr-2" /> Add to Watchlist
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full border-zinc-700"
              onClick={handleMarkAsWatched}
            >
              <Clock className="w-4 h-4 mr-2" /> Mark as Watched
            </Button>
          </div>
        </div>
        
        {/* Show Details */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{show.title}</h1>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {show.genres.map((genre: string) => (
              <span key={genre} className="text-xs px-2 py-1 bg-zinc-900 rounded">
                {genre}
              </span>
            ))}
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Overview</h2>
            <p className="text-zinc-300 leading-relaxed">
              {show.description || 'No description available for this show.'}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Details</h2>
              <dl className="space-y-3">
                <div className="flex">
                  <dt className="w-32 text-zinc-400">Year:</dt>
                  <dd>{show.year || 'Unknown'}</dd>
                </div>
                <div className="flex">
                  <dt className="w-32 text-zinc-400">Episodes:</dt>
                  <dd>{show.episodes || 'Unknown'}</dd>
                </div>
                <div className="flex">
                  <dt className="w-32 text-zinc-400">Runtime:</dt>
                  <dd>{show.runtime ? `${show.runtime} min` : 'Unknown'}</dd>
                </div>
                <div className="flex">
                  <dt className="w-32 text-zinc-400">Creator:</dt>
                  <dd>{show.creator || 'Unknown'}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Cast</h2>
              <ul className="space-y-2">
                {show.cast ? (
                  show.cast.map((actor: {id: number, name: string, character: string, profileUrl: string | null}) => (
                    <li key={actor.id} className="text-zinc-300">{actor.name} {actor.character ? `as ${actor.character}` : ''}</li>
                  ))
                ) : (
                  <li className="text-zinc-400">Cast information not available</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}