import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ProjectMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
}

export function useProjectMembers(projectId: string) {
  const [members, setMembers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('project_members')
          .select(`
            id,
            user_id,
            role,
            profiles:user_id (
              id,
              full_name,
              email
            )
          `)
          .eq('project_id', projectId);

        if (error) throw error;
        
        const formattedMembers = (data || []).map(member => ({
          id: member.profiles?.id || member.user_id,
          full_name: member.profiles?.full_name || 'Unknown User'
        }));
        
        setMembers(formattedMembers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch project members');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchMembers();
    }
  }, [projectId]);

  return { members, loading, error };
}