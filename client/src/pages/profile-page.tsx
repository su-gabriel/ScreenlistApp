import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit, LogOut, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StreamingBadge } from "@/components/ui/streaming-badge";
import { streamingServices } from "@/components/icons/streaming-icons";
import { ShowCard } from "@/components/ui/show-card";
import { Link } from "wouter";
import { Show } from "@shared/schema";

// Component to display the user's watchlist
function WatchlistSection() {
  const { toast } = useToast();
  
  // Fetch watchlist
  const { data: watchlist = [], isLoading, refetch } = useQuery<Show[]>({
    queryKey: ["/api/watchlist"],
  });
  
  // Remove from watchlist mutation
  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (showId: number) => {
      return await apiRequest("DELETE", `/api/watchlist/${showId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      refetch();
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
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-zinc-950 rounded-lg overflow-hidden animate-pulse">
            <div className="relative pb-[140%] bg-zinc-800"></div>
            <div className="p-3">
              <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (watchlist.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-zinc-400">Your watchlist is empty.</p>
        <Link href="/explore">
          <Button className="mt-4 bg-indigo-900 hover:bg-indigo-800">Explore Shows</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {watchlist.map((show) => (
        <ShowCard
          key={show.id}
          show={show}
          inWatchlist={true}
          onRemoveFromWatchlist={(id) => removeFromWatchlistMutation.mutate(id)}
        />
      ))}
    </div>
  );
}

// Component to display the user's watch history
function WatchHistorySection() {
  const { toast } = useToast();
  
  // Fetch watch history
  const { data: watchHistory = [], isLoading, refetch } = useQuery<Show[]>({
    queryKey: ["/api/user/watch-history"],
  });
  
  // Remove from watch history mutation
  const removeFromHistoryMutation = useMutation({
    mutationFn: async (showId: number) => {
      console.log(`Removing show ${showId} from watch history`);
      return await apiRequest("DELETE", `/api/user/watch-history/${showId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/watch-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      refetch();
      toast({
        title: "Removed from watch history",
        description: "Show has been removed from your watch history",
      });
    },
    onError: (error: Error) => {
      console.error("Failed to remove from watch history:", error);
      toast({
        title: "Failed to remove from watch history",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-zinc-950 rounded-lg overflow-hidden animate-pulse">
            <div className="relative pb-[140%] bg-zinc-800"></div>
            <div className="p-3">
              <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (watchHistory.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-zinc-400">Your watch history is empty.</p>
        <Link href="/explore">
          <Button className="mt-4 bg-indigo-900 hover:bg-indigo-800">Discover Shows</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {watchHistory.map((show) => {
        // Format the show data for the card
        const cardData = {
          id: show.id,
          title: show.title,
          posterUrl: show.posterUrl,
          rating: show.rating || "N/A",
          year: show.year || "Unknown",
          genres: [], // We'll need to fetch genres separately if needed
          description: show.overview
        };
        
        return (
          <div key={show.id} className="relative group">
            <ShowCard
              key={show.id}
              show={cardData}
              onAddToWatchlist={undefined}
              onRemoveFromWatchlist={undefined}
            />
            <button
              onClick={() => removeFromHistoryMutation.mutate(show.id)}
              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove from history"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  
  // Define data interfaces
  interface ProfileData {
    watchedCount: number;
    watchlistCount: number;
    recommendationCount: number;
    joinDate: string;
  }
  
  interface UserService {
    id: number;
    name: string;
  }
  
  interface UserGenre {
    id: number;
    name: string;
  }
  
  interface UserSettings {
    emailNotifications: boolean;
    darkMode: boolean;
    shareData: boolean;
  }

  // Fetch user's complete profile data
  const { data: profile, isLoading: loadingProfile } = useQuery<ProfileData>({
    queryKey: ["/api/user/profile"],
  });
  
  // Fetch user's streaming services
  const { data: userServices, isLoading: loadingServices } = useQuery<UserService[]>({
    queryKey: ["/api/user/streaming-services"],
  });
  
  // Fetch user's genre preferences
  const { data: userGenres, isLoading: loadingGenres } = useQuery<UserGenre[]>({
    queryKey: ["/api/user/genres"],
  });
  
  // Fetch user's watchlist
  const { data: watchlist = [], isLoading: loadingWatchlist } = useQuery<Show[]>({
    queryKey: ["/api/watchlist"],
  });
  
  // Fetch user's watch history
  const { data: watchHistory = [], isLoading: loadingWatchHistory } = useQuery<Show[]>({
    queryKey: ["/api/user/watch-history"],
  });
  
  // Fetch user settings
  const { data: settings, isLoading: loadingSettings } = useQuery<UserSettings>({
    queryKey: ["/api/user/settings"],
  });
  
  // State for edit modes
  const [editingServices, setEditingServices] = useState(false);
  const [editingGenres, setEditingGenres] = useState(false);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  
  // Initialize selected services when data loads - using useEffect to prevent infinite renders
  React.useEffect(() => {
    if (userServices && selectedServices.length === 0) {
      setSelectedServices(userServices.map(service => service.id));
    }
  }, [userServices, selectedServices.length]);
  
  // Mutations for updating settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return apiRequest("PATCH", "/api/user/settings", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    },
  });
  
  const updateStreamingServicesMutation = useMutation({
    mutationFn: async (serviceIds: number[]) => {
      return apiRequest("POST", "/api/user/streaming-services", {
        userId: user?.id,
        serviceIds
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/streaming-services"] });
      toast({
        title: "Streaming services updated",
        description: "Your streaming service preferences have been saved.",
      });
      setEditingServices(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update streaming services.",
        variant: "destructive",
      });
    },
  });
  
  const handleServiceToggle = (serviceId: number, selected: boolean) => {
    if (selected) {
      setSelectedServices([...selectedServices, serviceId]);
    } else {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    }
  };
  
  const handleSaveServices = () => {
    updateStreamingServicesMutation.mutate(selectedServices);
  };
  
  const handleSettingChange = (key: string, value: boolean) => {
    if (!settings) return;
    
    updateSettingsMutation.mutate({
      ...settings,
      [key]: value
    });
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  if (loadingProfile || loadingServices || loadingGenres || loadingSettings || loadingWatchlist || loadingWatchHistory) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-zinc-400">Loading your profile information...</p>
        </div>
        
        <div className="animate-pulse space-y-8">
          <div className="bg-zinc-900 rounded-lg h-40"></div>
          <div className="bg-zinc-900 rounded-lg h-60"></div>
          <div className="bg-zinc-900 rounded-lg h-40"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-zinc-400">Manage your account, preferences, and watch history.</p>
      </div>
      
      {/* Profile Info */}
      <section className="mb-12">
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                  <Avatar className="h-24 w-24 border-2 border-indigo-900">
                    <AvatarImage src={user?.avatarUrl || ""} alt={user?.fullName || user?.username} />
                    <AvatarFallback className="text-2xl bg-indigo-900">
                      {(user?.fullName || user?.username || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user?.fullName || user?.username}</h2>
                  <p className="text-zinc-400">{user?.email}</p>
                  <p className="text-sm mt-1">
                    Member since {
                      profile?.joinDate 
                        ? new Date(profile.joinDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })
                        : 'N/A'
                    }
                  </p>
                  
                  <div className="mt-4 flex items-center space-x-2">
                    <Button className="bg-indigo-900 hover:bg-indigo-800">
                      Edit Profile
                    </Button>
                    <Button variant="outline" className="border-zinc-700">
                      Change Photo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-zinc-800 p-6 md:p-8">
              <h3 className="text-xl font-medium mb-4">Account Stats</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-950 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-500">{profile?.watchedCount || 0}</div>
                  <div className="text-sm text-zinc-400">Shows Watched</div>
                </div>
                
                <div className="bg-zinc-950 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-500">{watchlist?.length || 0}</div>
                  <div className="text-sm text-zinc-400">Watchlist</div>
                </div>
                
                <div className="bg-zinc-950 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-500">{profile?.recommendationCount || 0}</div>
                  <div className="text-sm text-zinc-400">Recommendations</div>
                </div>
                
                <div className="bg-zinc-950 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-500">{userServices?.length || 0}</div>
                  <div className="text-sm text-zinc-400">Platforms</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Streaming Services */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your Streaming Services</h2>
          {!editingServices ? (
            <Button 
              variant="ghost" 
              onClick={() => setEditingServices(true)}
              className="text-amber-500 hover:text-amber-400"
            >
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          ) : (
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingServices(false)}
                className="border-zinc-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveServices}
                className="bg-indigo-900 hover:bg-indigo-800"
                disabled={updateStreamingServicesMutation.isPending}
              >
                Save
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {streamingServices.map(service => (
            <StreamingBadge
              key={service.id}
              service={service}
              selected={
                editingServices 
                  ? selectedServices.includes(service.id)
                  : userServices?.some(s => s.id === service.id) || false
              }
              onSelect={editingServices ? handleServiceToggle : undefined}
              disabled={!editingServices}
            />
          ))}
        </div>
      </section>
      
      {/* Watchlist */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your Watchlist</h2>
        </div>
        
        <div className="bg-zinc-900 border-zinc-800 rounded-lg overflow-hidden p-6">
          {/* Fetch and display watchlist items */}
          <WatchlistSection />
        </div>
      </section>
      
      {/* Watch History */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your Watch History</h2>
        </div>
        
        <div className="bg-zinc-900 border-zinc-800 rounded-lg overflow-hidden p-6">
          {/* Fetch and display watch history items */}
          <WatchHistorySection />
        </div>
      </section>
      
      {/* Genre Preferences */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Genre Preferences</h2>
          <Button 
            variant="ghost" 
            onClick={() => setEditingGenres(true)}
            className="text-amber-500 hover:text-amber-400"
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {userGenres?.map(genre => (
            <div 
              key={genre.id}
              className="px-4 py-2 bg-indigo-900 text-white rounded-lg flex items-center justify-between"
            >
              <span>{genre.name}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </div>
          ))}
        </div>
      </section>
      
      {/* Settings */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Settings</h2>
        
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden divide-y divide-zinc-800">
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Email Notifications</Label>
                <p className="text-sm text-zinc-400">Receive updates about new recommendations</p>
              </div>
              <Switch 
                checked={settings?.emailNotifications} 
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-zinc-400">Always use dark theme</p>
              </div>
              <Switch 
                checked={settings?.darkMode} 
                onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
              />
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Data Privacy</Label>
                <p className="text-sm text-zinc-400">Allow data collection for better recommendations</p>
              </div>
              <Switch 
                checked={settings?.shareData} 
                onCheckedChange={(checked) => handleSettingChange('shareData', checked)}
              />
            </div>
            
            <div className="p-4">
              <Button 
                variant="ghost" 
                className="text-red-500 hover:text-red-400"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-1" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
