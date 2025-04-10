import { useState } from "react";
import { Link } from "wouter";
import { Star, Plus, Check, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { TMDbTVShow, getImageUrl } from "@/lib/tmdb-api";
import { Show } from "@shared/schema";

// For compatibility with our API responses or alternative data formats
export interface ShowCardData {
  id: number;
  title?: string;
  name?: string;
  posterUrl?: string | null;
  poster_path?: string | null;
  backdropUrl?: string | null;
  backdrop_path?: string | null;
  overview?: string | null;
  year?: string | null;
  first_air_date?: string;
  vote_average?: number | string;
  rating?: string | null;
  genres?: string[] | number[];
  genreIds?: number[] | null;
  primaryGenre?: string;
  inWatchlist?: boolean;
}

// Type guard to discriminate between our data types
function isShowCardData(show: ShowCardData | TMDbTVShow): show is ShowCardData {
  return (show as ShowCardData).title !== undefined || 
         (show as ShowCardData).posterUrl !== undefined || 
         (show as ShowCardData).rating !== undefined ||
         (show as ShowCardData).year !== undefined;
}

// Augment TMDbTVShow to include the inWatchlist property for runtime
interface TMDbTVShowWithWatchlist extends TMDbTVShow {
  inWatchlist?: boolean;
}

interface ShowCardProps {
  show: ShowCardData | TMDbTVShow | TMDbTVShowWithWatchlist | Show;
  inWatchlist?: boolean;
  onAddToWatchlist?: (showId: number) => void;
  onRemoveFromWatchlist?: (showId: number) => void;
  className?: string;
}

export function ShowCard({ 
  show, 
  inWatchlist, 
  onAddToWatchlist, 
  onRemoveFromWatchlist,
  className = ""
}: ShowCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Normalize show data for display
  const title = 'name' in show ? show.name : (('title' in show && show.title) ? show.title : "Unknown Title");
  
  // Handle poster image
  let posterUrl: string;
  if ('posterUrl' in show && show.posterUrl) {
    posterUrl = show.posterUrl;
  } else if ('poster_path' in show && show.poster_path) {
    posterUrl = getImageUrl(show.poster_path);
  } else {
    posterUrl = "/placeholder-poster.jpg";
  }
  
  // Handle overview
  const overview = 'overview' in show && show.overview ? show.overview : "No description available";
  
  // Handle rating
  let rating: number | string;
  if ('vote_average' in show && typeof show.vote_average === 'number') {
    rating = show.vote_average;
  } else if ('rating' in show && show.rating) {
    rating = show.rating;
  } else if ('vote_average' in show && typeof show.vote_average === 'string') {
    rating = parseFloat(show.vote_average);
  } else {
    rating = "N/A";
  }
  
  // Format year
  let year: string;
  if ('year' in show && show.year) {
    year = show.year;
  } else if ('first_air_date' in show && show.first_air_date) {
    year = show.first_air_date.substring(0, 4);
  } else {
    year = "Unknown";
  }
  
  // Get genres
  let genres: string[] = [];
  let primaryGenre: string | undefined;
  
  if ('genres' in show && Array.isArray(show.genres)) {
    // If we have a string array of genre names
    genres = show.genres.filter(g => typeof g === 'string') as string[];
  } else if ('genreIds' in show && Array.isArray(show.genreIds)) {
    // Placeholder for numeric genre IDs - these would need to be mapped to names
    genres = [];
  }
  
  if ('primaryGenre' in show && show.primaryGenre) {
    primaryGenre = show.primaryGenre;
  }
  
  const handleWatchlistToggle = () => {
    if (inWatchlist && onRemoveFromWatchlist) {
      onRemoveFromWatchlist(show.id);
    } else if (!inWatchlist && onAddToWatchlist) {
      onAddToWatchlist(show.id);
    }
  };
  
  return (
    <Card 
      className={`overflow-hidden group transition-all duration-300 h-full border-zinc-800 bg-zinc-900 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden aspect-[2/3]">
        <img 
          src={posterUrl} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Rating badge */}
        <div className="absolute top-2 left-2">
          <Badge className="bg-amber-600 hover:bg-amber-700 text-white">
            <Star className="w-3 h-3 mr-1 fill-current" /> 
            {typeof rating === 'number' ? rating.toFixed(1) : rating || "N/A"}
          </Badge>
        </div>
        
        {/* Hover overlay with buttons */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 flex flex-col justify-end transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <h3 className="font-semibold text-white text-lg mb-1 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-300 mb-3 line-clamp-2">{overview}</p>
          
          <div className="flex gap-2">
            <Link href={`/show/${show.id}`}>
              <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center">
                <Play className="w-4 h-4 mr-1" /> Details
              </Button>
            </Link>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={handleWatchlistToggle}
                    className={inWatchlist ? "bg-green-800 hover:bg-green-900" : ""}
                  >
                    {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* Card content for non-hover state */}
      <CardContent className="p-3">
        <div className="space-y-1">
          <h3 className="font-medium text-sm line-clamp-1">{title}</h3>
          <div className="flex flex-col space-y-1">
            <p className="text-xs text-gray-400">{year}</p>
            <div className="flex flex-wrap gap-1">
              {genres.length > 0 ? genres.map((genre, index) => (
                <Badge key={index} variant="outline" className="text-[9px] h-4 px-1 rounded-sm whitespace-nowrap">
                  {genre}
                </Badge>
              )) : primaryGenre && (
                <Badge variant="outline" className="text-[9px] h-4 px-1 rounded-sm">
                  {primaryGenre}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Grid component for displaying multiple shows
interface ShowGridProps {
  shows: (ShowCardData | TMDbTVShow | TMDbTVShowWithWatchlist | Show)[];
  watchlistItems?: number[];
  onAddToWatchlist?: (showId: number) => void;
  onRemoveFromWatchlist?: (showId: number) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function ShowGrid({ 
  shows, 
  watchlistItems = [], 
  onAddToWatchlist, 
  onRemoveFromWatchlist,
  emptyMessage = "No shows found",
  loading = false
}: ShowGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
        {[...Array(10)].map((_, i) => (
          <Card key={i} className="animate-pulse overflow-hidden h-full border-zinc-800 bg-zinc-900">
            <div className="bg-zinc-800 aspect-[2/3]"></div>
            <CardContent className="p-3">
              <div className="h-4 bg-zinc-800 rounded mb-2"></div>
              <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (shows.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
      {shows.map(show => {
        // Check if show has inWatchlist property or if it's in the watchlist items array
        const isInWatchlist = 
          ('inWatchlist' in show && show.inWatchlist === true) || 
          watchlistItems.includes(show.id);
          
        return (
          <ShowCard
            key={show.id}
            show={show}
            inWatchlist={isInWatchlist}
            onAddToWatchlist={onAddToWatchlist}
            onRemoveFromWatchlist={onRemoveFromWatchlist}
          />
        );
      })}
    </div>
  );
}