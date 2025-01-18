import { cn } from "@/lib/utils";

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  online?: boolean;
  chatHistoryId?: string;
}

interface ContactListItemProps {
  contact: Contact;
  isSelected?: boolean;
  onClick: () => void;
}

export const ContactListItem = ({
  contact,
  isSelected,
  onClick,
}: ContactListItemProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-3 border-b p-4 transition-colors hover:bg-gray-50",
        isSelected && "bg-whatsapp-gray"
      )}
    >
      <div className="relative">
        <img
          src={contact.avatar}
          alt={contact.name}
          className="h-12 w-12 rounded-full object-cover"
        />
        {contact.online && (
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-whatsapp-primary" />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <h3 className="font-medium">{contact.name}</h3>
        {contact.lastMessage && (
          <p className="truncate text-sm text-gray-500">{contact.lastMessage}</p>
        )}
      </div>
    </div>
  );
};
