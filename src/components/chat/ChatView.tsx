import { Contact } from "./ContactListItem";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Message } from "@/hooks/useMessages";

interface ChatViewProps {
  selectedContact: Contact | null;
  messages: Message[];
  onBack: () => void;
  onDelete: () => void;
  onSendMessage: (message: string) => void;
  isMobile: boolean;
}

export const ChatView = ({
  selectedContact,
  messages,
  onBack,
  onDelete,
  onSendMessage,
  isMobile,
}: ChatViewProps) => {
  if (!selectedContact) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center">
        <p className="text-gray-500">Select a contact to start chatting</p>
      </div>
    );
  }

  return (
    <>
      <ChatHeader
        contact={selectedContact}
        onBack={onBack}
        onDelete={onDelete}
        isMobile={isMobile}
      />
      <MessageList messages={messages} />
      <ChatInput onSendMessage={onSendMessage} />
    </>
  );
};