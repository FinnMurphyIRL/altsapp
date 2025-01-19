import { Contact } from "./ContactListItem";
import { ContactList } from "./ContactList";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactSidebarProps {
  contacts: Contact[];
  selectedContactId?: string;
  showContacts: boolean;
  onSelectContact: (contact: Contact) => void;
  onAddMore: () => void;
  onLogout: () => void;
}

export const ContactSidebar = ({
  contacts,
  selectedContactId,
  showContacts,
  onSelectContact,
  onAddMore,
  onLogout,
}: ContactSidebarProps) => {
  return (
    <div
      className={cn(
        "h-full transition-all duration-300 md:w-96 w-full",
        !showContacts && "hidden md:block"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-3">
          <Button
            onClick={onAddMore}
            className="flex-1 mr-2 text-sm"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add More Alts
          </Button>
          <Button
            onClick={onLogout}
            variant="ghost"
            size="icon"
            className="text-gray-500"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <ContactList
          contacts={contacts}
          onSelectContact={onSelectContact}
          selectedContactId={selectedContactId}
        />
      </div>
    </div>
  );
};