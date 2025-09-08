'use client';
import { useState, type ChangeEvent, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { adminUploadsPdfKnowledgeBase, getKnowledgeDocuments, deleteKnowledgeDocument, type KnowledgeDocument } from '@/ai/flows/admin-uploads-pdf-knowledge-base';
import { UploadCloud, Loader2, FileText, X, Files, Trash2 } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function KnowledgeBasePage() {
    const [files, setFiles] = useState<File[]>([]);
    const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDocs, setIsFetchingDocs] = useState(true);
    const { toast } = useToast();

    const fetchDocuments = async () => {
        setIsFetchingDocs(true);
        try {
            const docs = await getKnowledgeDocuments();
            setDocuments(docs);
        } catch (error) {
            console.error("Error fetching knowledge documents:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch knowledge documents.',
            });
        } finally {
            setIsFetchingDocs(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No files selected',
                description: 'Please choose one or more PDF files to upload.',
            });
            return;
        }

        setIsLoading(true);

        const uploadPromises = files.map(file => {
            return new Promise<{ success: boolean; message: string; fileName: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async () => {
                    try {
                        const pdfDataUri = reader.result as string;
                        const result = await adminUploadsPdfKnowledgeBase({
                            pdfDataUri,
                            fileName: file.name
                        });
                        if(result.success) {
                            resolve({ ...result, fileName: file.name });
                        } else {
                            reject(new Error(result.message));
                        }
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = (error) => {
                    reject(error);
                };
            });
        });

        try {
            const results = await Promise.allSettled(uploadPromises);
            const successfulUploads = results.filter(r => r.status === 'fulfilled').length;

            toast({
                title: 'Upload Complete',
                description: `${successfulUploads} out of ${files.length} files uploaded successfully. The knowledge base is being updated.`,
            });
            setFiles([]);
            fetchDocuments(); // Refresh the list of documents after upload

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: (error as Error).message || 'An unknown error occurred during upload.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (docId: string, docName: string) => {
        setIsLoading(true);
        try {
            const result = await deleteKnowledgeDocument(docId);
            if (result.success) {
                toast({
                    title: 'Document Deleted',
                    description: `'${docName}' has been removed and the knowledge base is being updated.`,
                });
                fetchDocuments();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: (error as Error).message,
            });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Upload Knowledge</CardTitle>
                    <CardDescription>Upload PDF documents to train the chatbot. The knowledge base will be rebuilt after each change.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center justify-center w-full">
                        <label htmlFor="pdf-upload" className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50 transition-colors">
                            {files.length > 0 ? (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                    <Files className="w-10 h-10 mb-3 text-primary" />
                                    <p className="mb-2 text-sm text-foreground"><span className="font-semibold">{files.length} file{files.length > 1 ? 's' : ''} selected</span></p>
                                    <ul className="text-xs text-muted-foreground list-disc list-inside max-h-24 overflow-y-auto">
                                        {files.map(f => <li key={f.name} className="truncate">{f.name}</li>)}
                                    </ul>
                                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 rounded-full h-7 w-7 z-10" onClick={(e) => { e.preventDefault(); setFiles([]); }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">PDFs (MAX. 5MB each)</p>
                                </div>
                            )}
                        
                            <Input id="pdf-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf" disabled={isLoading} multiple />
                        </label>
                    </div>
                    
                    <Button onClick={handleUpload} disabled={files.length === 0 || isLoading} className="w-full">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading {files.length} file{files.length > 1 ? 's' : ''}...
                            </>
                        ) : (
                        `Upload and Process ${files.length || ''} File${files.length > 1 ? 's' : ''}`.trim()
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Current Knowledge Base</CardTitle>
                    <CardDescription>The following documents are currently part of the chatbot's knowledge.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[24.5rem] pr-4">
                         {isFetchingDocs ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                         ) : documents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                <FileText className="w-12 h-12 mb-4" />
                                <h3 className="font-semibold text-lg">No Documents Found</h3>
                                <p className="text-sm">Upload a PDF to get started.</p>
                            </div>
                         ) : (
                            <div className="space-y-3">
                                {documents.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileText className="h-5 w-5 text-primary shrink-0" />
                                            <div className="flex-grow overflow-hidden">
                                                <p className="text-sm font-medium text-foreground truncate" title={doc.fileName}>{doc.fileName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Added: {doc.uploadedAt ? new Date(doc.uploadedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={isLoading}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the document <span className="font-semibold text-foreground">"{doc.fileName}"</span> and rebuild the knowledge base. This action cannot be undone.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(doc.id, doc.fileName)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                    Delete
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ))}
                            </div>
                         )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
