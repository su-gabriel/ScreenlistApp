import { z } from "zod";
import { eq, and } from "drizzle-orm";
import {
  users, shows, streamingServices, genres, userStreamingServices, userGenres,
  watchHistory, watchlist, personalityInsights, userSettings,
  insertUserSettingsSchema,
  type User, type Show, type StreamingService, type Genre,
  type UserStreamingService, type UserGenre, type WatchHistory, type Watchlist,
  type PersonalityInsight, type UserSettings, type InsertUser,
  type InsertShow
} from "../shared/schema";
import connectPg from "connect-pg-simple";
import session from "express-session";
import pg from "pg";
import { IStorage } from "./storage";
import { db } from "./db";

const { Pool } = pg;

type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Create a PostgreSQL connection pool for the session store
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Initialize session store with PostgreSQL
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
    
    // Initialize streaming services if they don't exist
    this.initializeStreamingServices();
    
    // Initialize genres if they don't exist
    this.initializeGenres();
  }
  
  private async initializeStreamingServices() {
    const existingServices = await db.select().from(streamingServices);
    
    if (existingServices.length === 0) {
      const servicesToCreate = [
        { name: 'Netflix', logoUrl: 'https://example.com/netflix.png' },
        { name: 'Hulu', logoUrl: 'https://example.com/hulu.png' },
        { name: 'Disney+', logoUrl: 'https://example.com/disney.png' },
        { name: 'HBO Max', logoUrl: 'https://example.com/hbo.png' },
        { name: 'Amazon Prime', logoUrl: 'https://example.com/amazon.png' },
        { name: 'Apple TV+', logoUrl: 'https://example.com/apple.png' }
      ];
      
      await db.insert(streamingServices).values(servicesToCreate);
    }
  }
  
  private async initializeGenres() {
    const existingGenres = await db.select().from(genres);
    
    if (existingGenres.length === 0) {
      const genresToCreate = [
        { name: 'Action' },
        { name: 'Comedy' },
        { name: 'Drama' },
        { name: 'Fantasy' },
        { name: 'Horror' },
        { name: 'Mystery' },
        { name: 'Romance' },
        { name: 'Thriller' },
        { name: 'Science Fiction' },
        { name: 'Documentary' }
      ];
      
      await db.insert(genres).values(genresToCreate);
    }
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }
  
  async getStreamingServices(): Promise<StreamingService[]> {
    return await db.select().from(streamingServices);
  }
  
  async getStreamingService(id: number): Promise<StreamingService | undefined> {
    const [service] = await db
      .select()
      .from(streamingServices)
      .where(eq(streamingServices.id, id));
    
    return service || undefined;
  }
  
  async getUserStreamingServices(userId: number): Promise<StreamingService[]> {
    // Join user_streaming_services with streaming_services to get the service details
    const results = await db
      .select({
        id: streamingServices.id,
        name: streamingServices.name,
        logoUrl: streamingServices.logoUrl
      })
      .from(userStreamingServices)
      .innerJoin(
        streamingServices,
        eq(userStreamingServices.streamingServiceId, streamingServices.id)
      )
      .where(eq(userStreamingServices.userId, userId));
    
    return results;
  }
  
  async addUserStreamingService(userId: number, serviceId: number): Promise<UserStreamingService> {
    // Check if this user-service connection already exists
    const [existingEntry] = await db
      .select()
      .from(userStreamingServices)
      .where(
        and(
          eq(userStreamingServices.userId, userId),
          eq(userStreamingServices.streamingServiceId, serviceId)
        )
      );
    
    if (existingEntry) {
      return existingEntry;
    }
    
    // Create new connection
    const [userService] = await db
      .insert(userStreamingServices)
      .values({
        userId,
        streamingServiceId: serviceId
      })
      .returning();
    
    return userService;
  }
  
  async deleteUserStreamingServices(userId: number): Promise<void> {
    await db
      .delete(userStreamingServices)
      .where(eq(userStreamingServices.userId, userId));
  }
  
  async getGenres(): Promise<Genre[]> {
    return await db.select().from(genres);
  }
  
  async getGenre(id: number): Promise<Genre | undefined> {
    const [genre] = await db.select().from(genres).where(eq(genres.id, id));
    return genre || undefined;
  }
  
  async getUserGenres(userId: number): Promise<Genre[]> {
    // Join user_genres with genres to get the genre details
    const results = await db
      .select({
        id: genres.id,
        name: genres.name
      })
      .from(userGenres)
      .innerJoin(
        genres,
        eq(userGenres.genreId, genres.id)
      )
      .where(eq(userGenres.userId, userId));
    
    return results;
  }
  
  async addUserGenre(userId: number, genreId: number): Promise<UserGenre> {
    // Check if this user-genre connection already exists
    const [existingEntry] = await db
      .select()
      .from(userGenres)
      .where(
        and(
          eq(userGenres.userId, userId),
          eq(userGenres.genreId, genreId)
        )
      );
    
    if (existingEntry) {
      return existingEntry;
    }
    
    // Create new connection
    const [userGenre] = await db
      .insert(userGenres)
      .values({
        userId,
        genreId
      })
      .returning();
    
    return userGenre;
  }
  
  async deleteUserGenres(userId: number): Promise<void> {
    await db
      .delete(userGenres)
      .where(eq(userGenres.userId, userId));
  }
  
  async getShow(id: number): Promise<Show | undefined> {
    const [show] = await db.select().from(shows).where(eq(shows.id, id));
    return show || undefined;
  }
  
  async getShowByTitle(title: string): Promise<Show | undefined> {
    const [show] = await db.select().from(shows).where(eq(shows.title, title));
    return show || undefined;
  }
  
  async getShowByTMDbId(tmdbId: number): Promise<Show | undefined> {
    const [show] = await db.select().from(shows).where(eq(shows.tmdbId, tmdbId));
    return show || undefined;
  }
  
  async createShow(showData: InsertShow): Promise<Show> {
    const [show] = await db.insert(shows).values(showData).returning();
    return show;
  }
  
  async getUserWatchHistory(userId: number): Promise<Show[]> {
    // Join watch_history with shows to get the show details
    const results = await db
      .select({
        id: shows.id,
        tmdbId: shows.tmdbId,
        title: shows.title,
        posterUrl: shows.posterUrl,
        backdropUrl: shows.backdropUrl,
        overview: shows.overview,
        year: shows.year,
        rating: shows.rating,
        genreIds: shows.genreIds,
        streamingServiceId: shows.streamingServiceId
      })
      .from(watchHistory)
      .innerJoin(
        shows,
        eq(watchHistory.showId, shows.id)
      )
      .where(eq(watchHistory.userId, userId));
    
    return results;
  }
  
  async addToWatchHistory(userId: number, showId: number): Promise<WatchHistory> {
    // Check if this watch history entry already exists
    const [existingEntry] = await db
      .select()
      .from(watchHistory)
      .where(
        and(
          eq(watchHistory.userId, userId),
          eq(watchHistory.showId, showId)
        )
      );
    
    if (existingEntry) {
      return existingEntry;
    }
    
    // Create new entry
    console.log(`Adding to watch history: userId=${userId}, showId=${showId}`);
    
    const [historyItem] = await db
      .insert(watchHistory)
      .values({
        userId,
        showId
      })
      .returning();
    
    return historyItem;
  }
  
  async removeFromWatchHistory(userId: number, showId: number): Promise<void> {
    await db
      .delete(watchHistory)
      .where(
        and(
          eq(watchHistory.userId, userId),
          eq(watchHistory.showId, showId)
        )
      );
  }
  
  async getUserWatchlist(userId: number): Promise<Show[]> {
    // Join watchlist with shows to get the show details
    const results = await db
      .select({
        id: shows.id,
        tmdbId: shows.tmdbId,
        title: shows.title,
        posterUrl: shows.posterUrl,
        backdropUrl: shows.backdropUrl,
        overview: shows.overview,
        year: shows.year,
        rating: shows.rating,
        genreIds: shows.genreIds,
        streamingServiceId: shows.streamingServiceId
      })
      .from(watchlist)
      .innerJoin(
        shows,
        eq(watchlist.showId, shows.id)
      )
      .where(eq(watchlist.userId, userId));
    
    console.log(`Retrieved ${results.length} shows from user ${userId}'s watchlist`);
    return results;
  }
  
  async addToWatchlist(userId: number, showId: number): Promise<Watchlist> {
    // Check if this watchlist entry already exists
    const [existingEntry] = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.showId, showId)
        )
      );
    
    if (existingEntry) {
      return existingEntry;
    }
    
    // Create new entry
    console.log(`Adding to watchlist: userId=${userId}, showId=${showId}`);
    
    const [watchlistItem] = await db
      .insert(watchlist)
      .values({
        userId,
        showId
      })
      .returning();
    
    return watchlistItem;
  }
  
  async removeFromWatchlist(userId: number, showId: number): Promise<void> {
    await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.showId, showId)
        )
      );
  }
  
  async getUserInsights(userId: number): Promise<PersonalityInsight | undefined> {
    const [insight] = await db
      .select()
      .from(personalityInsights)
      .where(eq(personalityInsights.userId, userId));
    
    return insight || undefined;
  }
  
  async createOrUpdateInsights(userId: number, data: Partial<PersonalityInsight>): Promise<PersonalityInsight> {
    const existingInsight = await this.getUserInsights(userId);
    
    if (existingInsight) {
      // Update existing insight
      const [updatedInsight] = await db
        .update(personalityInsights)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(personalityInsights.userId, userId))
        .returning();
      
      return updatedInsight;
    } else {
      // Create new insight
      const [insight] = await db
        .insert(personalityInsights)
        .values({
          userId,
          viewerType: data.viewerType || null,
          characteristics: data.characteristics || [],
          themes: data.themes || [],
          updatedAt: new Date()
        })
        .returning();
      
      return insight;
    }
  }
  
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    
    return settings || undefined;
  }
  
  async createUserSettings(settingsData: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values({
        userId: settingsData.userId,
        emailNotifications: settingsData.emailNotifications ?? true,
        darkMode: settingsData.darkMode ?? true,
        shareData: settingsData.shareData ?? true
      })
      .returning();
    
    return settings;
  }
  
  async updateUserSettings(userId: number, data: Partial<UserSettings>): Promise<UserSettings> {
    const existingSettings = await this.getUserSettings(userId);
    
    if (!existingSettings) {
      return this.createUserSettings({ 
        userId, 
        ...data 
      } as InsertUserSettings);
    }
    
    // Update existing settings
    const [updatedSettings] = await db
      .update(userSettings)
      .set(data)
      .where(eq(userSettings.userId, userId))
      .returning();
    
    return updatedSettings;
  }
}