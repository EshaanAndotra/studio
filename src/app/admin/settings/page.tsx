'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateChatbotPersona, getChatbotPersona } from '@/ai/flows/admin-manages-settings';

export default function SettingsPage() {
  const [persona, setPersona] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPersona() {
      setIsLoading(true);
      try {
        const result = await getChatbotPersona();
        if (result.persona !== undefined) {
          setPersona(result.persona);
        } else {
           toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch the current chatbot persona.',
          });
        }
      } catch (error) {
        console.error('Failed to fetch persona', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: (error as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchPersona();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateChatbotPersona({ persona });
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
       toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: (error as Error).message,
        });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Chatbot Settings</CardTitle>
          <CardDescription>
            Define the persona and behavior of your AI assistant. This will change how it responds to all users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="persona">Chatbot Persona</Label>
              <Textarea
                id="persona"
                placeholder="e.g., You are a friendly and empathetic assistant. You should use simple language and avoid technical jargon. Always start your response with 'Hello there!'."
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="min-h-[200px]"
                disabled={isSaving}
              />
              <p className="text-sm text-muted-foreground">
                Provide detailed instructions on how the chatbot should behave, its tone, and any specific rules it must follow.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSave} disabled={isLoading || isSaving} className="ml-auto">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Persona
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
