"use client";

import { Holding } from "@/lib/types";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils/format";

interface HoldingsTableProps {
  holdings: Holding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  return (
    <div className="bg-bg-secondary rounded-lg border border-border-color overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-color">
              <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Symbol
              </th>
              <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Shares
              </th>
              <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                % Portfolio
              </th>
              <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Price
              </th>
              <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Value
              </th>
              <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                Gain/Loss
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color">
            {holdings.map((holding) => {
              const gainColor =
                holding.gainLoss >= 0 ? "text-positive" : "text-negative";
              const priceChangeColor =
                holding.priceChange >= 0 ? "text-positive" : "text-negative";

              return (
                <tr
                  key={holding.symbol}
                  className="hover:bg-bg-tertiary transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">
                        {holding.symbol}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          holding.type === "BUY"
                            ? "bg-positive/10 text-positive"
                            : "bg-negative/10 text-negative"
                        }`}
                      >
                        {holding.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums">
                    {formatNumber(holding.shares)}
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${holding.percentOfPortfolio}%` }}
                        />
                      </div>
                      <span className="text-text-secondary">
                        {holding.percentOfPortfolio}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="tabular-nums">{formatCurrency(holding.price)}</div>
                    <div className={`text-xs ${priceChangeColor}`}>
                      {formatPercent(holding.priceChangePercent)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums font-medium">
                    {formatCurrency(holding.value)}
                  </td>
                  <td className={`px-4 py-4 text-right ${gainColor}`}>
                    <div className="tabular-nums">{formatCurrency(holding.gainLoss)}</div>
                    <div className="text-xs">
                      {formatPercent(holding.gainLossPercent)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
