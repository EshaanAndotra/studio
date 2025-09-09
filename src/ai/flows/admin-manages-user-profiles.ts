'use server';
/**
 * @fileOverview Flow for admin to manage user profile data.
 * 
 * - updateUserAdminNotes - A function that allows an admin to update the notes for a specific user.
 * - UpdateUserAdminNotesInput - The input type for the updateUserAdminNotes function.
 * - UpdateUserAdminNotesOutput - The return type for the updateUserAdminNotes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const UpdateUserAdminNotesInputSchema = z.object({
  userId: z.string().describe('The ID of the user to update.'),
  notes: z.string().describe('The notes to save for the user.'),
});
export type UpdateUserAdminNotesInput = z.infer<typeof UpdateUserAdminNotesInputSchema>;

export const UpdateUserAdminNotesOutputSchema = z.object({
  success: z.boolean().describe('Whether the user notes were successfully updated.'),
  message: z.string().describe('A message indicating the status of the update.'),
});
export type UpdateUserAdminNotesOutput = z.infer<typeof UpdateUserAdminNotesOutputSchema>;

export async function updateUserAdminNotes(input: UpdateUserAdminNotesInput): Promise<UpdateUserAdminNotesOutput> {
    return updateUserAdminNotesFlow(input);
}


const updateUserAdminNotesFlow = ai.defineFlow(
  {
    name: 'updateUserAdminNotesFlow',
    inputSchema: UpdateUserAdminNotesInputSchema,
    outputSchema: UpdateUserAdminNotesOutputSchema,
  },
  async ({ userId, notes }) => {
    try {
      if (!userId) {
        throw new Error('User ID is required.');
      }
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        adminNotes: notes,
      });

      return {
        success: true,
        message: 'User notes updated successfully.',
      };
    } catch (error) {
      console.error('Error updating user notes:', error);
      return {
        success: false,
        message: 'Failed to update user notes.',
      };
    }
  }
);
