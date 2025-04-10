import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Check if user has completed onboarding
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["/api/user/profile"],
  });
  
  useEffect(() => {
    if (!isLoading) {
      if (userProfile?.hasCompletedOnboarding) {
        navigate("/");
      } else {
        navigate("/onboarding");
      }
    }
  }, [userProfile, isLoading, navigate]);
  
  return null; // This component just redirects
}
