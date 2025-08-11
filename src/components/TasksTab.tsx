import React from 'react';
import { FileText, ClipboardList, Plus, CheckCircle, Edit, Eye } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import TaskModal from './TaskModal';
import { useProjectMembers } from '../hooks/useProjectMembers';

interface TasksTabProps {
  projectId: string;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    case 'pending': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function TasksTab({ projectId }: TasksTabProps) {
  const { tasks, loading, error, updateTaskStatus, createTask, updateTask } = useTasks(projectId);
  const { members } = useProjectMembers(projectId);
  const [modalState, setModalState] = React.useState<{
    isOpen: boolean;
    mode: 'create' | 'view' | 'edit';
    task: any | null;
  }>({
    isOpen: false,
    mode: 'create',
    task: null
  });

  const handleStatusToggle = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateTaskStatus(taskId, newStatus as any);
  };

  const handleCreateTask = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      task: null
    });
  };

  const handleViewTask = (task: any) => {
    setModalState({
      isOpen: true,
      mode: 'view',
      task
    });
  };

  const handleEditTask = (task: any) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      task
    });
  };

  const handleSaveTask = async (taskData: any) => {
    if (modalState.mode === 'create') {
      await createTask({
        ...taskData,
        project_id: projectId
      });
    } else if (modalState.mode === 'edit' && modalState.task) {
      await updateTask(modalState.task.id, taskData);
    }
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      task: null
    });
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-gray-500">Loading tasks...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-red-600">Error loading tasks: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Tasks</h2>
            <button 
              onClick={handleCreateTask}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          </div>
          
          {tasks.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No tasks found for this project
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <button
                        onClick={() => handleStatusToggle(task.id, task.status)}
                        className={`p-1 rounded-full transition-colors ${
                          task.status === 'completed' 
                            ? 'text-green-600 hover:text-green-700' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <CheckCircle size={20} />
                      </button>
                      {task.type === 'invoice' ? (
                        <FileText size={20} className="text-gray-400" />
                      ) : (
                        <ClipboardList size={20} className="text-gray-400" />
                      )}
                      <div className="flex-1">
                        <h3 className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {task.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewTask(task)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View task"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleEditTask(task)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit task"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <TaskModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          task={modalState.task}
          onSave={handleSaveTask}
          mode={modalState.mode}
          projectMembers={members}
        />
      </div>
    </div>
  );
}