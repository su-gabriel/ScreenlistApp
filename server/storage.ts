import { users, streamingServices, genres, shows, userStreamingServices, userGenres, watchHistory, watchlist, personalityInsights, userSettings } from "@shared/schema";
import type { User, InsertUser, StreamingService, Genre, Show, InsertShow, UserStreamingService, UserGenre, WatchHistory, Watchlist, PersonalityInsight, UserSettings } from "@shared/schema";
import type { z } from "zod";
import { insertUserSettingsSchema } from "@shared/schema";

// Define type for InsertUserSettings
type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  
  // Streaming service methods
  getStreamingServices(): Promise<StreamingService[]>;
  getStreamingService(id: number): Promise<StreamingService | undefined>;
  getUserStreamingServices(userId: number): Promise<StreamingService[]>;
  addUserStreamingService(userId: number, serviceId: number): Promise<UserStreamingService>;
  deleteUserStreamingServices(userId: number): Promise<void>;
  
  // Genre methods
  getGenres(): Promise<Genre[]>;
  getGenre(id: number): Promise<Genre | undefined>;
  getUserGenres(userId: number): Promise<Genre[]>;
  addUserGenre(userId: number, genreId: number): Promise<UserGenre>;
  deleteUserGenres(userId: number): Promise<void>;
  
  // Show methods
  getShow(id: number): Promise<Show | undefined>;
  getShowByTitle(title: string): Promise<Show | undefined>;
  getShowByTMDbId(tmdbId: number): Promise<Show | undefined>;
  createShow(show: InsertShow): Promise<Show>;
  
  // Watch history methods
  getUserWatchHistory(userId: number): Promise<Show[]>;
  addToWatchHistory(userId: number, showId: number): Promise<WatchHistory>;
  removeFromWatchHistory(userId: number, showId: number): Promise<void>;
  
  // Watchlist methods
  getUserWatchlist(userId: number): Promise<Show[]>;
  addToWatchlist(userId: number, showId: number): Promise<Watchlist>;
  removeFromWatchlist(userId: number, showId: number): Promise<void>;
  
  // Personality insights methods
  getUserInsights(userId: number): Promise<PersonalityInsight | undefined>;
  createOrUpdateInsights(userId: number, data: Partial<PersonalityInsight>): Promise<PersonalityInsight>;
  
  // User settings methods
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: number, data: Partial<UserSettings>): Promise<UserSettings>;
  
  // Session store
  sessionStore: any; // Using any type since session.SessionStore is not accessible
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private streamingServicesMap: Map<number, StreamingService>;
  private genresMap: Map<number, Genre>;
  private showsMap: Map<number, Show>;
  private userStreamingServicesMap: Map<string, UserStreamingService>;
  private userGenresMap: Map<string, UserGenre>;
  private watchHistoryMap: Map<string, WatchHistory>;
  private watchlistMap: Map<string, Watchlist>;
  private insightsMap: Map<number, PersonalityInsight>;
  private userSettingsMap: Map<number, UserSettings>;
  
  private userIdCounter: number;
  private showIdCounter: number;
  private userStreamingServiceIdCounter: number;
  private userGenreIdCounter: number;
  private watchHistoryIdCounter: number;
  private watchlistIdCounter: number;
  private insightIdCounter: number;
  private settingsIdCounter: number;
  
  sessionStore: any; // Using any type since session.SessionStore is not accessible

  constructor() {
    this.usersMap = new Map();
    this.streamingServicesMap = new Map();
    this.genresMap = new Map();
    this.showsMap = new Map();
    this.userStreamingServicesMap = new Map();
    this.userGenresMap = new Map();
    this.watchHistoryMap = new Map();
    this.watchlistMap = new Map();
    this.insightsMap = new Map();
    this.userSettingsMap = new Map();
    
    this.userIdCounter = 1;
    this.showIdCounter = 1;
    this.userStreamingServiceIdCounter = 1;
    this.userGenreIdCounter = 1;
    this.watchHistoryIdCounter = 1;
    this.watchlistIdCounter = 1;
    this.insightIdCounter = 1;
    this.settingsIdCounter = 1;
    
    // Initialize with some streaming services
    [
      { id: 1, name: "Netflix", logoUrl: "" },
      { id: 2, name: "Hulu", logoUrl: "" },
      { id: 3, name: "Disney+", logoUrl: "" },
      { id: 4, name: "HBO Max", logoUrl: "" },
      { id: 5, name: "Prime Video", logoUrl: "" },
      { id: 6, name: "Apple TV+", logoUrl: "" }
    ].forEach(service => this.streamingServicesMap.set(service.id, service));
    
    // Initialize with some genres
    [
      { id: 1, name: "Drama" },
      { id: 2, name: "Comedy" },
      { id: 3, name: "Sci-Fi" },
      { id: 4, name: "Fantasy" },
      { id: 5, name: "Action" },
      { id: 6, name: "Horror" },
      { id: 7, name: "Thriller" },
      { id: 8, name: "Mystery" },
      { id: 9, name: "Documentary" }
    ].forEach(genre => this.genresMap.set(genre.id, genre));
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(user => user.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = {
      ...userData,
      id,
      fullName: userData.fullName || '',
      email: userData.email || '',
      avatarUrl: '',
      joinDate: new Date()
    };
    this.usersMap.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...data };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  // Streaming service methods
  async getStreamingServices(): Promise<StreamingService[]> {
    return Array.from(this.streamingServicesMap.values());
  }

  async getStreamingService(id: number): Promise<StreamingService | undefined> {
    return this.streamingServicesMap.get(id);
  }

  async getUserStreamingServices(userId: number): Promise<StreamingService[]> {
    const userServices = Array.from(this.userStreamingServicesMap.values())
      .filter(us => us.userId === userId);
    
    const services: StreamingService[] = [];
    for (const userService of userServices) {
      const service = await this.getStreamingService(userService.streamingServiceId);
      if (service) {
        services.push(service);
      }
    }
    
    return services;
  }

  async addUserStreamingService(userId: number, serviceId: number): Promise<UserStreamingService> {
    const id = this.userStreamingServiceIdCounter++;
    const userService: UserStreamingService = {
      id,
      userId,
      streamingServiceId: serviceId
    };
    
    const key = `${userId}-${serviceId}`;
    this.userStreamingServicesMap.set(key, userService);
    return userService;
  }
  
  async deleteUserStreamingServices(userId: number): Promise<void> {
    for (const [key, userService] of this.userStreamingServicesMap.entries()) {
      if (userService.userId === userId) {
        this.userStreamingServicesMap.delete(key);
      }
    }
  }

  // Genre methods
  async getGenres(): Promise<Genre[]> {
    return Array.from(this.genresMap.values());
  }

  async getGenre(id: number): Promise<Genre | undefined> {
    return this.genresMap.get(id);
  }

  async getUserGenres(userId: number): Promise<Genre[]> {
    const userGenres = Array.from(this.userGenresMap.values())
      .filter(ug => ug.userId === userId);
    
    const genres: Genre[] = [];
    for (const userGenre of userGenres) {
      const genre = await this.getGenre(userGenre.genreId);
      if (genre) {
        genres.push(genre);
      }
    }
    
    return genres;
  }

  async addUserGenre(userId: number, genreId: number): Promise<UserGenre> {
    const id = this.userGenreIdCounter++;
    const userGenre: UserGenre = {
      id,
      userId,
      genreId
    };
    
    const key = `${userId}-${genreId}`;
    this.userGenresMap.set(key, userGenre);
    return userGenre;
  }
  
  async deleteUserGenres(userId: number): Promise<void> {
    for (const [key, userGenre] of this.userGenresMap.entries()) {
      if (userGenre.userId === userId) {
        this.userGenresMap.delete(key);
      }
    }
  }

  // Show methods
  async getShow(id: number): Promise<Show | undefined> {
    return this.showsMap.get(id);
  }
  
  async getShowByTitle(title: string): Promise<Show | undefined> {
    return Array.from(this.showsMap.values()).find(
      show => show.title.toLowerCase() === title.toLowerCase()
    );
  }
  
  async getShowByTMDbId(tmdbId: number): Promise<Show | undefined> {
    return Array.from(this.showsMap.values()).find(
      show => show.tmdbId === tmdbId
    );
  }

  async createShow(showData: InsertShow): Promise<Show> {
    const id = this.showIdCounter++;
    
    // Ensure all properties are properly initialized
    const show: Show = {
      id,
      tmdbId: showData.tmdbId ?? null,
      title: showData.title,
      streamingServiceId: showData.streamingServiceId ?? null,
      posterUrl: showData.posterUrl ?? null,
      backdropUrl: showData.backdropUrl ?? null,
      overview: showData.overview ?? null,
      year: showData.year ?? null,
      rating: showData.rating ?? null,
      genreIds: showData.genreIds ?? null
    };
    
    this.showsMap.set(id, show);
    console.log(`Created show: ${show.title} with ID ${show.id}`);
    console.log(`Total shows in database: ${this.showsMap.size}`);
    return show;
  }

  // Watch history methods
  async getUserWatchHistory(userId: number): Promise<Show[]> {
    const userHistory = Array.from(this.watchHistoryMap.values())
      .filter(wh => wh.userId === userId);
    
    const shows: Show[] = [];
    for (const historyItem of userHistory) {
      const show = await this.getShow(historyItem.showId);
      if (show) {
        shows.push(show);
      }
    }
    
    return shows;
  }

  async addToWatchHistory(userId: number, showId: number): Promise<WatchHistory> {
    const id = this.watchHistoryIdCounter++;
    const historyItem: WatchHistory = {
      id,
      userId,
      showId,
      dateWatched: new Date()
    };
    
    const key = `${userId}-${showId}-${Date.now()}`;
    this.watchHistoryMap.set(key, historyItem);
    return historyItem;
  }
  
  async removeFromWatchHistory(userId: number, showId: number): Promise<void> {
    // Find all watch history entries for this user and show
    const entries = Array.from(this.watchHistoryMap.entries())
      .filter(([_, entry]) => entry.userId === userId && entry.showId === showId);
    
    // Remove them all
    for (const [key] of entries) {
      this.watchHistoryMap.delete(key);
    }
  }

  // Watchlist methods
  async getUserWatchlist(userId: number): Promise<Show[]> {
    console.log(`Getting watchlist for user ${userId}`);
    console.log(`Total watchlist items: ${this.watchlistMap.size}`);
    
    // Debug: Log all watchlist entries
    const allEntries = Array.from(this.watchlistMap.entries());
    console.log('All watchlist entries:', 
      allEntries.map(([key, item]) => ({ key, userId: item.userId, showId: item.showId }))
    );
    
    const userWatchlist = Array.from(this.watchlistMap.values())
      .filter(wl => wl.userId === userId);
    
    console.log(`Found ${userWatchlist.length} watchlist items for user ${userId}`);
    
    const shows: Show[] = [];
    for (const watchlistItem of userWatchlist) {
      console.log(`Looking for show with ID ${watchlistItem.showId}`);
      const show = await this.getShow(watchlistItem.showId);
      if (show) {
        console.log(`Found show: ${show.title}`);
        shows.push(show);
      } else {
        console.log(`Show with ID ${watchlistItem.showId} not found in database`);
      }
    }
    
    console.log(`Returning ${shows.length} shows for user's watchlist`);
    return shows;
  }

  async addToWatchlist(userId: number, showId: number): Promise<Watchlist> {
    // Check if already in watchlist
    const existing = Array.from(this.watchlistMap.values())
      .find(wl => wl.userId === userId && wl.showId === showId);
    
    if (existing) {
      return existing;
    }
    
    // Ensure the show exists in our database
    const show = await this.getShow(showId);
    if (!show) {
      throw new Error(`Show with id ${showId} not found`);
    }
    
    const id = this.watchlistIdCounter++;
    const watchlistItem: Watchlist = {
      id,
      userId,
      showId,
      dateAdded: new Date()
    };
    
    // We use a unique key for each watchlist item
    const key = `${userId}-${showId}`;
    this.watchlistMap.set(key, watchlistItem);
    
    console.log(`Added show ${showId} to user ${userId}'s watchlist`);
    console.log(`Current watchlist size: ${this.watchlistMap.size}`);
    
    return watchlistItem;
  }

  async removeFromWatchlist(userId: number, showId: number): Promise<void> {
    const key = `${userId}-${showId}`;
    this.watchlistMap.delete(key);
  }

  // Personality insights methods
  async getUserInsights(userId: number): Promise<PersonalityInsight | undefined> {
    return Array.from(this.insightsMap.values())
      .find(insight => insight.userId === userId);
  }

  async createOrUpdateInsights(userId: number, data: Partial<PersonalityInsight>): Promise<PersonalityInsight> {
    const existing = await this.getUserInsights(userId);
    
    if (existing) {
      const updated = { ...existing, ...data, updatedAt: new Date() };
      this.insightsMap.set(existing.id, updated);
      return updated;
    }
    
    const id = this.insightIdCounter++;
    const insight: PersonalityInsight = {
      id,
      userId,
      viewerType: data.viewerType || '',
      characteristics: data.characteristics || [],
      themes: data.themes || [],
      updatedAt: new Date()
    };
    
    this.insightsMap.set(id, insight);
    return insight;
  }

  // User settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return Array.from(this.userSettingsMap.values())
      .find(settings => settings.userId === userId);
  }

  async createUserSettings(settingsData: InsertUserSettings): Promise<UserSettings> {
    const id = this.settingsIdCounter++;
    // Ensure all properties are properly initialized
    const settings: UserSettings = {
      id,
      userId: settingsData.userId,
      emailNotifications: settingsData.emailNotifications ?? null,
      darkMode: settingsData.darkMode ?? null,
      shareData: settingsData.shareData ?? null
    };
    
    this.userSettingsMap.set(id, settings);
    return settings;
  }

  async updateUserSettings(userId: number, data: Partial<UserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    
    if (!existing) {
      throw new Error(`Settings for user ${userId} not found`);
    }
    
    const updated = { ...existing, ...data };
    this.userSettingsMap.set(existing.id, updated);
    return updated;
  }
}

import { DatabaseStorage } from "./database-storage";

// Switch from MemStorage to DatabaseStorage for persistence
export const storage = new DatabaseStorage();
