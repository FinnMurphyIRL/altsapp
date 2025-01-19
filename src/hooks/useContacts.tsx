import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/components/chat/ContactListItem";

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);

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

  useEffect(() => {
    loadContacts();
  }, []);

  return { contacts, setContacts, loadContacts };
};