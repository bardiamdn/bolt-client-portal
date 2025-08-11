import React from 'react';
import { Crown, Calendar, CreditCard } from 'lucide-react';
import { useStripe } from '../hooks/useStripe';

export default function SubscriptionStatus() {
  const { subscription, loading, getActiveSubscriptionPlan, hasActiveSubscription } = useStripe();

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const activePlan = getActiveSubscriptionPlan();
  const isActive = hasActiveSubscription();

  if (!subscription || !activePlan) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <Crown size={16} className="text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900">No Active Plan</p>
            <p className="text-sm text-gray-500">Upgrade to access premium features</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-3 mb-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isActive ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          <Crown size={16} className={isActive ? 'text-green-600' : 'text-yellow-600'} />
        </div>
        <div>
          <p className="font-medium text-gray-900">{activePlan}</p>
          <p className={`text-sm ${isActive ? 'text-green-600' : 'text-yellow-600'}`}>
            {subscription.subscription_status.replace('_', ' ')}
          </p>
        </div>
      </div>

      {subscription.current_period_end && (
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar size={14} />
            <span>
              {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
              {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
            </span>
          </div>
          
          {subscription.payment_method_brand && subscription.payment_method_last4 && (
            <div className="flex items-center space-x-2">
              <CreditCard size={14} />
              <span>
                {subscription.payment_method_brand.toUpperCase()} ending in {subscription.payment_method_last4}
              </span>
            </div>
          )}
        </div>
      )}

      {subscription.cancel_at_period_end && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Your subscription will not renew automatically
          </p>
        </div>
      )}
    </div>
  );
}