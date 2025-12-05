import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const moods = pgTable('moods', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  mood: varchar('mood', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const memories = pgTable('memories', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  imageUrl: text('image_url').notNull(),
  caption: text('caption'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

export type Mood = typeof moods.$inferSelect;
export type NewMood = typeof moods.$inferInsert;

export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
