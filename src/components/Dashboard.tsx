import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ProjectHeader from './ProjectHeader';
import TabNavigation from './TabNavigation';
import OverviewTab from './OverviewTab';
import TasksTab from './TasksTab';
import MessagesTab from './MessagesTab';
import BillingTab from './BillingTab';
import { useProjects } from '../hooks/useProjects';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No projects found</p>
        </div>
      </div>
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
      <Sidebar 
        projects={projects}
        selectedProject={selectedProject}
        onProjectSelect={setSelectedProject}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
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