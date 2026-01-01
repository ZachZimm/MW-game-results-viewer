"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { formatPercent } from "@/lib/utils/format";

interface DataPoint {
  name: string;
  x: number; // volatility
  y: number; // return
  color: string;
}

interface ScatterPlotProps {
  data: DataPoint[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
}

export function ScatterPlot({
  data,
  height = 350,
  xLabel = "Volatility (Daily σ)",
  yLabel = "Total Return",
}: ScatterPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [activePoint, setActivePoint] = useState<string | null>(null);

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
    if (!svgRef.current || dimensions.width === 0 || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const xExtent = d3.extent(data, (d) => d.x) as [number, number];
    const yExtent = d3.extent(data, (d) => d.y) as [number, number];

    const xPadding = (xExtent[1] - xExtent[0]) * 0.15;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.15;

    const xScale = d3
      .scaleLinear()
      .domain([Math.max(0, xExtent[0] - xPadding), xExtent[1] + xPadding])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([innerHeight, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate efficient frontier (upper envelope)
    // Sort by risk (x) and find points that form the upper convex hull
    const sortedData = [...data].sort((a, b) => a.x - b.x);
    const frontierPoints: DataPoint[] = [];
    
    for (const point of sortedData) {
      // Keep point if it's better than all previous points at this risk level
      while (frontierPoints.length >= 2) {
        const last = frontierPoints[frontierPoints.length - 1];
        const secondLast = frontierPoints[frontierPoints.length - 2];
        
        // Calculate slopes
        const slope1 = (last.y - secondLast.y) / (last.x - secondLast.x);
        const slope2 = (point.y - last.y) / (point.x - last.x);
        
        // If new point creates a better slope, remove the last point
        if (slope2 > slope1) {
          frontierPoints.pop();
        } else {
          break;
        }
      }
      
      // Add point if it's better than the last point or it's the first point
      if (frontierPoints.length === 0 || point.y > frontierPoints[frontierPoints.length - 1].y) {
        frontierPoints.push(point);
      }
    }

    // Find the most efficient portfolio (highest Sharpe-like ratio on the frontier)
    const mostEfficient = frontierPoints.reduce((best, curr) => {
      const currRatio = curr.y / curr.x;
      const bestRatio = best.y / best.x;
      return currRatio > bestRatio ? curr : best;
    }, frontierPoints[0]);

    // Grid
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

    // Zero line for returns
    if (yExtent[0] < 0 && yExtent[1] > 0) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", yScale(0))
        .attr("y2", yScale(0))
        .attr("stroke", "#525252")
        .attr("stroke-dasharray", "4,4");
    }

    // Draw efficient frontier line
    if (frontierPoints.length > 1) {
      const line = d3
        .line<DataPoint>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(frontierPoints)
        .attr("fill", "none")
        .attr("stroke", "#22c55e")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("opacity", 0.7)
        .attr("d", line);

      // Add label for efficient frontier
      const lastPoint = frontierPoints[frontierPoints.length - 1];
      g.append("text")
        .attr("x", xScale(lastPoint.x) + 5)
        .attr("y", yScale(lastPoint.y))
        .attr("fill", "#22c55e")
        .attr("font-size", 11)
        .attr("font-weight", "500")
        .text("Efficient Frontier");
    }

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(xScale).tickFormat((d) => formatPercent(d as number, 1))
      )
      .call((g) => g.select(".domain").attr("stroke", "#404040"))
      .call((g) => g.selectAll(".tick line").attr("stroke", "#404040"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#a1a1a1"));

    // X axis label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#a1a1a1")
      .attr("font-size", 12)
      .text(xLabel);

    // Y axis
    g.append("g")
      .call(
        d3.axisLeft(yScale).tickFormat((d) => formatPercent(d as number, 0))
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
      .text(yLabel);

    // Points
    data.forEach((d) => {
      const isActive = activePoint === null || activePoint === d.name;
      const isMostEfficient = d.name === mostEfficient?.name;
      const opacity = isActive ? 1 : 0.3;
      const radius = activePoint === d.name ? 10 : isMostEfficient ? 10 : 8;

      g.append("circle")
        .attr("cx", xScale(d.x))
        .attr("cy", yScale(d.y))
        .attr("r", radius)
        .attr("fill", d.color)
        .attr("opacity", opacity)
        .attr("stroke", isMostEfficient ? "#22c55e" : activePoint === d.name ? "#fff" : "none")
        .attr("stroke-width", isMostEfficient ? 3 : 2)
        .style("cursor", "pointer")
        .on("mouseenter", () => setActivePoint(d.name))
        .on("mouseleave", () => setActivePoint(null));

      // Add star icon for most efficient portfolio
      if (isMostEfficient) {
        g.append("text")
          .attr("x", xScale(d.x))
          .attr("y", yScale(d.y) - 16)
          .attr("text-anchor", "middle")
          .attr("fill", "#22c55e")
          .attr("font-size", 16)
          .style("pointer-events", "none")
          .text("★");
      }

      // Label
      g.append("text")
        .attr("x", xScale(d.x))
        .attr("y", yScale(d.y) - (isMostEfficient ? 28 : 12))
        .attr("text-anchor", "middle")
        .attr("fill", d.color)
        .attr("font-size", 11)
        .attr("font-weight", activePoint === d.name || isMostEfficient ? "600" : "400")
        .attr("opacity", opacity)
        .style("pointer-events", "none")
        .text(d.name === "My Balls" ? d.name : d.name.split(" ")[0]); // Show full name for "My Balls", first name for others
    });
  }, [dimensions, data, activePoint, xLabel, yLabel]);

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
