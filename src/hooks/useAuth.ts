import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) setError(error.message);
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    if (error) setError(error.message);
    return { error };
  };

  const createSampleProjects = async () => {
    try {
      // Wait for the user profile to be created by the database trigger
      let retries = 0;
      const maxRetries = 10;
      let userProfile = null;
      
      while (retries < maxRetries && !userProfile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No user found during sample project creation');
          return;
        }

        // Check if user profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (profile) {
          userProfile = profile;
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }

      if (!userProfile) {
        console.error('User profile not found after retries');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create sample company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'Sample Company Inc.'
        })
        .select()
        .single();

      if (companyError) {
        console.error('Error creating sample company:', companyError);
        return;
      }

      // Create sample projects
      const sampleProjects = [
        {
          name: 'website-redesign',
          title: 'Website Redesign Project',
          description: 'Complete redesign of the company website with modern UI/UX principles',
          company_id: company.id,
          progress: 65,
          icon: 'W',
          icon_bg: 'bg-blue-500',
          start_date: '2024-01-15',
          end_date: '2024-04-30'
        },
        {
          name: 'mobile-app',
          title: 'Mobile App Development',
          description: 'Native mobile application for iOS and Android platforms',
          company_id: company.id,
          progress: 30,
          icon: 'M',
          icon_bg: 'bg-green-500',
          start_date: '2024-02-01',
          end_date: '2024-06-15'
        },
        {
          name: 'brand-identity',
          title: 'Brand Identity Refresh',
          description: 'Complete brand identity overhaul including logo, colors, and guidelines',
          company_id: company.id,
          progress: 85,
          icon: 'B',
          icon_bg: 'bg-purple-500',
          start_date: '2023-11-01',
          end_date: '2024-02-28'
        }
      ];

      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .insert(sampleProjects)
        .select();

      if (projectsError) {
        console.error('Error creating sample projects:', projectsError);
        return;
      }

      // Add user as owner of all projects
      const memberships = projects.map(project => ({
        project_id: project.id,
        user_id: user.id,
        role: 'owner'
      }));

      const { error: membershipError } = await supabase
        .from('project_members')
        .insert(memberships);

      if (membershipError) {
        console.error('Error creating project memberships:', membershipError);
        return;
      }

      // Create sample tasks for the first project
      if (projects.length > 0) {
        const sampleTasks = [
          {
            project_id: projects[0].id,
            title: 'Review wireframes and mockups',
            description: 'Please review the initial wireframes and provide feedback on the user flow',
            type: 'review',
            status: 'pending',
            priority: 'high',
            due_date: '2024-03-15',
            created_by: user.id
          },
          {
            project_id: projects[0].id,
            title: 'Complete brand questionnaire',
            description: 'Fill out the brand questionnaire to help us understand your vision',
            type: 'form',
            status: 'pending',
            priority: 'medium',
            due_date: '2024-03-20',
            created_by: user.id
          }
        ];

        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(sampleTasks);

        if (tasksError) {
          console.error('Error creating sample tasks:', tasksError);
        }

        // Create sample invoice
        const { error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            project_id: projects[0].id,
            number: 'INV-2024-001',
            description: 'Website redesign project - Phase 1 completion',
            amount: 2500.00,
            status: 'pending',
            issue_date: '2024-03-01',
            due_date: '2024-03-31'
          });

        if (invoiceError) {
          console.error('Error creating sample invoice:', invoiceError);
        }

        // Create sample messages for the first project
        const sampleMessages = [
          {
            project_id: projects[0].id,
            sender_id: user.id,
            content: 'Welcome to the project! Looking forward to working together on this website redesign.'
          },
          {
            project_id: projects[0].id,
            sender_id: user.id,
            content: 'I\'ve uploaded the initial wireframes for your review. Please let me know your thoughts!'
          }
        ];

        const { error: messagesError } = await supabase
          .from('messages')
          .insert(sampleMessages);

        if (messagesError) {
          console.error('Error creating sample messages:', messagesError);
        }

        // Create sample files for the first project
        const sampleFiles = [
          {
            project_id: projects[0].id,
            name: 'Project Requirements Document',
            type: 'link',
            url: 'https://docs.google.com/document/d/sample-requirements',
            uploaded_by: user.id
          },
          {
            project_id: projects[0].id,
            name: 'Design Inspiration Board',
            type: 'link',
            url: 'https://pinterest.com/sample-board',
            uploaded_by: user.id
          }
        ];

        const { error: filesError } = await supabase
          .from('files')
          .insert(sampleFiles);

        if (filesError) {
          console.error('Error creating sample files:', filesError);
        }
      }

      console.log('Sample projects created successfully');
    } catch (err) {
      console.error('Error creating sample projects:', err);
    }
  };
  const signOut = async () => {
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
    return { error };
  };

  return { 
    user, 
    loading, 
    error, 
    signIn, 
    signUp, 
    signOut,
    createSampleProjects
  };
}