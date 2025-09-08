'use client';
import { useState, type ChangeEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { adminUploadsPdfKnowledgeBase } from '@/ai/flows/admin-uploads-pdf-knowledge-base';
import { UploadCloud, Loader2, FileText, X } from "lucide-react";

export default function KnowledgeBasePage() {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast({
                variant: 'destructive',
                title: 'No file selected',
                description: 'Please choose a PDF file to upload.',
            });
            return;
        }

        setIsLoading(true);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const pdfDataUri = reader.result as string;
                const result = await adminUploadsPdfKnowledgeBase({
                    pdfDataUri,
                    fileName: file.name
                });

                if (result.success) {
                    toast({
                        title: 'Upload Successful',
                        description: result.message,
                    });
                    setFile(null);
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Upload Failed',
                    description: (error as Error).message || 'An unknown error occurred.',
                });
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
             toast({
                variant: 'destructive',
                title: 'File Read Error',
                description: 'Could not read the selected file.',
            });
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Knowledge Base Management</CardTitle>
                <CardDescription>Upload PDF documents to train and update the chatbot&apos;s knowledge base.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center w-full">
                    <label htmlFor="pdf-upload" className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50 transition-colors">
                        {file ? (
                             <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <FileText className="w-10 h-10 mb-3 text-primary" />
                                <p className="mb-2 text-sm text-foreground"><span className="font-semibold">{file.name}</span></p>
                                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                                <Button variant="ghost" size="icon" className="absolute top-2 right-2 rounded-full h-7 w-7 z-10" onClick={(e) => { e.preventDefault(); setFile(null); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PDF (MAX. 5MB)</p>
                            </div>
                        )}
                       
                        <Input id="pdf-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf" disabled={isLoading} />
                    </label>
                </div>
                
                <Button onClick={handleUpload} disabled={!file || isLoading} className="w-full">
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                       'Upload and Process File'
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
