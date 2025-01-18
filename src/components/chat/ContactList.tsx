import { Search } from "lucide-react";
import { useState } from "react";
import { Contact } from "./ContactListItem";
import { ContactListItem } from "./ContactListItem";

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

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            placeholder="Search contacts"
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
      </div>
    </div>
  );
};