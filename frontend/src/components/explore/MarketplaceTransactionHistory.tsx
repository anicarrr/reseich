'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Eye, Download, Clock, CheckCircle, XCircle, ShoppingCart, ArrowUpRight, Tag } from 'lucide-react';
import type { Transaction, MarketplaceListing } from '@/lib/types';

interface MarketplaceTransactionHistoryProps {
  transactions: Transaction[];
  listings: MarketplaceListing[];
  onViewTransaction: (id: string) => void;
  onDownloadReceipt: (id: string) => void;
  onVerifyAccess: (listingId: string | null) => Promise<boolean>;
  isLoading?: boolean;
}

const MARKETPLACE_TRANSACTION_TYPES = {
  marketplace_purchase: { label: 'Purchase', icon: ShoppingCart, color: 'bg-green-100 text-green-800' },
  marketplace_sale: { label: 'Sale', icon: ArrowUpRight, color: 'bg-blue-100 text-blue-800' },
  access_granted: { label: 'Access Granted', icon: CheckCircle, color: 'bg-purple-100 text-purple-800' },
  access_revoked: { label: 'Access Revoked', icon: XCircle, color: 'bg-red-100 text-red-800' }
};

export const MarketplaceTransactionHistory: React.FC<MarketplaceTransactionHistoryProps> = ({
  transactions,
  listings,
  onViewTransaction,
  onDownloadReceipt,
  onVerifyAccess,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAccessVerification, setShowAccessVerification] = useState<string | null>(null);

  const marketplaceTransactions = transactions.filter((t) => t.type === 'research_purchase' || t.type === 'research_sale');

  const filteredTransactions = marketplaceTransactions.filter((transaction) => {
    const matchesSearch =
      (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transaction_hash?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTransactionTypeInfo = (type: string) => {
    return (
      MARKETPLACE_TRANSACTION_TYPES[type as keyof typeof MARKETPLACE_TRANSACTION_TYPES] || {
        label: type,
        icon: Tag,
        color: 'bg-gray-100 text-gray-800'
      }
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    const typeInfo = getTransactionTypeInfo(type);
    const IconComponent = typeInfo.icon;
    return <IconComponent className="h-4 w-4" />;
  };

  const getListingTitle = (transaction: Transaction) => {
    if (transaction.metadata?.listing_id) {
      const listing = listings.find((l) => l.id === transaction.metadata!.listing_id);
      return listing?.title || 'Unknown Listing';
    }
    return 'Unknown Listing';
  };

  const handleVerifyAccess = async (listingId: string) => {
    try {
      const hasAccess = await onVerifyAccess(listingId);
      if (hasAccess) {
        setShowAccessVerification(null);
        // Show success message or redirect to research content
      }
    } catch (err) {
      console.error('Error verifying access:', err);
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Listing', 'Amount (SEI)', 'Status', 'Transaction Hash'],
      ...filteredTransactions.map((t) => [
        formatDate(t.created_at),
        getTransactionTypeInfo(t.type).label,
        getListingTitle(t),
        t.amount_sei,
        t.status,
        t.transaction_hash || '-'
      ])
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketplace-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketplace Transactions</h2>
          <p className="text-muted-foreground">View your marketplace purchases, sales, and access history</p>
        </div>
        <Button onClick={exportTransactions} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="marketplace_purchase">Purchases</option>
              <option value="marketplace_sale">Sales</option>
              <option value="access_granted">Access Granted</option>
              <option value="access_revoked">Access Revoked</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No marketplace transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${getTransactionTypeInfo(transaction.type).color}`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {formatDate(transaction.created_at)}
                        <span>•</span>
                        <span>{getListingTitle(transaction)}</span>
                        {transaction.transaction_hash && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs">
                              {transaction.transaction_hash.slice(0, 6)}...{transaction.transaction_hash.slice(-4)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{transaction.amount_sei} SEI</div>
                      <div className="text-sm text-muted-foreground">{getTransactionTypeInfo(transaction.type).label}</div>
                    </div>

                    <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                      {transaction.status}
                    </Badge>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onViewTransaction(transaction.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {transaction.status === 'completed' && (
                        <Button variant="ghost" size="sm" onClick={() => onDownloadReceipt(transaction.id)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {transaction.type === 'research_purchase' && transaction.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setShowAccessVerification(
                              typeof transaction.metadata?.listing_id === 'string' ? transaction.metadata.listing_id : null
                            )
                          }
                        >
                          Verify Access
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Verification Modal */}
      {showAccessVerification && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <CardContent className="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-md mx-4">
            <CardHeader>
              <CardTitle>Verify Access</CardTitle>
              <p className="text-muted-foreground">Verify your access to this research item</p>
            </CardHeader>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAccessVerification(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleVerifyAccess(showAccessVerification)}>Verify</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
