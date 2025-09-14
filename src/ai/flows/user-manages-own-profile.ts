'use server';
/**
 * @fileOverview Flow for a user to manage their own profile data.
 * 
 * - updateUserProfileInfo - A function that allows a user to update their profile information.
 */

import { ai } from '@/ai/genkit';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    UpdateUserProfileInfoInputSchema,
    UpdateUserProfileInfoOutputSchema,
    type UpdateUserProfileInfoInput,
    type UpdateUserProfileInfoOutput,
} from '@/ai/schemas/user-manages-own-profile';


export async function updateUserProfileInfo(input: UpdateUserProfileInfoInput): Promise<UpdateUserProfileInfoOutput> {
    return updateUserProfileInfoFlow(input);
}

const updateUserProfileInfoFlow = ai.defineFlow(
  {
    name: 'updateUserProfileInfoFlow',
    inputSchema: UpdateUserProfileInfoInputSchema,
    outputSchema: UpdateUserProfileInfoOutputSchema,
  },
  async ({ userId, profileInfo }) => {
    try {
      if (!userId) {
        throw new Error('User ID is required.');
      }
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        profileInfo: profileInfo,
      });

      return {
        success: true,
        message: 'User profile updated successfully.',
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return {
        success: false,
        message: 'Failed to update user profile.',
      };
    }
  }
);
