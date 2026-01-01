"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { PerformancePoint } from "@/lib/types";
import { formatPercent, formatDateShort } from "@/lib/utils/format";

interface PlayerPerformance {
  name: string;
  data: PerformancePoint[];
  color: string;
}

interface CapitalUseChartProps {
  playersData: PlayerPerformance[];
  height?: number;
}

export function CapitalUseChart({ playersData, height = 400 }: CapitalUseChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [activePlayer, setActivePlayer] = useState<string | null>(null);

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

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || playersData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    // Transform data to calculate capital use percentage
    // Capital Use % = (Invested Amount / Initial Capital) * 100
    // Invested Amount = Net Worth - Cash
    // But we need to normalize by initial capital ($100,000)
    const INITIAL_CAPITAL = 100000;
    
    const capitalUseData = playersData.map((player) => ({
      ...player,
      data: player.data.map((point) => {
        // Invested amount = Net Worth - Cash
        const investedAmount = point.netWorth - point.cash;
        // Capital use as percentage of initial capital
        const capitalUse = (investedAmount / INITIAL_CAPITAL) * 100;
        return {
          ...point,
          capitalUse,
        };
      }),
    }));

    // Get all dates from the first player (assuming all have same dates)
    const allDates = capitalUseData[0]?.data.map((d) => d.date) || [];

    // Find min and max capital use values for dynamic scaling
    const allCapitalUseValues = capitalUseData.flatMap((player) => 
      player.data.map((d) => d.capitalUse)
    );
    const minCapitalUse = Math.min(...allCapitalUseValues);
    const maxCapitalUse = Math.max(...allCapitalUseValues);
    
    // Add padding to the domain (15% on each side)
    const range = maxCapitalUse - minCapitalUse;
    const padding = range * 0.15;
    const yDomainMin = minCapitalUse - padding;
    const yDomainMax = maxCapitalUse + padding;

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(allDates) as [Date, Date])
      .range([0, innerWidth]);

    // Y scale for capital use percentage - now dynamic based on data
    const yScale = d3.scaleLinear().domain([yDomainMin, yDomainMax]).range([innerHeight, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid lines
    g.append("g")
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "#262626").attr("stroke-opacity", 0.5)
      );

    // Reference lines
    const referenceLines = [
      { value: 0, label: "0% (No Investment)", color: "#525252" },
      { value: 50, label: "50% (All Capital, No Margin)", color: "#22c55e" },
      { value: 100, label: "100% (Fully Invested with Margin)", color: "#f59e0b" },
    ];

    referenceLines.forEach((ref) => {
      // Only draw the line if it's within the visible range
      if (ref.value >= yDomainMin && ref.value <= yDomainMax) {
        g.append("line")
          .attr("x1", 0)
          .attr("x2", innerWidth)
          .attr("y1", yScale(ref.value))
          .attr("y2", yScale(ref.value))
          .attr("stroke", ref.color)
          .attr("stroke-dasharray", "4,4")
          .attr("stroke-width", 1.5);

        g.append("text")
          .attr("x", innerWidth - 5)
          .attr("y", yScale(ref.value) - 5)
          .attr("text-anchor", "end")
          .attr("fill", ref.color)
          .attr("font-size", 10)
          .text(ref.label);
      }
    });

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(8))
      .call((g) => g.select(".domain").attr("stroke", "#404040"))
      .call((g) => g.selectAll(".tick line").attr("stroke", "#404040"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#a1a1a1"));

    // Y axis
    g.append("g")
      .call(
        d3
          .axisLeft(yScale)
          .tickFormat((d) => `${d}%`)
          .ticks(10)
      )
      .call((g) => g.select(".domain").attr("stroke", "#404040"))
      .call((g) => g.selectAll(".tick line").attr("stroke", "#404040"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#a1a1a1"));

    // Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .attr("fill", "#a1a1a1")
      .attr("font-size", 12)
      .text("Capital Use %");

    // Line generator
    const line = d3
      .line<{ date: Date; capitalUse: number }>()
      .defined((d) => d && d.date && !isNaN(d.capitalUse))
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.capitalUse))
      .curve(d3.curveMonotoneX);

    // Draw lines for each player
    capitalUseData.forEach((player) => {
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
    </div>
  );
}
