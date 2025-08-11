import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface FileItem {
  id: string;
  project_id: string;
  name: string;
  type: 'file' | 'link';
  url?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  uploaded_by: string;
}

export function useFiles(projectId: string) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        let query = supabase
          .from('files')
          .select('*')
          .order('created_at', { ascending: false });

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setFiles(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch files');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [projectId]);

  const addLink = async (name: string, url: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('files')
        .insert({
          project_id: projectId,
          name,
          type: 'link',
          url,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      setFiles(prev => [data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add link');
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Convert file to base64 data URL for storage
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Save file record to database
      const { data, error } = await supabase
        .from('files')
        .insert({
          project_id: projectId,
          name: file.name,
          type: 'file',
          url: fileDataUrl,
          file_path: null,
          size: file.size,
          mime_type: file.type,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      setFiles(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      throw err;
    }
  };
  return { files, loading, error, addLink, uploadFile };
}