'use server';
/**
 * @fileOverview Flow for a user to clear their chat history.
 *
 * - clearChatHistory - A function that deletes all messages for a specific user.
 * - ClearChatHistoryOutput - The return type for the clearChatHistory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, query, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ClearChatHistoryOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ClearChatHistoryOutput = z.infer<typeof ClearChatHistoryOutputSchema>;

export async function clearChatHistory(userId: string): Promise<ClearChatHistoryOutput> {
  return clearChatHistoryFlow(userId);
}

const clearChatHistoryFlow = ai.defineFlow(
  {
    name: 'clearChatHistoryFlow',
    inputSchema: z.string(),
    outputSchema: ClearChatHistoryOutputSchema,
  },
  async (userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required.');
      }

      const messagesRef = collection(db, 'chats', userId, 'messages');
      const q = query(messagesRef);
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: true, message: 'Chat history is already empty.' };
      }

      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return {
        success: true,
        message: 'Chat history has been successfully cleared.',
      };
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return {
        success: false,
        message: 'Failed to clear chat history.',
      };
    }
  }
);
