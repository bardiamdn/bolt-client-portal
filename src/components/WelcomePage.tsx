import React from 'react';
import { LogOut, Briefcase, Users, Calendar, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';

export default function WelcomePage() {
  const { user, signOut } = useAuth();
  const { projects, loading: projectsLoading } = useProjects();
  const [creatingProjects, setCreatingProjects] = React.useState(false);

  const handleContinueToDashboard = () => {
    // Force a page refresh to reload projects
    window.location.reload();
  };

  const handleCreateSampleProjects = async () => {
    setCreatingProjects(true);
    try {
      // Import the createSampleProjects function from useAuth
      const { createSampleProjects } = useAuth();
      await createSampleProjects();
      // After creation, reload the page to show the dashboard
      window.location.reload();
    } catch (error) {
      console.error('Error creating sample projects:', error);
      setCreatingProjects(false);
    }
  };

  // If we have projects, show success state
  const hasProjects = projects.length > 0;
  const isLoading = projectsLoading || creatingProjects;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Sign Out */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-xl font-bold text-gray-900">frakt</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.user_metadata?.full_name || user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Welcome Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase size={32} className="text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to frakt!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your account has been created successfully. We're setting up some sample projects to help you get started with the platform.
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Briefcase size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Management</h3>
            <p className="text-gray-600">
              Organize and track your projects with detailed progress monitoring and task management.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h3>
            <p className="text-gray-600">
              Work together with real-time messaging, file sharing, and task assignments.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Management</h3>
            <p className="text-gray-600">
              Handle billing, track payments, and manage invoices all in one place.
            </p>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          {hasProjects ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Workspace Ready!
              </h2>
              <p className="text-gray-600 mb-6">
                Your sample projects have been created successfully. You can now explore all the features of the platform.
              </p>
              <button
                onClick={handleContinueToDashboard}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </>
          ) : isLoading ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Setting Up Your Workspace
              </h2>
              <p className="text-gray-600 mb-6">
                We're creating some sample projects to help you explore the platform. 
                This will only take a moment.
              </p>
              
              <div className="flex items-center justify-center space-x-2 text-purple-600 mb-6">
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Setting up your workspace...</span>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Getting Started
              </h2>
              <p className="text-gray-600 mb-6">
                Let's create some sample projects to help you explore the platform features.
              </p>
              <button
                onClick={handleCreateSampleProjects}
                disabled={creatingProjects}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{creatingProjects ? 'Creating Projects...' : 'Create Sample Projects'}</span>
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}