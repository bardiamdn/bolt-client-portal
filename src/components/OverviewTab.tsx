import React from 'react';
import OutstandingItems from './OutstandingItems';
import BillingSection from './BillingSection';
import TasksSection from './TasksSection';
import FilesAndLinks from './FilesAndLinks';

interface OverviewTabProps {
  projectId: string;
}

export default function OverviewTab({ projectId }: OverviewTabProps) {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <OutstandingItems projectId={projectId} />
            <TasksSection projectId={projectId} />
          </div>
          
          {/* Right Column */}
          <div className="space-y-8">
            <BillingSection projectId={projectId} />
            <FilesAndLinks projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
}