'use server';

import { getDb } from '@/db';
import { chatMessages } from '@/db/schema';

export async function saveMessage(username: string, message: string) {
  try {
    if (!username || !message) {
      return { success: false, error: 'Username and message are required' };
    }

    const db = getDb();

    const [savedMessage] = await db
      .insert(chatMessages)
      .values({ username, message })
      .returning();

    return { success: true, message: savedMessage };
  } catch (error) {
    console.error('Error saving chat message:', error);
    return { 
      success: false, 
      error: 'Failed to save message',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getChatHistory(limit: number = 100) {
  try {
    const db = getDb();

    const messages = await db
      .select()
      .from(chatMessages)
      .orderBy(chatMessages.createdAt)
      .limit(limit);

    return { success: true, messages };
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return { 
      success: false, 
      error: 'Failed to fetch messages',
      messages: []
    };
  }
}
