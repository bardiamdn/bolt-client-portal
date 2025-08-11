import React from 'react';
import { useState } from 'react';
import { Download, Eye, Calendar, X } from 'lucide-react';
import { useInvoices } from '../hooks/useInvoices';
import { useStripe } from '../hooks/useStripe';

interface BillingTabProps {
  projectId: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function BillingTab({ projectId }: BillingTabProps) {
  const { invoices, loading, error, getBillingSummary } = useInvoices(projectId);
  const { createCheckoutSession } = useStripe();
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);

  const handleViewInvoice = (invoice: any) => {
    setViewingInvoice(invoice);
  };

  const handleDownloadInvoice = (invoice: any) => {
    // Create HTML content for the invoice
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Invoice ${invoice.number}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            color: #333; 
            line-height: 1.6;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
        }
        .invoice-title { 
            font-size: 32px; 
            font-weight: bold; 
            margin-bottom: 10px; 
        }
        .invoice-details { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
        }
        .detail-section { 
            flex: 1; 
        }
        .detail-section h3 { 
            font-size: 16px; 
            margin-bottom: 10px; 
            color: #666; 
        }
        .detail-section p { 
            margin: 5px 0; 
            font-size: 14px; 
        }
        .amount-section { 
            text-align: right; 
            margin: 30px 0; 
        }
        .amount { 
            font-size: 28px; 
            font-weight: bold; 
            color: #333; 
        }
        .status { 
            display: inline-block; 
            padding: 5px 15px; 
            border-radius: 20px; 
            font-size: 12px; 
            font-weight: bold; 
            text-transform: uppercase; 
            margin-top: 10px;
        }
        .status.paid { background-color: #d4edda; color: #155724; }
        .status.pending { background-color: #fff3cd; color: #856404; }
        .status.overdue { background-color: #f8d7da; color: #721c24; }
        .status.cancelled { background-color: #f8f9fa; color: #6c757d; }
        .description { 
            margin: 30px 0; 
            padding: 20px; 
            background-color: #f8f9fa; 
            border-radius: 5px; 
        }
        .footer { 
            margin-top: 50px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #ddd; 
            padding-top: 20px; 
        }
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="invoice-title">INVOICE</div>
        <div>Invoice #${invoice.number}</div>
    </div>
    
    <div class="invoice-details">
        <div class="detail-section">
            <h3>Invoice Details</h3>
            <p><strong>Invoice Number:</strong> ${invoice.number}</p>
            <p><strong>Issue Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
        </div>
        <div class="detail-section">
            <h3>Status & Payment</h3>
            <div class="status ${invoice.status}">${invoice.status}</div>
            <div class="amount-section">
                <div class="amount">$${invoice.amount.toLocaleString()}</div>
            </div>
        </div>
    </div>
    
    ${invoice.description ? `
    <div class="description">
        <h3>Description</h3>
        <p>${invoice.description}</p>
    </div>
    ` : ''}
    
    <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for printing
    const printWindow = window.open(url, '_blank');
    
    // Clean up the blob URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handlePayInvoice = async (invoice: any) => {
    setPayingInvoice(invoice.id);
    try {
      // Create a dynamic price for this invoice amount
      const baseUrl = window.location.origin;
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          invoice_id: invoice.id,
          amount: Math.round(invoice.amount * 100), // Convert to cents
          currency: 'usd',
          description: `Payment for Invoice ${invoice.number}`,
          mode: 'payment',
          success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoice.id}`,
          cancel_url: `${baseUrl}/?tab=billing`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Payment error:', err);
      alert('Failed to start payment process. Please try again.');
    } finally {
      setPayingInvoice(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-gray-500">Loading billing information...</div>
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
            <div className="text-red-600">Error loading billing: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  const { outstanding, overdue, paidPending } = getBillingSummary();

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Outstanding</h3>
            <p className="text-2xl font-bold text-gray-900">{outstanding}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Overdue</h3>
            <p className="text-2xl font-bold text-red-600">{overdue}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Paid & Pending</h3>
            <p className="text-2xl font-bold text-green-600">{paidPending}</p>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Invoices</h2>
          </div>
          
          {invoices.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No invoices found for this project
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{invoice.number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{invoice.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">${invoice.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewInvoice(invoice)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="View Invoice"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Download Invoice"
                          >
                            <Download size={16} />
                          </button>
                          {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                            <button 
                              onClick={() => handlePayInvoice(invoice)}
                              disabled={payingInvoice === invoice.id}
                              className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Pay Invoice"
                            >
                              {payingInvoice === invoice.id ? 'Processing...' : 'Pay'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invoice View Modal */}
        {viewingInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Invoice {viewingInvoice.number}
                </h2>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Invoice Header */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Invoice Details</h3>
                    <div className="space-y-1">
                      <p className="text-sm"><span className="font-medium">Number:</span> {viewingInvoice.number}</p>
                      <p className="text-sm"><span className="font-medium">Issue Date:</span> {new Date(viewingInvoice.issue_date).toLocaleDateString()}</p>
                      <p className="text-sm"><span className="font-medium">Due Date:</span> {new Date(viewingInvoice.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Status & Amount</h3>
                    <div className="space-y-2">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingInvoice.status)}`}>
                        {viewingInvoice.status}
                      </span>
                      <p className="text-2xl font-bold text-gray-900">${viewingInvoice.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {viewingInvoice.description || 'No description provided'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDownloadInvoice(viewingInvoice)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Download size={16} />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => setViewingInvoice(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}