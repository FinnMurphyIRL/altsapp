import { useState } from "react";
import { Contact } from "./ContactListItem";
import { ContactList } from "./ContactList";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { useIsMobile } from "@/hooks/use-mobile";

const MOCK_CONTACTS: Contact[] = [
  {
    id: "1",
    name: "John Doe",
    avatar: "/placeholder.svg",
    lastMessage: "Hey, how are you?",
    online: true,
  },
  {
    id: "2",
    name: "Jane Smith",
    avatar: "/placeholder.svg",
    lastMessage: "See you tomorrow!",
    online: false,
  },
  {
    id: "3",
    name: "Mike Johnson",
    avatar: "/placeholder.svg",
    lastMessage: "Thanks for your help",
    online: true,
  },
];

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sent: boolean;
}

export const ChatInterface = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const isMobile = useIsMobile();
  const [showContacts, setShowContacts] = useState(!isMobile);

  const handleSendMessage = (text: string) => {
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
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setMessages([]);
    if (isMobile) {
      setShowContacts(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100">
      {/* Contact List */}
      <div
        className={cn(
          "h-full w-full transition-all duration-300 md:w-96",
          !showContacts && "hidden md:block"
        )}
      >
        <ContactList
          contacts={MOCK_CONTACTS}
          onSelectContact={handleSelectContact}
          selectedContactId={selectedContact?.id}
        />
      </div>

      {/* Chat Window */}
      <div
        className={cn(
          "flex h-full flex-1 flex-col bg-[#efeae2] transition-all duration-300",
          showContacts && "hidden md:flex"
        )}
      >
        {selectedContact ? (
          <>
            {/* Chat Header */}
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
                {selectedContact.online && (
                  <span className="text-sm text-green-500">Online</span>
                )}
              </div>
            </div>

            {/* Messages */}
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

            {/* Input */}
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