import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Invoice {
  id: string;
  project_id: string;
  invoice_number: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  issue_date: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export function useInvoices(projectId?: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        let query = supabase
          .from('invoices')
          .select('*')
          .order('issue_date', { ascending: false });

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setInvoices(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [projectId]);

  const getBillingSummary = () => {
    const outstanding = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const overdue = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const paid = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    return {
      outstanding: `$${outstanding.toLocaleString()}`,
      overdue: `$${overdue.toLocaleString()}`,
      paidPending: `$${paid.toLocaleString()}`
    };
  };

  return { invoices, loading, error, getBillingSummary };
}