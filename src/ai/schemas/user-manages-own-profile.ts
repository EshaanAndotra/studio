/**
 * @fileOverview Schemas for the user profile management flow.
 * 
 * - UpdateUserProfileInfoInputSchema - The Zod schema for the input of the updateUserProfileInfo function.
 * - UpdateUserProfileInfoInput - The TypeScript type for the input of the updateUserProfileInfo function.
 * - UpdateUserProfileInfoOutputSchema - The Zod schema for the output of the updateUserProfileInfo function.
 * - UpdateUserProfileInfoOutput - The TypeScript type for the output of the updateUserProfileInfo function.
 */

import { z } from 'genkit';

export const UpdateUserProfileInfoInputSchema = z.object({
  userId: z.string().describe('The ID of the user to update.'),
  profileInfo: z.string().describe('The profile information to save for the user.'),
});
export type UpdateUserProfileInfoInput = z.infer<typeof UpdateUserProfileInfoInputSchema>;

export const UpdateUserProfileInfoOutputSchema = z.object({
  success: z.boolean().describe('Whether the user profile info was successfully updated.'),
  message: z.string().describe('A message indicating the status of the update.'),
});
export type UpdateUserProfileInfoOutput = z.infer<typeof UpdateUserProfileInfoOutputSchema>;
