'use server';

import { getDb } from '@/db';
import { moods, memories } from '@/db/schema';
import { desc } from 'drizzle-orm';

// Mood Actions
export async function saveMood(username: string, mood: string) {
  try {
    if (!username || !mood) {
      return { success: false, error: 'Username and mood are required' };
    }

    const db = getDb();

    const [savedMood] = await db
      .insert(moods)
      .values({ username, mood })
      .returning();

    return { success: true, mood: savedMood };
  } catch (error) {
    console.error('Error saving mood:', error);
    return { 
      success: false, 
      error: 'Failed to save mood',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getMoodHistory(username: string, limit: number = 30) {
  try {
    const db = getDb();

    const moodHistory = await db
      .select()
      .from(moods)
      .where(username ? undefined : undefined) // Get all moods for now
      .orderBy(desc(moods.createdAt))
      .limit(limit);

    return { success: true, moods: moodHistory };
  } catch (error) {
    console.error('Error fetching mood history:', error);
    return { 
      success: false, 
      error: 'Failed to fetch mood history',
      moods: []
    };
  }
}

// Memory Actions
export async function saveMemory(username: string, imageUrl: string, caption?: string) {
  try {
    if (!username || !imageUrl) {
      return { success: false, error: 'Username and image URL are required' };
    }

    const db = getDb();

    const [savedMemory] = await db
      .insert(memories)
      .values({ username, imageUrl, caption })
      .returning();

    return { success: true, memory: savedMemory };
  } catch (error) {
    console.error('Error saving memory:', error);
    return { 
      success: false, 
      error: 'Failed to save memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getMemories(limit: number = 50) {
  try {
    const db = getDb();

    const memoryList = await db
      .select()
      .from(memories)
      .orderBy(desc(memories.createdAt))
      .limit(limit);

    return { success: true, memories: memoryList };
  } catch (error) {
    console.error('Error fetching memories:', error);
    return { 
      success: false, 
      error: 'Failed to fetch memories',
      memories: []
    };
  }
}
