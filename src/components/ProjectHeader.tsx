import React from 'react';

interface ProjectHeaderProps {
  title: string;
  description: string;
  progress: number;
  icon: string;
  iconBg: string;
}

export default function ProjectHeader({ title, description, progress, icon, iconBg }: ProjectHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 lg:px-8 py-6">
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 ${iconBg} rounded-full flex items-center justify-center text-white text-xl font-bold`}>
          {icon}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 mb-4">{description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <span className="text-sm font-medium text-gray-900">{progress}% completed</span>
        </div>
      </div>
    </div>
  );
}