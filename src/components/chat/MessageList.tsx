import { useEffect, useRef } from "react";
import { ChatBubble } from "./ChatBubble";

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sent: boolean;
}

interface MessageListProps {
  messages: Message[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((message) => (
        <ChatBubble
          key={message.id}
          message={message.text}
          timestamp={message.timestamp}
          isSent={message.sent}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};