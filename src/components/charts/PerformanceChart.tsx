"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { PerformancePoint } from "@/lib/types";
import { formatCurrency, formatDateShort, formatPercent } from "@/lib/utils/format";

interface PerformanceChartProps {
  data: PerformancePoint[];
  height?: number;
  showReturn?: boolean;
}

export function PerformanceChart({
  data,
  height = 350,
  showReturn = false,
}: PerformanceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    data: PerformancePoint | null;
  }>({ show: false, x: 0, y: 0, data: null });

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

    const margin = { top: 20, right: 20, bottom: 40, left: 70 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const getValue = showReturn
      ? (d: PerformancePoint) => d.percentReturn
      : (d: PerformancePoint) => d.netWorth;

    const values = data.map(getValue);
    const yMin = Math.min(d3.min(values) ?? 0, showReturn ? 0 : 100000);
    const yMax = Math.max(d3.max(values) ?? 0, showReturn ? 0 : 100000);
    const yPadding = (yMax - yMin) * 0.1;

    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([innerHeight, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
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

    // Reference line
    const refValue = showReturn ? 0 : 100000;
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", yScale(refValue))
      .attr("y2", yScale(refValue))
      .attr("stroke", "#525252")
      .attr("stroke-dasharray", "4,4")
      .attr("stroke-width", 1);

    // Area gradient
    const areaGradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "areaGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    const lastValue = getValue(data[data.length - 1]);
    const isPositive = lastValue >= refValue;
    const color = isPositive ? "#22c55e" : "#ef4444";

    areaGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", color)
      .attr("stop-opacity", 0.3);

    areaGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", color)
      .attr("stop-opacity", 0);

    // Area
    const area = d3
      .area<PerformancePoint>()
      .x((d) => xScale(d.date))
      .y0(yScale(refValue))
      .y1((d) => yScale(getValue(d)))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", "url(#areaGradient)")
      .attr("d", area);

    // Line
    const line = d3
      .line<PerformancePoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(getValue(d)))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("d", line);

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickFormat((d) => formatDateShort(d as Date))
      )
      .call((g) => g.select(".domain").attr("stroke", "#404040"))
      .call((g) => g.selectAll(".tick line").attr("stroke", "#404040"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#a1a1a1"));

    // Y axis
    g.append("g")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(6)
          .tickFormat((d) =>
            showReturn
              ? formatPercent(d as number, 0)
              : formatCurrency(d as number)
          )
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

    const hoverDot = g
      .append("circle")
      .attr("r", 5)
      .attr("fill", color)
      .attr("stroke", "#0a0a0a")
      .attr("stroke-width", 2)
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
        const index = bisect(data, date);
        const d = data[Math.min(index, data.length - 1)];

        if (d) {
          const x = xScale(d.date);
          const y = yScale(getValue(d));

          hoverLine.attr("x1", x).attr("x2", x).style("display", "block");
          hoverDot.attr("cx", x).attr("cy", y).style("display", "block");

          const rect = containerRef.current?.getBoundingClientRect();
          setTooltip({
            show: true,
            x: (rect?.left ?? 0) + margin.left + x,
            y: (rect?.top ?? 0) + margin.top + y,
            data: d,
          });
        }
      })
      .on("mouseleave", () => {
        hoverLine.style("display", "none");
        hoverDot.style("display", "none");
        setTooltip((t) => ({ ...t, show: false }));
      });
  }, [dimensions, data, showReturn]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible"
      />

      {tooltip.show && tooltip.data && (
        <div
          className="fixed z-50 bg-bg-secondary border border-border-color rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y,
            transform: "translateY(-50%)",
          }}
        >
          <div className="text-xs text-text-secondary mb-1">
            {formatDateShort(tooltip.data.date)}
          </div>
          <div className="text-sm font-medium">
            {formatCurrency(tooltip.data.netWorth)}
          </div>
          <div
            className={`text-xs ${
              tooltip.data.percentReturn >= 0 ? "text-positive" : "text-negative"
            }`}
          >
            {formatPercent(tooltip.data.percentReturn)}
          </div>
          <div className="text-xs text-text-secondary mt-1">
            Rank: #{tooltip.data.rank}
          </div>
        </div>
      )}
    </div>
  );
}
