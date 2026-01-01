"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Holding } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

interface DonutChartProps {
  holdings: Holding[];
  size?: number;
}

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
];

export function DonutChart({ holdings, size = 280 }: DonutChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeSlice, setActiveSlice] = useState<string | null>(null);

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  useEffect(() => {
    if (!svgRef.current || holdings.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const radius = size / 2;
    const innerRadius = radius * 0.6;

    const g = svg
      .append("g")
      .attr("transform", `translate(${radius},${radius})`);

    const pie = d3
      .pie<Holding>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<Holding>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 2);

    const arcHover = d3
      .arc<d3.PieArcDatum<Holding>>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 4);

    g.selectAll("path")
      .data(pie(holdings))
      .enter()
      .append("path")
      .attr("d", arc as unknown as string)
      .attr("fill", (_, i) => COLORS[i % COLORS.length])
      .attr("stroke", "#0a0a0a")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function (_, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("d", arcHover(d) as string);
        setActiveSlice(d.data.symbol);
      })
      .on("mouseleave", function (_, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("d", arc(d) as string);
        setActiveSlice(null);
      });

    // Center text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.5em")
      .attr("fill", "#a1a1a1")
      .attr("font-size", 12)
      .text("Total Value");

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.8em")
      .attr("fill", "#fafafa")
      .attr("font-size", 20)
      .attr("font-weight", "600")
      .text(formatCurrency(totalValue));
  }, [holdings, size, totalValue]);

  const activeHolding = activeSlice
    ? holdings.find((h) => h.symbol === activeSlice)
    : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg ref={svgRef} width={size} height={size} />
        {activeHolding && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-sm text-text-secondary">
                {activeHolding.symbol}
              </div>
              <div className="text-lg font-semibold">
                {formatCurrency(activeHolding.value)}
              </div>
              <div className="text-sm text-text-secondary">
                {activeHolding.percentOfPortfolio}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4">
        {holdings.map((holding, index) => (
          <div
            key={holding.symbol}
            className={`flex items-center gap-2 transition-opacity ${
              activeSlice && activeSlice !== holding.symbol ? "opacity-40" : ""
            }`}
            onMouseEnter={() => setActiveSlice(holding.symbol)}
            onMouseLeave={() => setActiveSlice(null)}
          >
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-text-primary truncate">
              {holding.symbol}
            </span>
            <span className="text-sm text-text-secondary ml-auto">
              {holding.percentOfPortfolio}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
