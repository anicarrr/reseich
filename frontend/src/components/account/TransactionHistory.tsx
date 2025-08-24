"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  ShoppingCart,
  Filter,
  Calendar,
  Eye,
  ArrowDownLeft,
  History,
  Clock,
  CircleDollarSign,
} from "lucide-react";
import type { Transaction } from "@/lib/types";

interface TransactionHistoryProps {
  transactions: Transaction[];
  onViewTransaction: (id: string) => void;
  onDownloadReceipt: (id: string) => void;
  isLoading?: boolean;
}

const TRANSACTION_TYPES = {
  credit_purchase: {
    label: "Credit Purchase",
    icon: "Coins",
    color: "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30",
  },
  marketplace_purchase: {
    label: "Marketplace Purchase",
    icon: "ShoppingCart",
    color: "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30",
  },
  research_spending: {
    label: "Research Spending",
    icon: "FileText",
    color: "bg-[#e9407a]/20 text-[#e9407a] border border-[#e9407a]/30",
  },
  credit_refund: {
    label: "Credit Refund",
    icon: "ArrowDownLeft",
    color: "bg-[#ff8a00]/20 text-[#ff8a00] border border-[#ff8a00]/30",
  },
};

const TRANSACTION_STATUSES = {
  completed: {
    label: "Completed",
    color: "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30",
  },
  pending: {
    label: "Pending",
    color: "bg-[#ff8a00]/20 text-[#ff8a00] border border-[#ff8a00]/30",
  },
  failed: {
    label: "Failed",
    color: "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-white/20 text-gray-300 border border-white/30",
  },
};

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onViewTransaction,
  onDownloadReceipt,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      (transaction.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.transaction_hash
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || transaction.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const transactionDate = new Date(transaction.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - transactionDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case "today":
          matchesDate = diffDays <= 1;
          break;
        case "week":
          matchesDate = diffDays <= 7;
          break;
        case "month":
          matchesDate = diffDays <= 30;
          break;
        case "year":
          matchesDate = diffDays <= 365;
          break;
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const getTransactionTypeInfo = (type: string) => {
    return (
      TRANSACTION_TYPES[type as keyof typeof TRANSACTION_TYPES] || {
        label: type,
        icon: "Tag",
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const getStatusInfo = (status: string) => {
    return (
      TRANSACTION_STATUSES[status as keyof typeof TRANSACTION_STATUSES] || {
        label: status,
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit_purchase":
        return <Download className="h-4 w-4" />;
      case "marketplace_purchase":
        return <ShoppingCart className="h-4 w-4" />;
      case "research_spending":
        return <Filter className="h-4 w-4" />;
      case "credit_refund":
        return <ArrowDownLeft className="h-4 w-4" />;
      case "marketplace_sale":
        return <CircleDollarSign className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      [
        "Date",
        "Type",
        "Description",
        "Amount (SEI)",
        "Credits",
        "Status",
        "Transaction Hash",
      ],
      ...filteredTransactions.map((t) => [
        formatDate(t.created_at),
        getTransactionTypeInfo(t.type).label,
        t.description,
        t.amount_sei,
        t.credits_amount || "-",
        getStatusInfo(t.status).label,
        t.transaction_hash || "-",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Transaction History</h2>
          <p className="text-gray-400">
            View all your credit purchases, marketplace transactions, and
            research spending
          </p>
        </div>
        <Button onClick={exportTransactions} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit_purchase">Credit Purchase</SelectItem>
                <SelectItem value="marketplace_purchase">
                  Marketplace Purchase
                </SelectItem>
                <SelectItem value="research_spending">
                  Research Spending
                </SelectItem>
                <SelectItem value="credit_refund">Credit Refund</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <History className="h-5 w-5" />
            Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e9407a] mx-auto"></div>
              <p className="mt-2 text-gray-400">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors bg-white/5 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${getTransactionTypeInfo(transaction.type).color}`}
                    >
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {transaction.description}
                      </div>
                      <div className="text-sm text-gray-400 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {formatDate(transaction.created_at)}
                        {transaction.transaction_hash && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs">
                              {transaction.transaction_hash.slice(0, 6)}...
                              {transaction.transaction_hash.slice(-4)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-white">
                        {transaction.amount_sei} SEI
                      </div>
                      {transaction.credits_amount && (
                        <div className="text-sm text-gray-400">
                          {transaction.credits_amount > 0 ? "+" : ""}
                          {transaction.credits_amount} credits
                        </div>
                      )}
                    </div>

                    <Badge className={getStatusInfo(transaction.status).color}>
                      {getStatusInfo(transaction.status).label}
                    </Badge>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewTransaction(transaction.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {transaction.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownloadReceipt(transaction.id)}
                        >
                          <Download className="h-4 w-4" />
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
    </div>
  );
};
