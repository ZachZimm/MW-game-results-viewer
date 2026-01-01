"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Transaction } from "@/lib/types";

interface TradeHeatmapProps {
  transactions: Transaction[];
  height?: number;
}

export function TradeHeatmap({ transactions, height = 180 }: TradeHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    date: string;
    count: number;
  }>({ show: false, x: 0, y: 0, date: "", count: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [height]);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Group transactions by date
    const tradeCounts = new Map<string, number>();
    transactions
      .filter((t) => !t.cancelReason)
      .forEach((t) => {
        const dateKey = t.orderDate.toISOString().split("T")[0];
        tradeCounts.set(dateKey, (tradeCounts.get(dateKey) || 0) + 1);
      });

    if (tradeCounts.size === 0) return;

    // Get date range
    const dates = Array.from(tradeCounts.keys()).sort();
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);

    // Calculate weeks
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    const current = new Date(startDate);
    current.setDate(current.getDate() - current.getDay()); // Start from Sunday

    while (current <= endDate) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    const cellSize = Math.min(14, (dimensions.width - 40) / weeks.length);
    const margin = { top: 20, right: 10, bottom: 10, left: 30 };

    const maxCount = Math.max(...Array.from(tradeCounts.values()));
    const colorScale = d3
      .scaleSequential()
      .domain([0, maxCount])
      .interpolator(d3.interpolate("#1e1e1e", "#22c55e"));

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Day labels
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    days.forEach((day, i) => {
      if (i % 2 === 1) {
        g.append("text")
          .attr("x", -5)
          .attr("y", i * cellSize + cellSize / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .attr("fill", "#a1a1a1")
          .attr("font-size", 9)
          .text(day);
      }
    });

    // Draw cells
    weeks.forEach((week, weekIndex) => {
      week.forEach((date, dayIndex) => {
        const dateKey = date.toISOString().split("T")[0];
        const count = tradeCounts.get(dateKey) || 0;

        const rect = g
          .append("rect")
          .attr("x", weekIndex * cellSize)
          .attr("y", dayIndex * cellSize)
          .attr("width", cellSize - 2)
          .attr("height", cellSize - 2)
          .attr("rx", 2)
          .attr("fill", count > 0 ? colorScale(count) : "#1e1e1e")
          .attr("stroke", count > 0 ? "none" : "#262626")
          .style("cursor", count > 0 ? "pointer" : "default");

        if (count > 0) {
          rect
            .on("mouseenter", (event) => {
              const containerRect = containerRef.current?.getBoundingClientRect();
              setTooltip({
                show: true,
                x: event.clientX - (containerRect?.left || 0),
                y: event.clientY - (containerRect?.top || 0),
                date: date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
                count,
              });
            })
            .on("mouseleave", () => {
              setTooltip((t) => ({ ...t, show: false }));
            });
        }
      });
    });

    // Month labels
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0];
      const month = firstDay.getMonth();
      if (month !== lastMonth) {
        g.append("text")
          .attr("x", weekIndex * cellSize)
          .attr("y", -5)
          .attr("fill", "#a1a1a1")
          .attr("font-size", 10)
          .text(
            firstDay.toLocaleDateString("en-US", { month: "short" })
          );
        lastMonth = month;
      }
    });
  }, [dimensions, transactions]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible"
      />
      {tooltip.show && (
        <div
          className="absolute z-50 bg-bg-secondary border border-border-color rounded px-2 py-1 text-xs shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 30,
          }}
        >
          <div className="text-text-secondary">{tooltip.date}</div>
          <div className="font-medium">{tooltip.count} trades</div>
        </div>
      )}
    </div>
  );
}
