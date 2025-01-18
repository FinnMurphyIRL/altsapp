import { useState, useEffect } from "react";
import { Contact } from "./ContactListItem";
import { ContactList } from "./ContactList";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { OnboardingFlow } from "./OnboardingFlow";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sent: boolean;
}

interface ChatParticipant {
  id: string;
  participant_name: string;
  is_uploader: boolean;
}

export const ChatInterface = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const isMobile = useIsMobile();
  const [showContacts, setShowContacts] = useState(!isMobile);
  const [hasUploadedHistory, setHasUploadedHistory] = useState(false);

  useEffect(() => {
    const loadContacts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: participants } = await supabase
        .from('chat_participants')
        .select('*, chat_history_uploads(id)')
        .eq('user_id', user.id)
        .eq('is_uploader', false);

      if (participants) {
        const contactsList: Contact[] = participants.map((p) => ({
          id: p.id,
          name: p.participant_name,
          avatar: "/placeholder.svg",
          lastMessage: "",
          online: false,
          chatHistoryId: p.chat_history_uploads.id
        }));
        setContacts(contactsList);
      }
    };

    loadContacts();
  }, [hasUploadedHistory]);

  const loadMessages = async (chatHistoryId: string) => {
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_history_id', chatHistoryId)
      .order('timestamp', { ascending: true });

    if (messages) {
      setMessages(
        messages.map((m) => ({
          id: m.id,
          text: m.content,
          timestamp: new Date(m.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sent: m.sender_name === selectedContact?.name,
        }))
      );
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedContact?.chatHistoryId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sent: true,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Store message in database
    await supabase.from('chat_messages').insert({
      chat_history_id: selectedContact.chatHistoryId,
      sender_name: "You",
      content: text,
      timestamp: new Date().toISOString(),
    });

    // Simulate AI response
    setTimeout(async () => {
      const aiResponse: Message = {
        id: Date.now().toString(),
        text: `Hi! I'm the AI version of ${selectedContact.name}. I'm learning from our chat history to respond like them!`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sent: false,
      };

      setMessages((prev) => [...prev, aiResponse]);

      await supabase.from('chat_messages').insert({
        chat_history_id: selectedContact.chatHistoryId,
        sender_name: selectedContact.name,
        content: aiResponse.text,
        timestamp: new Date().toISOString(),
      });
    }, 1000);
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

  if (!hasUploadedHistory) {
    return <OnboardingFlow onComplete={() => setHasUploadedHistory(true)} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100">
      <div
        className={cn(
          "h-full w-full transition-all duration-300 md:w-96",
          !showContacts && "hidden md:block"
        )}
      >
        <ContactList
          contacts={contacts}
          onSelectContact={handleSelectContact}
          selectedContactId={selectedContact?.id}
        />
      </div>

      <div
        className={cn(
          "flex h-full flex-1 flex-col bg-[#efeae2] transition-all duration-300",
          showContacts && "hidden md:flex"
        )}
      >
        {selectedContact ? (
          <>
            <div className="flex items-center gap-3 border-b bg-white p-4">
              {isMobile && (
                <button
                  onClick={() => setShowContacts(true)}
                  className="text-gray-500"
                >
                  Back
                </button>
              )}
              <img
                src={selectedContact.avatar}
                alt={selectedContact.name}
                className="h-10 w-10 rounded-full"
              />
              <div>
                <h2 className="font-medium">{selectedContact.name}</h2>
                <span className="text-sm text-[#9b87f5]">AI Version</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message.text}
                  timestamp={message.timestamp}
                  isSent={message.sent}
                />
              ))}
            </div>

            <ChatInput onSendMessage={handleSendMessage} />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};