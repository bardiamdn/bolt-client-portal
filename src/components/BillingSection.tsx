import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useInvoices } from '../hooks/useInvoices';

interface BillingSectionProps {
  projectId: string;
}

export default function BillingSection({ projectId }: BillingSectionProps) {
  const { invoices, loading, error, getBillingSummary } = useInvoices(projectId);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Billing</h2>
        <div className="text-gray-500">Loading billing information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Billing</h2>
        <div className="text-red-600">Error loading billing: {error}</div>
      </div>
    );
  }

  const { outstanding, overdue, paidPending } = getBillingSummary();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
        <button className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors">
          <span>View Invoices</span>
          <ExternalLink size={14} />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Outstanding</span>
          <span className="font-semibold text-gray-900">{outstanding}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Overdue</span>
          <span className="font-semibold text-gray-900">{overdue}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Paid & Pending</span>
          <span className="font-semibold text-gray-900">{paidPending}</span>
        </div>
      </div>
    </div>
  );
}