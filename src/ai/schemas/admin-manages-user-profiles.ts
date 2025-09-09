/**
 * @fileOverview Schemas for the admin user profile management flow.
 * 
 * - UpdateUserAdminNotesInputSchema - The Zod schema for the input of the updateUserAdminNotes function.
 * - UpdateUserAdminNotesInput - The TypeScript type for the input of the updateUserAdminNotes function.
 * - UpdateUserAdminNotesOutputSchema - The Zod schema for the output of the updateUserAdminNotes function.
 * - UpdateUserAdminNotesOutput - The TypeScript type for the output of the updateUserAdminNotes function.
 */

import { z } from 'genkit';

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
