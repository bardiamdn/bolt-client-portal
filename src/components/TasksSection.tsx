import React from 'react';
import { FileText, ClipboardList, Eye } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import TaskModal from './TaskModal';

interface TasksSectionProps {
  projectId: string;
}

export default function TasksSection({ projectId }: TasksSectionProps) {
  const { tasks, loading, error } = useTasks(projectId);
  const [selectedTask, setSelectedTask] = React.useState<any | null>(null);
  
  // Show only pending tasks and limit to 3 for overview
  const pendingTasks = tasks
    .filter(task => task.status === 'pending')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
        <div className="text-red-600">Error loading tasks: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
      {pendingTasks.length === 0 ? (
        <div className="text-gray-500 text-center py-4">No pending tasks</div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {pendingTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                {task.type === 'invoice' ? (
                  <FileText size={20} className="text-gray-400" />
                ) : (
                  <ClipboardList size={20} className="text-gray-400" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{task.title}</div>
                  <div className="text-xs text-gray-500">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTask(task)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
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