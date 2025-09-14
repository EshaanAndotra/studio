'use server';
/**
 * @fileOverview Flow for an admin to manage application settings.
 *
 * - updateChatbotPersona - A function that allows an admin to update the chatbot's persona.
 * - getChatbotPersona - A function that retrieves the chatbot's current persona.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const SETTINGS_COLLECTION = 'settings';
const CHATBOT_PERSONA_DOC_ID = 'chatbot_persona';

const UpdateChatbotPersonaInputSchema = z.object({
  persona: z.string().describe("The new persona for the chatbot."),
});
export type UpdateChatbotPersonaInput = z.infer<typeof UpdateChatbotPersonaInputSchema>;

const UpdateChatbotPersonaOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type UpdateChatbotPersonaOutput = z.infer<typeof UpdateChatbotPersonaOutputSchema>;

const GetChatbotPersonaOutputSchema = z.object({
  persona: z.string().optional(),
});
export type GetChatbotPersonaOutput = z.infer<typeof GetChatbotPersonaOutputSchema>;


export async function updateChatbotPersona(input: UpdateChatbotPersonaInput): Promise<UpdateChatbotPersonaOutput> {
    return updateChatbotPersonaFlow(input);
}

export async function getChatbotPersona(): Promise<GetChatbotPersonaOutput> {
    return getChatbotPersonaFlow({});
}

const updateChatbotPersonaFlow = ai.defineFlow(
  {
    name: 'updateChatbotPersonaFlow',
    inputSchema: UpdateChatbotPersonaInputSchema,
    outputSchema: UpdateChatbotPersonaOutputSchema,
  },
  async ({ persona }) => {
    try {
      const personaDocRef = doc(db, SETTINGS_COLLECTION, CHATBOT_PERSONA_DOC_ID);
      await setDoc(personaDocRef, {
        persona: persona,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return {
        success: true,
        message: 'Chatbot persona updated successfully.',
      };
    } catch (error) {
      console.error('Error updating chatbot persona:', error);
      return {
        success: false,
        message: 'Failed to update chatbot persona.',
      };
    }
  }
);

const getChatbotPersonaFlow = ai.defineFlow(
  {
    name: 'getChatbotPersonaFlow',
    inputSchema: z.object({}),
    outputSchema: GetChatbotPersonaOutputSchema,
  },
  async () => {
    try {
      const personaDocRef = doc(db, SETTINGS_COLLECTION, CHATBOT_PERSONA_DOC_ID);
      const docSnap = await getDoc(personaDocRef);

      if (docSnap.exists()) {
        return { persona: docSnap.data().persona };
      } else {
        return { persona: '' };
      }
    } catch (error) {
      console.error('Error getting chatbot persona:', error);
      return { persona: undefined };
    }
  }
);
