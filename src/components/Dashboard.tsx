import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import ProjectHeader from './ProjectHeader';
import TabNavigation from './TabNavigation';
import OverviewTab from './OverviewTab';
import TasksTab from './TasksTab';
import MessagesTab from './MessagesTab';
import BillingTab from './BillingTab';
import { useProjects } from '../hooks/useProjects';
import WelcomePage from './WelcomePage';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'messages', label: 'Messages' },
  { id: 'billing', label: 'Billing' }
];

export default function Dashboard() {
  const { projects, loading: projectsLoading } = useProjects();
  const [selectedProject, setSelectedProject] = useState('coreflux');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Set first project as selected when projects load
  React.useEffect(() => {
    if (projects.length > 0 && !projects.find(p => p.id === selectedProject)) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  const currentProject = projects.find(p => p.id === selectedProject);

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
          </div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <WelcomePage />
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab projectId={selectedProject} />;
      case 'tasks':
        return <TasksTab projectId={selectedProject} />;
      case 'messages':
        return <MessagesTab projectId={selectedProject} />;
      case 'billing':
        return <BillingTab projectId={selectedProject} />;
      default:
        return <OverviewTab projectId={selectedProject} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-300 ease-in-out lg:transition-none
      `}>
        <Sidebar 
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={(projectId) => {
            setSelectedProject(projectId);
            setSidebarOpen(false); // Close sidebar on mobile after selection
          }}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile menu button */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <Header 
          projectName={currentProject.name}
          companyName={currentProject.company.name}
          dateRange={`${new Date(currentProject.start_date).toLocaleDateString()} - ${new Date(currentProject.end_date).toLocaleDateString()}`}
        />
        
        <ProjectHeader 
          title={currentProject.title}
          description={currentProject.description}
          progress={currentProject.progress}
          icon={currentProject.icon}
          iconBg={currentProject.icon_bg}
        />
        
        <TabNavigation 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}