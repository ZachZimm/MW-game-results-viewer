"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { PerformancePoint } from "@/lib/types";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import { PLAYER_COLORS } from "@/lib/constants";

interface PlayerPerformance {
  name: string;
  data: PerformancePoint[];
  color: string;
}

interface NetWorthChartProps {
  playersData: PlayerPerformance[];
  height?: number;
}
export function NetWorthChart({ playersData, height = 400 }: NetWorthChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [activePlayer, setActivePlayer] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    date: Date | null;
    values: { name: string; value: number; color: string }[];
  }>({ show: false, x: 0, y: 0, date: null, values: [] });

  // Handle resize
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

  // Draw chart
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || playersData.length === 0)
      return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 70 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    // Collect all dates and values
    const allDates: Date[] = [];
    const allValues: number[] = [];
    playersData.forEach((player) => {
      player.data.forEach((d) => {
        allDates.push(d.date);
        allValues.push(d.netWorth);
      });
    });

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(allDates) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([
        Math.min(d3.min(allValues) ?? 0, 100000) * 0.95,
        Math.max(d3.max(allValues) ?? 100000, 100000) * 1.05,
      ])
      .range([innerHeight, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "#262626").attr("stroke-opacity", 0.5)
      );

    // $100k reference line
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", yScale(100000))
      .attr("y2", yScale(100000))
      .attr("stroke", "#525252")
      .attr("stroke-dasharray", "4,4")
      .attr("stroke-width", 1);

    g.append("text")
      .attr("x", innerWidth - 5)
      .attr("y", yScale(100000) - 5)
      .attr("text-anchor", "end")
      .attr("fill", "#525252")
      .attr("font-size", 10)
      .text("Starting $100K");

    // Draw lines for each player
    const line = d3
      .line<PerformancePoint>()
      .defined((d) => d && d.date && !isNaN(d.netWorth))
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.netWorth))
      .curve(d3.curveMonotoneX);

    playersData.forEach((player) => {
      const isActive = activePlayer === null || activePlayer === player.name;
      const opacity = isActive ? 1 : 0.15;

      g.append("path")
        .datum(player.data)
        .attr("fill", "none")
        .attr("stroke", player.color)
        .attr("stroke-width", activePlayer === player.name ? 3 : 2)
        .attr("opacity", opacity)
        .attr("d", line)
        .style("cursor", "pointer")
        .on("mouseenter", () => setActivePlayer(player.name))
        .on("mouseleave", () => setActivePlayer(null));
    });

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(6)
          .tickFormat((d) => formatDateShort(d as Date))
      )
      .call((g) => g.select(".domain").attr("stroke", "#404040"))
      .call((g) => g.selectAll(".tick line").attr("stroke", "#404040"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#a1a1a1"));

    // Y axis
    g.append("g")
      .call(
        d3.axisLeft(yScale)
          .ticks(6)
          .tickFormat((d) => formatCurrency(d as number))
      )
      .call((g) => g.select(".domain").attr("stroke", "#404040"))
      .call((g) => g.selectAll(".tick line").attr("stroke", "#404040"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#a1a1a1"));

    // Hover interaction
    const bisect = d3.bisector<PerformancePoint, Date>((d) => d.date).left;

    const hoverLine = g
      .append("line")
      .attr("stroke", "#525252")
      .attr("stroke-width", 1)
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .style("display", "none");

    const hoverArea = g
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    hoverArea
      .on("mousemove", (event) => {
        const [mouseX] = d3.pointer(event);
        const date = xScale.invert(mouseX);

        hoverLine.attr("x1", mouseX).attr("x2", mouseX).style("display", "block");

        const values = playersData.map((player) => {
          const index = bisect(player.data, date);
          const d = player.data[Math.min(index, player.data.length - 1)];
          return {
            name: player.name,
            value: d?.netWorth ?? 0,
            color: player.color,
          };
        });

        values.sort((a, b) => b.value - a.value);

        const rect = containerRef.current?.getBoundingClientRect();
        setTooltip({
          show: true,
          x: (rect?.left ?? 0) + margin.left + mouseX,
          y: (rect?.top ?? 0) + margin.top,
          date,
          values,
        });
      })
      .on("mouseleave", () => {
        hoverLine.style("display", "none");
        setTooltip((t) => ({ ...t, show: false }));
      });
  }, [dimensions, playersData, activePlayer]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible"
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {playersData.map((player) => (
          <button
            key={player.name}
            className={`flex items-center gap-2 px-2 py-1 rounded transition-opacity ${
              activePlayer === null || activePlayer === player.name
                ? "opacity-100"
                : "opacity-40"
            }`}
            onMouseEnter={() => setActivePlayer(player.name)}
            onMouseLeave={() => setActivePlayer(null)}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: player.color }}
            />
            <span className="text-sm text-text-secondary">{player.name}</span>
          </button>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip.show && (() => {
        // Calculate tooltip position to prevent overflow
        const tooltipWidth = tooltipRef.current?.offsetWidth ?? 250; // Default width estimate
        const tooltipOffset = 10;
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
        
        // Check if tooltip would overflow on the right
        const wouldOverflow = tooltip.x + tooltipOffset + tooltipWidth > windowWidth;
        
        // Position tooltip on the left if it would overflow, otherwise on the right
        const leftPosition = wouldOverflow 
          ? tooltip.x - tooltipOffset - tooltipWidth 
          : tooltip.x + tooltipOffset;
        
        return (
          <div
            ref={tooltipRef}
            className="fixed z-50 bg-bg-secondary border border-border-color rounded-lg px-3 py-2 shadow-lg pointer-events-none"
            style={{
              left: leftPosition,
              top: tooltip.y,
              transform: "translateY(-50%)",
            }}
          >
            <div className="text-xs text-text-secondary mb-2">
              {tooltip.date && formatDateShort(tooltip.date)}
            </div>
            <div className="space-y-1">
              {tooltip.values.map((v) => (
                <div key={v.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: v.color }}
                  />
                  <span className="text-text-secondary">{v.name}:</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(v.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
