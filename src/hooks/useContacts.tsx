import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/components/chat/ContactListItem";
import { useToast } from "@/components/ui/use-toast";

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [allParticipants, setAllParticipants] = useState<string[]>([]);
  const { toast } = useToast();

  const loadContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: participants } = await supabase
      .from('chat_participants')
      .select('*, chat_history_uploads(id, deleted_at)')
      .eq('user_id', user.id)
      .eq('is_uploader', false);

    if (participants) {
      const contactsList: Contact[] = participants
        .filter(p => !p.chat_history_uploads.deleted_at)
        .map((p) => ({
          id: p.id,
          name: p.participant_name,
          avatar: "/placeholder.svg",
          lastMessage: "",
          online: false,
          chatHistoryId: p.chat_history_uploads.id
        }));
      setContacts(contactsList);
    }

    // Load all unique participants from directory
    const { data: directory } = await supabase
      .from('chat_participants_directory')
      .select('participant_name')
      .eq('user_id', user.id);

    if (directory) {
      setAllParticipants(directory.map(d => d.participant_name));
    }
  };

  const createNewConversation = async (participantName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      // Create new chat history
      const { data: chatHistory, error: chatError } = await supabase
        .from('chat_history_uploads')
        .insert({
          user_id: user.id,
          filename: `New conversation with ${participantName}`,
          file_path: 'manual-creation',
          processed: true
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      const { data: participants, error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          {
            user_id: user.id,
            chat_history_id: chatHistory.id,
            participant_name: 'You',
            is_uploader: true
          },
          {
            user_id: user.id,
            chat_history_id: chatHistory.id,
            participant_name: participantName,
            is_uploader: false
          }
        ])
        .select()
        .single();

      if (participantsError) throw participantsError;

      const newContact: Contact = {
        id: participants.id,
        name: participantName,
        avatar: "/placeholder.svg",
        lastMessage: "",
        online: false,
        chatHistoryId: chatHistory.id
      };

      setContacts(prev => [...prev, newContact]);
      
      toast({
        title: "New conversation created",
        description: `Started a new chat with ${participantName}`,
      });

      return newContact;
    } catch (error) {
      console.error('Error creating new conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return { contacts, setContacts, loadContacts, allParticipants, createNewConversation };
};