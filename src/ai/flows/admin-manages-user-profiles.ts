'use server';
/**
 * @fileOverview Flow for admin to manage user profile data.
 * 
 * - updateUserAdminNotes - A function that allows an admin to update the notes for a specific user.
 */

import { ai } from '@/ai/genkit';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    UpdateUserAdminNotesInputSchema,
    UpdateUserAdminNotesOutputSchema,
    type UpdateUserAdminNotesInput,
    type UpdateUserAdminNotesOutput,
} from '@/ai/schemas/admin-manages-user-profiles';


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
