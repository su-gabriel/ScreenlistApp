import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckIcon, CloudDownload, Download, Brain } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StreamingBadge } from "@/components/ui/streaming-badge";
import { GenreCheckbox } from "@/components/ui/genre-checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { streamingServices } from "@/components/icons/streaming-icons";

const genres = [
  { id: 1, name: "Drama" },
  { id: 2, name: "Comedy" },
  { id: 3, name: "Sci-Fi" },
  { id: 4, name: "Fantasy" },
  { id: 5, name: "Action" },
  { id: 6, name: "Horror" },
  { id: 7, name: "Thriller" },
  { id: 8, name: "Mystery" },
  { id: 9, name: "Documentary" }
];

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [watchHistory, setWatchHistory] = useState<{ id: number, title: string, genres: string[] }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const progress = Math.round((currentStep / totalSteps) * 100);
  
  const handleServiceToggle = (serviceId: number, selected: boolean) => {
    if (selected) {
      setSelectedServices([...selectedServices, serviceId]);
    } else {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    }
  };
  
  const handleGenreToggle = (genreId: number, checked: boolean) => {
    if (checked) {
      setSelectedGenres([...selectedGenres, genreId]);
    } else {
      setSelectedGenres(selectedGenres.filter(id => id !== genreId));
    }
  };
  
  const handleRemoveShow = (id: number) => {
    setWatchHistory(watchHistory.filter(show => show.id !== id));
  };
  
  const handleAddShow = () => {
    if (!searchQuery.trim()) return;
    
    // This would normally search an API, for now just add a mock show
    const newShow = {
      id: Date.now(),
      title: searchQuery,
      genres: selectedGenres.map(id => genres.find(g => g.id === id)?.name || "")
    };
    
    setWatchHistory([...watchHistory, newShow]);
    setSearchQuery("");
  };
  
  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleFinish = async () => {
    try {
      // Save streaming services
      await apiRequest("POST", "/api/user/streaming-services", {
        userId: user?.id,
        serviceIds: selectedServices
      });
      
      // Save genres
      await apiRequest("POST", "/api/user/genres", {
        userId: user?.id,
        genreIds: selectedGenres
      });
      
      // Save watch history
      if (watchHistory.length > 0) {
        await apiRequest("POST", "/api/user/watch-history", {
          userId: user?.id,
          shows: watchHistory
        });
      }
      
      // Create initial settings
      await apiRequest("POST", "/api/user/settings", {
        userId: user?.id,
        emailNotifications: true,
        darkMode: true,
        shareData: true
      });
      
      // Invalidate cached data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Setup complete!",
        description: "Your preferences have been saved. Enjoy Screenlist!",
      });
      
      // Navigate to dashboard
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Streaming Services";
      case 2: return "Genre Preferences";
      case 3: return "Watch History";
      case 4: return "Almost Done!";
      default: return "";
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-display text-amber-500 tracking-wide mb-2">SCREENLIST</h1>
          <p className="text-xl text-zinc-400">Your personal TV show companion</p>
        </div>
        
        {/* Onboarding Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-400">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-amber-500">
              {getStepTitle()}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-zinc-800" />
        </div>
        
        {/* Content Area */}
        <Card className="bg-zinc-900 shadow-[5px_5px_0px_rgba(183,28,28,0.6)] border-zinc-800">
          <CardContent className="p-6">
            {/* Step 1: Streaming Services */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white">Select your streaming services</h2>
                <p className="text-zinc-400 mb-6">
                  Choose the platforms you're subscribed to for personalized recommendations.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {streamingServices.map(service => (
                    <StreamingBadge
                      key={service.id}
                      service={service}
                      selected={selectedServices.includes(service.id)}
                      onSelect={handleServiceToggle}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Step 2: Genre Preferences */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white">Select your favorite genres</h2>
                <p className="text-zinc-400 mb-6">
                  What kind of shows do you enjoy watching?
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {genres.map(genre => (
                    <GenreCheckbox
                      key={genre.id}
                      id={genre.id}
                      name={genre.name}
                      checked={selectedGenres.includes(genre.id)}
                      onChange={handleGenreToggle}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Step 3: Watch History */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white">Add shows you've watched</h2>
                <p className="text-zinc-400 mb-6">
                  This helps us understand your taste and make better recommendations.
                </p>
                
                <div className="mb-4">
                  <div className="relative flex items-center">
                    <Input
                      type="text"
                      placeholder="Search for a show..."
                      className="w-full bg-zinc-950 text-white py-3 px-4 pr-10 rounded-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddShow();
                        }
                      }}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="absolute right-2"
                      onClick={handleAddShow}
                    >
                      <CheckIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                {watchHistory.length > 0 ? (
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                    {watchHistory.map(show => (
                      <div key={show.id} className="flex justify-between items-center bg-zinc-950 p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center">
                            <span className="text-lg">📺</span>
                          </div>
                          <div>
                            <h4 className="font-medium">{show.title}</h4>
                            <p className="text-xs text-zinc-400">
                              {show.genres.filter(Boolean).join(", ") || "No genres selected"}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveShow(show.id)}
                          className="text-zinc-400 hover:text-red-800"
                        >
                          <span className="sr-only">Remove</span>
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
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <p>No shows added yet. Search and add your favorite shows.</p>
                  </div>
                )}
                
                <p className="text-sm text-zinc-400 italic">
                  Or import your watch history from your streaming platforms.
                </p>
                <Button 
                  variant="link" 
                  className="mt-3 text-amber-500 hover:text-amber-400 p-0"
                >
                  <Download className="mr-1 h-4 w-4" /> Import Watch History
                </Button>
              </div>
            )}
            
            {/* Step 4: Finish & Preview */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white">Almost done!</h2>
                <p className="text-zinc-400 mb-6">
                  We've gathered enough to get you started. Here's a preview of what you'll get:
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-zinc-950 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Tv2 className="text-amber-500 mr-2 h-5 w-5" />
                      Personalized Recommendations
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Shows tailored to your selected genres and streaming services.
                    </p>
                  </div>
                  
                  <div className="bg-zinc-950 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Brain className="text-amber-500 mr-2 h-5 w-5" />
                      Personality Insights
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Discover what your watch history says about you.
                    </p>
                  </div>
                  
                  <div className="bg-zinc-950 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Bookmark className="text-amber-500 mr-2 h-5 w-5" />
                      Watch History Tracking
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Keep track of shows you've watched and want to watch.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 ? (
                <Button 
                  variant="outline" 
                  onClick={handlePrevStep}
                  className="bg-zinc-950 border-zinc-800"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
              ) : (
                <div></div> // Spacer
              )}
              
              {currentStep < totalSteps ? (
                <Button 
                  onClick={handleNextStep}
                  className="bg-indigo-900 hover:bg-indigo-800"
                >
                  Next <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleFinish}
                  className="bg-red-800 hover:bg-red-700"
                >
                  Get Started <CheckIcon className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Tv2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 21h10" />
      <rect width="20" height="14" x="2" y="3" rx="2" />
    </svg>
  );
}

// Using Brain component from lucide-react instead

function Bookmark(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}
