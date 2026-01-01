"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { PerformancePoint } from "@/lib/types";
import { formatDateShort } from "@/lib/utils/format";

interface PlayerRankData {
  name: string;
  data: PerformancePoint[];
  color: string;
}

interface BumpChartProps {
  playersData: PlayerRankData[];
  height?: number;
}

export function BumpChart({ playersData, height = 350 }: BumpChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [activePlayer, setActivePlayer] = useState<string | null>(null);

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
    if (!svgRef.current || dimensions.width === 0 || playersData.length === 0)
      return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 120, bottom: 40, left: 50 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    // Get all dates
    const allDates: Date[] = [];
    playersData.forEach((player) => {
      player.data.forEach((d) => allDates.push(d.date));
    });
    const uniqueDates = [...new Set(allDates.map((d) => d.getTime()))].map(
      (t) => new Date(t)
    );
    uniqueDates.sort((a, b) => a.getTime() - b.getTime());

    // Sample dates if too many (show ~30 points)
    const sampledDates =
      uniqueDates.length > 60
        ? uniqueDates.filter((_, i) => i % Math.ceil(uniqueDates.length / 60) === 0)
        : uniqueDates;

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(sampledDates) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([1, playersData.length])
      .range([0, innerHeight]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid lines for ranks
    for (let i = 1; i <= playersData.length; i++) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", yScale(i))
        .attr("y2", yScale(i))
        .attr("stroke", "#262626")
        .attr("stroke-opacity", 0.5);

      g.append("text")
        .attr("x", -10)
        .attr("y", yScale(i))
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", "#a1a1a1")
        .attr("font-size", 12)
        .text(`#${i}`);
    }

    // Line generator with step interpolation for rank changes
    const line = d3
      .line<PerformancePoint>()
      .defined((d) => d && d.date && !isNaN(d.rank))
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.rank))
      .curve(d3.curveMonotoneX);

    // Draw lines for each player
    playersData.forEach((player) => {
      const isActive = activePlayer === null || activePlayer === player.name;
      const opacity = isActive ? 1 : 0.15;

      // Filter to sampled dates
      const filteredData = player.data.filter((d) =>
        sampledDates.some((sd) => sd.getTime() === d.date.getTime())
      );

      g.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", player.color)
        .attr("stroke-width", activePlayer === player.name ? 4 : 2.5)
        .attr("opacity", opacity)
        .attr("d", line)
        .style("cursor", "pointer")
        .on("mouseenter", () => setActivePlayer(player.name))
        .on("mouseleave", () => setActivePlayer(null));

      // End label
      const lastPoint = filteredData[filteredData.length - 1];
      if (lastPoint) {
        g.append("text")
          .attr("x", innerWidth + 8)
          .attr("y", yScale(lastPoint.rank))
          .attr("dy", "0.35em")
          .attr("fill", player.color)
          .attr("font-size", 11)
          .attr("font-weight", activePlayer === player.name ? "600" : "400")
          .attr("opacity", opacity)
          .style("cursor", "pointer")
          .text(player.name)
          .on("mouseenter", () => setActivePlayer(player.name))
          .on("mouseleave", () => setActivePlayer(null));
      }
    });

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight + 10})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickFormat((d) => formatDateShort(d as Date))
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .call((g) => g.selectAll(".tick text").attr("fill", "#a1a1a1"));
  }, [dimensions, playersData, activePlayer]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible"
      />
    </div>
  );
}
