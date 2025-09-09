'use server';
/**
 * @fileOverview Flow for admin to upload PDF documents to create a knowledge base for the chatbot.
 *
 * - adminUploadsPdfKnowledgeBase - A function that handles the PDF upload and knowledge base creation process.
 * - AdminUploadsPdfKnowledgeBaseInput - The input type for the adminUploadsPdfKnowledgeBase function.
 * - AdminUploadsPdfKnowledgeBaseOutput - The return type for the adminUploadsPdfKnowledgeBase function.
 * - getKnowledgeDocuments - A function to retrieve all knowledge documents.
 * - deleteKnowledgeDocument - A function to delete a knowledge document.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { db, app } from '@/lib/firebase';
import { googleAI } from '@genkit-ai/googleai';
import { media } from 'genkit';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject, getBytes, getStream } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';


export type KnowledgeDocument = {
  id: string;
  fileName: string;
  uploadedAt: { seconds: number; nanoseconds: number; };
  filePath: string;
};

const PdfDocumentSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileName: z.string().describe('The name of the PDF file.'),
});

const AdminUploadsPdfKnowledgeBaseInputSchema = z.object({
  documents: z.array(PdfDocumentSchema)
});
export type AdminUploadsPdfKnowledgeBaseInput = z.infer<typeof AdminUploadsPdfKnowledgeBaseInputSchema>;

const AdminUploadsPdfKnowledgeBaseOutputSchema = z.object({
  success: z.boolean().describe('Whether the PDFs were successfully uploaded and processed.'),
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

const KNOWLEDGE_COLLECTION = 'knowledge_base';
const KNOWLEDGE_DOCUMENT_ID = 'main_document';

const storage = getStorage(app, 'gs://m-health-jxug7.firebasestorage.app');

const adminUploadsPdfKnowledgeBaseFlow = ai.defineFlow(
  {
    name: 'adminUploadsPdfKnowledgeBaseFlow',
    inputSchema: AdminUploadsPdfKnowledgeBaseInputSchema,
    outputSchema: AdminUploadsPdfKnowledgeBaseOutputSchema,
  },
  async (input) => {
    try {
      // 1. Prepare documents with unique IDs first
      const documentsWithIds = input.documents.map(doc => ({
        ...doc,
        uniqueId: uuidv4(),
      }));

      // 2. Process all documents in parallel (upload and text extraction)
      const processingResults = await Promise.all(
        documentsWithIds.map(async (document) => {
          const filePath = `knowledge_base/${document.uniqueId}_${document.fileName}`;
          const storageRef = ref(storage, filePath);
          
          await uploadString(storageRef, document.pdfDataUri, 'data_url');
          
          const textContent = await googleAI.extractText(media({ uri: document.pdfDataUri }));

          return {
            fileName: document.fileName,
            filePath: filePath,
            textContent: `\n\n--- Content from ${document.fileName} ---\n\n${textContent}`,
          };
        })
      );

      // 3. Combine all text content
      const combinedTextContent = processingResults.map(p => p.textContent).join('');

      // 4. Perform a single atomic batch write to Firestore
      const batch = writeBatch(db);

      // 4a. Add new document metadata to the batch
      processingResults.forEach(result => {
        const newDocRef = doc(collection(db, 'knowledge_documents'));
        const metadata = {
          fileName: result.fileName,
          uploadedAt: serverTimestamp(),
          filePath: result.filePath,
        };
        batch.set(newDocRef, metadata);
      });
      
      // 4b. Update the main knowledge base document atomically in the batch
      const knowledgeDocRef = doc(db, KNOWLEDGE_COLLECTION, KNOWLEDGE_DOCUMENT_ID);
      const knowledgeDocSnap = await getDoc(knowledgeDocRef);

      if (knowledgeDocSnap.exists()) {
        const existingContent = knowledgeDocSnap.data().content || '';
        batch.update(knowledgeDocRef, {
          content: existingContent + combinedTextContent,
          lastUpdatedAt: serverTimestamp(),
        });
      } else {
        batch.set(knowledgeDocRef, {
          content: combinedTextContent,
          createdAt: serverTimestamp(),
          lastUpdatedAt: serverTimestamp(),
        });
      }
      
      // 5. Commit the batch
      await batch.commit();

      return {
        success: true,
        message: `${input.documents.length} PDF(s) uploaded and added to knowledge base.`,
      };
    } catch (error: any) {
      console.error("Error processing PDFs:", error);
       if (error.code === 'storage/unauthorized') {
        return {
          success: false,
          message: 'Permission Denied. The server does not have permission to write to Firebase Storage. Please grant the "Storage Admin" role to your App Hosting service account in the Google Cloud IAM console.'
        };
      }
      return {
        success: false,
        message: `Failed to process PDFs. ${ (error as Error).message }`,
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

// Helper function to read a stream into a buffer
async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

const rebuildKnowledgeBaseFlow = ai.defineFlow({
    name: 'rebuildKnowledgeBaseFlow',
    inputSchema: z.undefined(),
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
}, async () => {
    try {
        const allDocs = await getKnowledgeDocuments();
        let combinedContent = '';

        const textExtractionPromises = allDocs.map(async (docInfo) => {
            try {
                const fileRef = ref(storage, docInfo.filePath);
                
                // Use getStream for memory efficiency, especially with larger files
                const stream = await getStream(fileRef);
                const fileBuffer = await streamToBuffer(stream);
                
                const dataUri = `data:application/pdf;base64,${fileBuffer.toString('base64')}`;

                const textContent = await googleAI.extractText(
                  media({uri: dataUri})
                );
                
                return `\n\n--- Content from ${docInfo.fileName} ---\n\n${textContent}`;
            } catch (fetchError) {
                console.warn(`Error processing file ${docInfo.fileName}, skipping. Error:`, fetchError);
                return ''; // Return empty string for failed files
            }
        });

        const allTextContents = await Promise.all(textExtractionPromises);
        combinedContent = allTextContents.join('');
        
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
