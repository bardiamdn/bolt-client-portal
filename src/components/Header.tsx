import React from 'react';
import { Calendar } from 'lucide-react';

interface HeaderProps {
  projectName: string;
  companyName: string;
  dateRange: string;
}

export default function Header({ projectName, companyName, dateRange }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">{companyName}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">{projectName}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar size={16} />
          <span className="text-sm">{dateRange}</span>
        </div>
      </div>
    </div>
  );
}