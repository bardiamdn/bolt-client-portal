import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Project {
  id: string;
  name: string;
  title: string;
  description: string;
  progress: number;
  icon: string;
  icon_bg: string;
  start_date: string;
  end_date: string;
  start_date: string;
  end_date: string;
  company: {
    id: string;
    name: string;
  };
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Get only projects where the user is a member
        const { data, error } = await supabase
          .from('project_members')
          .select(`
            project:projects(
              *,
              company:companies(id, name)
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        
        // Extract projects from the membership data
        const projects = (data || [])
          .map(membership => membership.project)
          .filter(project => project !== null);
        
        setProjects(projects);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, loading, error };
}