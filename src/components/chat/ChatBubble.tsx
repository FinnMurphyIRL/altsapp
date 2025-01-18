import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  timestamp: string;
  isSent?: boolean;
}

export const ChatBubble = ({ message, timestamp, isSent = false }: ChatBubbleProps) => {
  return (
    <div
      className={cn(
        "flex w-full animate-message-in",
        isSent ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2 shadow-sm",
          isSent
            ? "bg-whatsapp-light text-gray-800"
            : "bg-white text-gray-800"
        )}
      >
        <p className="text-sm">{message}</p>
        <span className="mt-1 block text-right text-xs text-gray-500">
          {timestamp}
        </span>
      </div>
    </div>
  );
};