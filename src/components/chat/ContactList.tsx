import { Search, Plus } from "lucide-react";
import { useState } from "react";
import { Contact } from "./ContactListItem";
import { ContactListItem } from "./ContactListItem";
import { Button } from "@/components/ui/button";
import { useContacts } from "@/hooks/useContacts";

interface ContactListProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  selectedContactId?: string;
}

export const ContactList = ({
  contacts,
  onSelectContact,
  selectedContactId,
}: ContactListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { allParticipants, createNewConversation } = useContacts();

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableParticipants = allParticipants.filter(
    name => !contacts.some(contact => contact.name === name) &&
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNewChat = async (participantName: string) => {
    const newContact = await createNewConversation(participantName);
    if (newContact) {
      onSelectContact(newContact);
    }
  };

  return (
    <div className="flex h-full flex-col border-r">
      <div className="border-b p-4">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search contacts or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-whatsapp-primary focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.map((contact) => (
          <ContactListItem
            key={contact.id}
            contact={contact}
            isSelected={contact.id === selectedContactId}
            onClick={() => onSelectContact(contact)}
          />
        ))}
        
        {searchQuery && availableParticipants.length > 0 && (
          <div className="p-2 border-t">
            <p className="text-sm text-gray-500 px-2 py-1">Previous contacts</p>
            {availableParticipants.map((name) => (
              <Button
                key={name}
                variant="ghost"
                className="w-full justify-start px-4 py-3 text-left"
                onClick={() => handleCreateNewChat(name)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Start new chat with {name}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};