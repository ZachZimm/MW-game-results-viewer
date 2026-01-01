"use client";

import { useState } from "react";
import { Transaction } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils/format";

interface TransactionsTableProps {
  transactions: Transaction[];
  initialLimit?: number;
}

export function TransactionsTable({
  transactions,
  initialLimit = 20,
}: TransactionsTableProps) {
  const [limit, setLimit] = useState(initialLimit);
  const [filter, setFilter] = useState<string>("all");

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "all") return true;
    return t.type.toLowerCase() === filter;
  });

  const displayedTransactions = filteredTransactions.slice(0, limit);
  const hasMore = filteredTransactions.length > limit;

  const typeColors: Record<string, string> = {
    Buy: "bg-positive/10 text-positive",
    Sell: "bg-negative/10 text-negative",
    Short: "bg-amber-500/10 text-amber-500",
    Cover: "bg-blue-500/10 text-blue-500",
  };

  return (
    <div className="bg-bg-secondary rounded-lg border border-border-color overflow-hidden">
      {/* Filters */}
      <div className="px-4 py-3 border-b border-border-color flex items-center gap-2">
        <span className="text-sm text-text-secondary">Filter:</span>
        {["all", "buy", "sell", "short", "cover"].map((type) => (
          <button
            key={type}
            onClick={() => {
              setFilter(type);
              setLimit(initialLimit);
            }}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              filter === type
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        <span className="text-xs text-text-secondary ml-auto">
          {filteredTransactions.length} transactions
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-color">
              <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Date
              </th>
              <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Symbol
              </th>
              <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Type
              </th>
              <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Shares
              </th>
              <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Price
              </th>
              <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color">
            {displayedTransactions.map((transaction, index) => {
              const total =
                transaction.price && transaction.amount
                  ? transaction.price * transaction.amount
                  : null;
              const isCancelled = !!transaction.cancelReason;

              return (
                <tr
                  key={`${transaction.symbol}-${transaction.orderDate.getTime()}-${index}`}
                  className={`hover:bg-bg-tertiary transition-colors ${
                    isCancelled ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {formatDate(transaction.orderDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-text-primary">
                      {transaction.symbol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        typeColors[transaction.type] || "bg-bg-tertiary"
                      }`}
                    >
                      {transaction.type}
                    </span>
                    {isCancelled && (
                      <span className="text-xs text-text-secondary ml-2">
                        (Cancelled)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatNumber(transaction.amount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                    {transaction.price ? formatCurrency(transaction.price) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {total ? formatCurrency(total) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="px-4 py-3 border-t border-border-color text-center">
          <button
            onClick={() => setLimit((l) => l + 50)}
            className="text-sm text-accent hover:text-accent/80 transition-colors"
          >
            Load more ({filteredTransactions.length - limit} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
