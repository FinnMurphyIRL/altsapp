import { Button } from "@/components/ui/button";
import { Contact } from "./ContactListItem";

interface ChatHeaderProps {
  contact: Contact;
  onBack: () => void;
  isMobile: boolean;
}

export const ChatHeader = ({ contact, onBack, isMobile }: ChatHeaderProps) => {
  return (
    <div className="flex items-center gap-3 border-b bg-white p-4">
      {isMobile && (
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-gray-500"
        >
          Back
        </Button>
      )}
      <div className="flex items-center gap-3">
        <img
          src={contact.avatar}
          alt={contact.name}
          className="h-10 w-10 rounded-full"
        />
        <div>
          <h2 className="font-medium">{contact.name}</h2>
          <span className="text-sm text-[#9b87f5]">AI Version</span>
        </div>
      </div>
    </div>
  );
};