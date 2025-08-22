import React from 'react';
import { 
  LayoutDashboard, 
  User, 
  CreditCard,
  LogOut,
  X
} from 'lucide-react';
import { Project } from '../hooks/useProjects';
import { useAuth } from '../hooks/useAuth';
import SubscriptionStatus from './SubscriptionStatus';

interface SidebarProps {
  projects: Project[];
  selectedProject: string;
  onProjectSelect: (projectId: string) => void;
  onClose?: () => void;
}

export default function Sidebar({ projects, selectedProject, onProjectSelect, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Mobile close button */}
      {onClose && (
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}
      
      {/* Logo */}
      <div className={`p-6 border-b border-gray-100 ${onClose ? 'lg:pt-6 pt-2' : ''}`}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
          </div>
          <span className="text-xl font-bold text-gray-900">frakt</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6">
        {/* Overview */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
            <LayoutDashboard size={20} />
            <span className="font-medium">Overview</span>
          </div>
          <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
            <CreditCard size={20} />
            <span className="font-medium">Pricing</span>
          </div>
        </div>

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between px-3 py-2 mb-4">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Projects</span>
          </div>
          
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onProjectSelect(project.id)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedProject === project.id 
                    ? 'bg-purple-50 text-purple-900' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 ${project.icon_bg} rounded-lg flex items-center justify-center text-white text-sm font-semibold`}>
                  {project.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{project.name}</div>
                  <div className="text-xs text-gray-500 truncate">{project.company.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="px-4 mb-4">
        <SubscriptionStatus />
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">{user?.user_metadata?.full_name || user?.email}</div>
          </div>
          <button
            onClick={signOut}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}