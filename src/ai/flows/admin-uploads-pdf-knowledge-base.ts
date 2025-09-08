'use server';
/**
 * @fileOverview Flow for admin to upload PDF documents to create a knowledge base for the chatbot.
 *
 * - adminUploadsPdfKnowledgeBase - A function that handles the PDF upload and knowledge base creation process.
 * - AdminUploadsPdfKnowledgeBaseInput - The input type for the adminUploadsPdfKnowledgeBase function.
 * - AdminUploadsPdfKnowledgeBaseOutput - The return type for the adminUploadsPdfKnowledgeBase function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, FieldValue } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { googleAI } from '@genkit-ai/googleai';


export type KnowledgeDocument = {
  id: string;
  fileName: string;
  uploadedAt: { seconds: number; nanoseconds: number; };
};

const AdminUploadsPdfKnowledgeBaseInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileName: z.string().describe('The name of the PDF file.'),
});
export type AdminUploadsPdfKnowledgeBaseInput = z.infer<typeof AdminUploadsPdfKnowledgeBaseInputSchema>;

const AdminUploadsPdfKnowledgeBaseOutputSchema = z.object({
  success: z.boolean().describe('Whether the PDF was successfully uploaded and processed.'),
  message: z.string().describe('A message indicating the status of the upload and processing.'),
});
export type AdminUploadsPdfKnowledgeBaseOutput = z.infer<typeof AdminUploadsPdfKnowledgeBaseOutputSchema>;

export async function adminUploadsPdfKnowledgeBase(input: AdminUploadsPdfKnowledgeBaseInput): Promise<AdminUploadsPdfKnowledgeBaseOutput> {
  return adminUploadsPdfKnowledgeBaseFlow(input);
}

const KNOWLEDGE_COLLECTION = 'knowledge_base';
const KNOWLEDGE_DOCUMENT_ID = 'main_document';

const adminUploadsPdfKnowledgeBaseFlow = ai.defineFlow(
  {
    name: 'adminUploadsPdfKnowledgeBaseFlow',
    inputSchema: AdminUploadsPdfKnowledgeBaseInputSchema,
    outputSchema: AdminUploadsPdfKnowledgeBaseOutputSchema,
  },
  async (input) => {
    try {
      const mediaPart = {
          data: {
              url: input.pdfDataUri
          }
      };
      
      const textContent = await googleAI.extractText(mediaPart);

      // Add document metadata to the 'knowledge_documents' collection
      await addDoc(collection(db, 'knowledge_documents'), {
        fileName: input.fileName,
        uploadedAt: serverTimestamp(),
      });
      
      const knowledgeDocRef = doc(db, KNOWLEDGE_COLLECTION, KNOWLEDGE_DOCUMENT_ID);
      const knowledgeDoc = await getDoc(knowledgeDocRef);

      const newContent = `\n\n--- Content from ${input.fileName} ---\n\n${textContent}`;

      if (knowledgeDoc.exists()) {
        // Append content if document exists
        await updateDoc(knowledgeDocRef, {
            content: (knowledgeDoc.data().content || '') + newContent,
            lastUpdatedAt: serverTimestamp(),
        });
      } else {
        // Create document if it doesn't exist
        await setDoc(knowledgeDocRef, {
            content: newContent,
            createdAt: serverTimestamp(),
            lastUpdatedAt: serverTimestamp(),
        });
      }

      return {
        success: true,
        message: `PDF '${input.fileName}' uploaded and processed successfully.`,
      };
    } catch (error) {
      console.error("Error processing PDF:", error);
      return {
        success: false,
        message: `Failed to process PDF '${input.fileName}'.`,
      };
    }
  }
);
