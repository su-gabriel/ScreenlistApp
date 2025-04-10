import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  joinDate: timestamp("join_date").defaultNow(),
});

export const streamingServices = pgTable("streaming_services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  logoUrl: text("logo_url"),
});

export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  tmdbId: integer("tmdb_id"), // Store the TMDb ID for easy lookup
  title: text("title").notNull(),
  posterUrl: text("poster_url"),
  backdropUrl: text("backdrop_url"),
  overview: text("overview"),
  year: text("year"),
  rating: text("rating"),
  genreIds: integer("genre_ids").array(),
  streamingServiceId: integer("streaming_service_id").references(() => streamingServices.id),
});

export const userStreamingServices = pgTable("user_streaming_services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  streamingServiceId: integer("streaming_service_id").references(() => streamingServices.id).notNull(),
});

export const userGenres = pgTable("user_genres", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  genreId: integer("genre_id").references(() => genres.id).notNull(),
});

export const watchHistory = pgTable("watch_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  showId: integer("show_id").references(() => shows.id).notNull(),
  dateWatched: timestamp("date_watched").defaultNow(),
});

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  showId: integer("show_id").references(() => shows.id).notNull(),
  dateAdded: timestamp("date_added").defaultNow(),
});

export const personalityInsights = pgTable("personality_insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  viewerType: text("viewer_type"),
  characteristics: json("characteristics").$type<string[]>(),
  themes: json("themes").$type<string[]>(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  emailNotifications: boolean("email_notifications").default(true),
  darkMode: boolean("dark_mode").default(true),
  shareData: boolean("share_data").default(true),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
}).transform((data) => ({
  ...data,
  // Ensure these fields are always strings, never null
  fullName: data.fullName || "",
  email: data.email || "",
}));

export const insertStreamingServiceSchema = createInsertSchema(streamingServices);
export const insertGenreSchema = createInsertSchema(genres);
export const insertShowSchema = createInsertSchema(shows);
export const insertUserStreamingServiceSchema = createInsertSchema(userStreamingServices);
export const insertUserGenreSchema = createInsertSchema(userGenres);
export const insertWatchHistorySchema = createInsertSchema(watchHistory);
export const insertWatchlistSchema = createInsertSchema(watchlist);
export const insertPersonalityInsightSchema = createInsertSchema(personalityInsights);
export const insertUserSettingsSchema = createInsertSchema(userSettings);

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertShow = z.infer<typeof insertShowSchema>;
export type User = typeof users.$inferSelect;
export type StreamingService = typeof streamingServices.$inferSelect;
export type Genre = typeof genres.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type UserStreamingService = typeof userStreamingServices.$inferSelect;
export type UserGenre = typeof userGenres.$inferSelect;
export type WatchHistory = typeof watchHistory.$inferSelect;
export type Watchlist = typeof watchlist.$inferSelect;
export type PersonalityInsight = typeof personalityInsights.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
