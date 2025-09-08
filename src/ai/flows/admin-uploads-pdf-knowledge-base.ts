'use server';
/**
 * @fileOverview Flow for admin to upload PDF documents to create a knowledge base for the chatbot.
 *
 * - adminUploadsPdfKnowledgeBase - A function that handles the PDF upload and knowledge base creation process.
 * - AdminUploadsPdfKnowledgeBaseInput - The input type for the adminUploadsPdfKnowledgeBase function.
 * - AdminUploadsPdfKnowledgeBaseOutput - The return type for the adminUploadsPdfKnowledgeBase function.
 * - getKnowledgeDocuments - A function to retrieve all knowledge documents.
 * - deleteKnowledgeDocument - A function to delete a knowledge document.
 * - rebuildKnowledgeBase - A function to rebuild the entire knowledge base.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { googleAI } from '@genkit-ai/googleai';
import { media } from 'genkit';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";


export type KnowledgeDocument = {
  id: string;
  fileName: string;
  uploadedAt: { seconds: number; nanoseconds: number; };
  filePath: string;
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

export async function getKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
  try {
    const q = query(collection(db, 'knowledge_documents'), orderBy('uploadedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeDocument));
  } catch (error) {
    console.error("Error fetching knowledge documents:", error);
    return [];
  }
}

export async function deleteKnowledgeDocument(docId: string): Promise<{ success: boolean; message: string }> {
    return deleteKnowledgeDocumentFlow({ docId });
}

export async function rebuildKnowledgeBase(): Promise<{ success: boolean; message: string }> {
    return rebuildKnowledgeBaseFlow();
}


const KNOWLEDGE_COLLECTION = 'knowledge_base';
const KNOWLEDGE_DOCUMENT_ID = 'main_document';

const storage = getStorage();

const adminUploadsPdfKnowledgeBaseFlow = ai.defineFlow(
  {
    name: 'adminUploadsPdfKnowledgeBaseFlow',
    inputSchema: AdminUploadsPdfKnowledgeBaseInputSchema,
    outputSchema: AdminUploadsPdfKnowledgeBaseOutputSchema,
  },
  async (input) => {
    try {
      const textContent = await googleAI.extractText(
        media(input.pdfDataUri)
      );
      
      const knowledgeDocRef = doc(db, KNOWLEDGE_COLLECTION, KNOWLEDGE_DOCUMENT_ID);
      const knowledgeDoc = await getDoc(knowledgeDocRef);

      const contentToAppend = `\n\n--- Content from ${input.fileName} ---\n\n${textContent}`;

      if (knowledgeDoc.exists()) {
        await updateDoc(knowledgeDocRef, {
          content: (knowledgeDoc.data().content || '') + contentToAppend,
          lastUpdatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(knowledgeDocRef, {
          content: contentToAppend,
          lastUpdatedAt: serverTimestamp(),
        });
      }

      // Store metadata about the PDF in a separate collection for display/management
      const filePath = `knowledge_base/${Date.now()}_${input.fileName}`;
      const storageRef = ref(storage, filePath);
      await uploadString(storageRef, input.pdfDataUri, 'data_url');
      
      await addDoc(collection(db, 'knowledge_documents'), {
        fileName: input.fileName,
        uploadedAt: serverTimestamp(),
        filePath: filePath, 
      });


      return {
        success: true,
        message: `PDF '${input.fileName}' uploaded and added to knowledge base.`,
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

const deleteKnowledgeDocumentFlow = ai.defineFlow(
  {
    name: 'deleteKnowledgeDocumentFlow',
    inputSchema: z.object({ docId: z.string() }),
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async ({ docId }) => {
    try {
      const docRef = doc(db, 'knowledge_documents', docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: false, message: 'Document not found.' };
      }
      
      const documentData = docSnap.data() as KnowledgeDocument;
      
      // Delete file from Firebase Storage
      const fileRef = ref(storage, documentData.filePath);
      await deleteObject(fileRef);
      
      // Delete document from Firestore
      await deleteDoc(docRef);

      // Trigger a rebuild of the knowledge base
      await rebuildKnowledgeBaseFlow();

      return { success: true, message: `Document '${documentData.fileName}' deleted. Knowledge base is being updated.` };
    } catch (error) {
      console.error('Error deleting document:', error);
      return { success: false, message: 'Failed to delete document.' };
    }
  }
);

const rebuildKnowledgeBaseFlow = ai.defineFlow({
    name: 'rebuildKnowledgeBaseFlow',
    inputSchema: z.undefined(),
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
}, async () => {
    try {
        const allDocs = await getKnowledgeDocuments();
        let combinedContent = '';

        for (const docInfo of allDocs) {
            const fileRef = ref(storage, docInfo.filePath);
            const downloadUrl = await getDownloadURL(fileRef);
            
             const dataUri = await fetch(downloadUrl).then(res => res.blob()).then(blob => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target?.result);
                    reader.onerror = e => reject(e);
                    reader.readAsDataURL(blob);
                });
            });

            const textContent = await googleAI.extractText(
              media(dataUri as string)
            );
            
            combinedContent += `\n\n--- Content from ${docInfo.fileName} ---\n\n${textContent}`;
        }
        
        const knowledgeDocRef = doc(db, KNOWLEDGE_COLLECTION, KNOWLEDGE_DOCUMENT_ID);
        
        await setDoc(knowledgeDocRef, {
            content: combinedContent,
            lastUpdatedAt: serverTimestamp(),
        }, { merge: true });

        return { success: true, message: 'Knowledge base rebuilt successfully.' };
    } catch (error) {
        console.error('Error rebuilding knowledge base:', error);
        return { success: false, message: 'Failed to rebuild knowledge base.' };
    }
});
