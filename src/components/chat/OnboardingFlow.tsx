import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { ParticipantSelector } from "./ParticipantSelector";

interface Participant {
  name: string;
  isUploader: boolean;
}

export const OnboardingFlow = ({ onComplete }: { onComplete: () => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showParticipantSelector, setShowParticipantSelector] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: preferences, error } = await supabase
          .from('user_preferences')
          .select('display_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching preferences:', error);
          return;
        }

        if (preferences) {
          setDisplayName(preferences.display_name);
        }
      } catch (error) {
        console.error('Error in loadUserPreferences:', error);
      }
    };

    loadUserPreferences();
  }, []);

  const processAndUploadChat = async (file: File, participants: Participant[]) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        setIsUploading(true);
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const messages: { sender: string; content: string; timestamp: string }[] = [];
        
        // Basic WhatsApp chat format parsing
        const messageRegex = /\[?(\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]?\s*-\s*([^:]+):\s*(.+)/;
        
        lines.forEach(line => {
          const match = line.match(messageRegex);
          if (match) {
            const [_, timestamp, sender, content] = match;
            messages.push({
              sender: sender.trim(),
              content: content.trim(),
              timestamp: new Date(timestamp).toISOString(),
            });
          }
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Store display name if not already stored
        if (!displayName) {
          const uploaderName = participants.find(p => p.isUploader)?.name;
          if (uploaderName) {
            await supabase.from('user_preferences').insert({
              user_id: user.id,
              display_name: uploaderName,
            });
          }
        }

        // Upload file to storage
        const fileExt = file.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat_histories')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create chat history record
        const { data: chatHistory, error: chatError } = await supabase
          .from('chat_history_uploads')
          .insert({
            filename: file.name,
            file_path: filePath,
            user_id: user.id,
          })
          .select()
          .single();

        if (chatError) throw chatError;

        // Insert participants
        const participantsToInsert = participants.map(p => ({
          user_id: user.id,
          chat_history_id: chatHistory.id,
          participant_name: p.name,
          is_uploader: p.isUploader,
        }));

        const { error: participantsError } = await supabase
          .from('chat_participants')
          .insert(participantsToInsert);

        if (participantsError) throw participantsError;

        // Insert messages
        const messagesToInsert = messages.map(m => ({
          chat_history_id: chatHistory.id,
          sender_name: m.sender,
          content: m.content,
          timestamp: m.timestamp,
        }));

        const { error: messagesError } = await supabase
          .from('chat_messages')
          .insert(messagesToInsert);

        if (messagesError) throw messagesError;

        toast({
          title: "Success!",
          description: "Your chat history has been processed and uploaded.",
        });
        
        // Call onComplete to trigger navigation and UI update
        onComplete();
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: "There was an error processing your chat history. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'text/plain') {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt file exported from WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setShowParticipantSelector(true);
  };

  const handleParticipantsSelected = async (participants: Participant[]) => {
    if (!selectedFile) return;
    await processAndUploadChat(selectedFile, participants);
  };

  return (
    <div className="flex h-full items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Welcome to AltsApp - Your Friends and Group Chats (sort of)
        </h2>

        <AlertDialog open={showInstructions}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>How to Export Your WhatsApp Chat History</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>Follow these steps to export your chat history:</p>
                <ol className="list-decimal space-y-2 pl-4">
                  <li>Open WhatsApp on your phone</li>
                  <li>Open the chat you want to export</li>
                  <li>Tap the three dots menu (⋮) in the top right</li>
                  <li>Select "More" → "Export chat"</li>
                  <li>Choose "Without media" for text-only export</li>
                  <li>Save or share the exported file</li>
                </ol>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowInstructions(false)}>
                Got it
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {showParticipantSelector ? (
          <ParticipantSelector 
            onParticipantsSelected={handleParticipantsSelected}
            defaultUploaderName={displayName}
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
              <div className="text-center">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="chat-history-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="chat-history-upload"
                  className="cursor-pointer text-sm text-gray-600"
                >
                  {isUploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <span className="block text-base font-medium text-[#9b87f5]">
                        Upload your chat history
                      </span>
                      <span className="mt-2 block">
                        Click to select your exported chat file
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstructions(true)}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Need help? View instructions again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};