import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export const OnboardingFlow = ({ onComplete }: { onComplete: () => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload chat histories.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat_histories')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record with user_id
      const { error: dbError } = await supabase
        .from('chat_history_uploads')
        .insert({
          filename: file.name,
          file_path: filePath,
          user_id: user.id,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: "Your chat history has been uploaded successfully.",
      });
      
      onComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your chat history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Welcome to WhatsApp Web Client
        </h2>

        <AlertDialog open={showInstructions}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>How to Export Your WhatsApp Chat History</AlertDialogTitle>
              <AlertDialogDescription>
                <p className="mb-4">Follow these steps to export your chat history:</p>
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
                    <span className="block text-base font-medium text-blue-600">
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
      </div>
    </div>
  );
};