import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export function useMessages(projectId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            profiles:sender_id (
              full_name
            )
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to real-time message updates
    const subscription = supabase
      .channel(`messages:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          try {
            const newMessage = payload.new as Message;
            
            // Fetch the sender's profile data for the new message
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newMessage.sender_id)
              .single();
            
            if (profileError) {
              console.error('Error fetching profile for new message:', profileError);
            }
            
            const messageWithProfile = {
              ...newMessage,
              profiles: profileData || { full_name: 'Unknown User' }
            };
            
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, messageWithProfile];
            });
          } catch (error) {
            console.error('Error handling real-time message:', error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    setSending(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Verify user is a project member before attempting to insert
      const { data: membership } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (!membership || membership.length === 0) {
        throw new Error('You are not a member of this project');
      }

      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          project_id: projectId,
          sender_id: user.id,
          content: content.trim()
        });

      if (insertError) throw insertError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [projectId]);

  return { messages, loading, error, sending, sendMessage };
}