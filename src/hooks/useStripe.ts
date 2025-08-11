import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { products, getProductByPriceId } from '../stripe-config';

export interface StripeSubscription {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export interface StripeOrder {
  order_id: number;
  checkout_session_id: string;
  payment_intent_id: string;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

export function useStripe() {
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null);
  const [orders, setOrders] = useState<StripeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStripeData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch subscription data
        const { data: subData, error: subError } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        if (subError) {
          console.error('Error fetching subscription:', subError);
        } else {
          setSubscription(subData);
        }

        // Fetch orders data
        const { data: ordersData, error: ordersError } = await supabase
          .from('stripe_user_orders')
          .select('*')
          .order('order_date', { ascending: false });

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
        } else {
          setOrders(ordersData || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch Stripe data');
      } finally {
        setLoading(false);
      }
    };

    fetchStripeData();
  }, []);

  const createCheckoutSession = async (priceId: string, mode: 'payment' | 'subscription') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const baseUrl = window.location.origin;
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          mode,
          success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/pricing`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create checkout session');
    }
  };

  const getActiveSubscriptionPlan = () => {
    if (!subscription || !subscription.price_id) return null;
    
    const product = getProductByPriceId(subscription.price_id);
    return product ? product.name : null;
  };

  const hasActiveSubscription = () => {
    return subscription?.subscription_status === 'active';
  };

  return {
    subscription,
    orders,
    loading,
    error,
    createCheckoutSession,
    getActiveSubscriptionPlan,
    hasActiveSubscription,
    products
  };
}