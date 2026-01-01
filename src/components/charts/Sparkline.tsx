"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showEndDot?: boolean;
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  color = "#3b82f6",
  showEndDot = true,
}: SparklineProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 2, right: showEndDot ? 4 : 2, bottom: 2, left: 2 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([d3.min(data) ?? 0, d3.max(data) ?? 0])
      .range([innerHeight, 0]);

    const line = d3
      .line<number>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Draw line
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Draw end dot
    if (showEndDot && data.length > 0) {
      g.append("circle")
        .attr("cx", xScale(data.length - 1))
        .attr("cy", yScale(data[data.length - 1]))
        .attr("r", 2.5)
        .attr("fill", color);
    }
  }, [data, width, height, color, showEndDot]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="overflow-visible"
    />
  );
}
