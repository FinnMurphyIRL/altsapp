import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/components/chat/ContactListItem";
import { useToast } from "@/components/ui/use-toast";

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sent: boolean;
}

export const useMessages = (selectedContact: Contact | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const loadMessages = async (chatHistoryId: string) => {
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_history_id', chatHistoryId)
      .order('timestamp', { ascending: true });

    if (messages) {
      setMessages(
        messages.map((m) => ({
          id: m.id,
          text: m.content,
          timestamp: new Date(m.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sent: m.sender_name === selectedContact?.name,
        }))
      );
    }
  };

  const sendMessage = async (text: string) => {
    if (!selectedContact?.chatHistoryId) return;

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

    try {
      await supabase.from('chat_messages').insert({
        chat_history_id: selectedContact.chatHistoryId,
        sender_name: "You",
        content: text,
        timestamp: new Date().toISOString(),
      });

      const { data, error } = await supabase.functions.invoke('chat-response', {
        body: {
          chatHistoryId: selectedContact.chatHistoryId,
          currentMessage: text,
          participantName: selectedContact.name,
        },
      });

      if (error) throw error;

      const aiResponse: Message = {
        id: Date.now().toString(),
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sent: false,
      };

      setMessages((prev) => [...prev, aiResponse]);

      await supabase.from('chat_messages').insert({
        chat_history_id: selectedContact.chatHistoryId,
        sender_name: selectedContact.name,
        content: data.response,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { messages, setMessages, loadMessages, sendMessage };
};