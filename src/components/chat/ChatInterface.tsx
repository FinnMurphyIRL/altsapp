import { useState } from "react";
import { Contact } from "./ContactListItem";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { OnboardingFlow } from "./OnboardingFlow";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { ContactSidebar } from "./ContactSidebar";
import { ChatView } from "./ChatView";
import { useContacts } from "@/hooks/useContacts";
import { useMessages } from "@/hooks/useMessages";

export const ChatInterface = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showUploadFlow, setShowUploadFlow] = useState(false);
  const isMobile = useIsMobile();
  const [showContacts, setShowContacts] = useState(!isMobile);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { contacts, setContacts, allParticipants, createNewConversation } = useContacts();
  const { messages, loadMessages, sendMessage } = useMessages(selectedContact);

  const handleDeleteConversation = async () => {
    if (!selectedContact?.chatHistoryId) return;

    try {
      // Update to use soft delete
      const { error } = await supabase
        .from('chat_history_uploads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', selectedContact.chatHistoryId);

      if (error) throw error;

      setContacts(contacts.filter(c => c.id !== selectedContact.id));
      setSelectedContact(null);

      toast({
        title: "Conversation deleted",
        description: "The conversation has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete the conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleSelectContact = async (contact: Contact) => {
    setSelectedContact(contact);
    if (contact.chatHistoryId) {
      await loadMessages(contact.chatHistoryId);
    }
    if (isMobile) {
      setShowContacts(false);
    }
  };

  const handleUploadComplete = () => {
    setShowUploadFlow(false);
  };

  if (!contacts.length && !showUploadFlow) {
    return <OnboardingFlow onComplete={handleUploadComplete} />;
  }

  if (showUploadFlow) {
    return <OnboardingFlow onComplete={handleUploadComplete} />;
  }

  return (
    <div className="flex h-[100vh] w-full overflow-hidden bg-gray-100">
      <ContactSidebar
        contacts={contacts}
        selectedContactId={selectedContact?.id}
        showContacts={showContacts}
        onSelectContact={handleSelectContact}
        onAddMore={() => setShowUploadFlow(true)}
        onLogout={handleLogout}
      />

      <div
        className={cn(
          "flex h-full flex-1 flex-col bg-[#efeae2] transition-all duration-300",
          showContacts && "hidden md:flex"
        )}
      >
        <ChatView
          selectedContact={selectedContact}
          messages={messages}
          onBack={() => setShowContacts(true)}
          onDelete={handleDeleteConversation}
          onSendMessage={sendMessage}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};
