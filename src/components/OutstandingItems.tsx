import React from 'react';
import { FileText, ClipboardList, Eye } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import TaskModal from './TaskModal';

interface OutstandingItemsProps {
  projectId: string;
}

export default function OutstandingItems({ projectId }: OutstandingItemsProps) {
  const { tasks, loading, error } = useTasks(projectId);
  const [selectedTask, setSelectedTask] = React.useState<any | null>(null);
  
  // Show only high priority pending tasks
  const outstandingTasks = tasks.filter(task => 
    task.status === 'pending' && task.priority === 'high'
  )
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  .slice(0, 5); // Show up to 5 tasks for scrolling

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Items</h2>
        <div className="text-gray-500">Loading outstanding items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Items</h2>
        <div className="text-red-600">Error loading items: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Items</h2>
      {outstandingTasks.length === 0 ? (
        <div className="text-gray-500 text-center py-4">No outstanding items</div>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
          {outstandingTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                {task.type === 'invoice' ? (
                  <FileText size={20} className="text-gray-400" />
                ) : (
                  <ClipboardList size={20} className="text-gray-400" />
                )}
                <span className="font-medium text-gray-900">{task.title}</span>
              </div>
              <button 
                onClick={() => setSelectedTask(task)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Eye size={16} />
                <span>View</span>
              </button>
            </div>
          ))}
        </div>
      )}
      
      <TaskModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onSave={async () => {}} // Read-only in overview
        mode="view"
      />
    </div>
  );
}