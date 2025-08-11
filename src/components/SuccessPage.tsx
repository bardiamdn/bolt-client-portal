import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import { useStripe } from '../hooks/useStripe';

export default function SuccessPage() {
  const { getActiveSubscriptionPlan } = useStripe();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const activePlan = getActiveSubscriptionPlan();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdParam = urlParams.get('session_id');
    setSessionId(sessionIdParam);
  }, []);

  const handleReturnHome = () => {
    window.location.href = '/';
  };

  const handleViewDashboard = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your payment has been processed successfully.
        </p>

        {activePlan && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-800">
              <span className="font-medium">Active Plan:</span> {activePlan}
            </p>
          </div>
        )}

        {sessionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 mb-1">Session ID</p>
            <p className="text-sm font-mono text-gray-700 break-all">{sessionId}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleViewDashboard}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Go to Dashboard</span>
            <ArrowRight size={16} />
          </button>
          
          <button
            onClick={handleReturnHome}
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Home size={16} />
            <span>Return Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}