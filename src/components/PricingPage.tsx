import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useStripe } from '../hooks/useStripe';

export default function PricingPage() {
  const { products, createCheckoutSession } = useStripe();
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);

  const handlePurchase = async (priceId: string, mode: 'payment' | 'subscription') => {
    setLoadingProduct(priceId);
    try {
      await createCheckoutSession(priceId, mode);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setLoadingProduct(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your project management needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 relative overflow-hidden">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {product.description}
                </p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {product.mode === 'subscription' ? '$99' : '$299'}
                  </span>
                  <span className="text-gray-600 ml-2">
                    {product.mode === 'subscription' ? '/month' : 'one-time'}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <Check size={20} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Advanced project management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check size={20} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Real-time collaboration</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check size={20} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">File sharing & storage</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check size={20} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Invoice management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check size={20} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Priority support</span>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(product.priceId, product.mode)}
                disabled={loadingProduct === product.priceId}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loadingProduct === product.priceId ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {product.mode === 'subscription' ? 'Start Subscription' : 'Purchase Now'}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}