import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../App.css";

const AverageRiskChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const width = 800;
  const height = 500;

  useEffect(() => {
    d3.csv("/hosp_cords.csv", d3.autoType).then(rawData => {
      const grouped = d3.rollups(
        rawData,
        v => d3.mean(v, d => d.Risk_Adjusted_Rate),
        d => d.Measure
      );

      const cleanedData = grouped
        .filter(([key, value]) => key && value !== undefined && !isNaN(value))
        .map(([key, value]) => ({ Measure: key, AvgRisk: +value }))
        .sort((a, b) => d3.descending(a.AvgRisk, b.AvgRisk));

      setData(cleanedData);
    });
  }, []);

  useEffect(() => {
    if (data.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 80, bottom: 60, left: 220 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.AvgRisk)])
      .range([0, chartWidth]);

    const y = d3.scaleBand()
      .domain(data.map(d => d.Measure))
      .range([0, chartHeight])
      .padding(0.1);

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    chart.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll("text")
      .style("font-size", "12px");

    chart.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .append("text")
      .attr("x", chartWidth / 2)
      .attr("y", 40)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .text("Average Risk-Adjusted Rate");

    chart.append("text")
      .attr("x", -chartHeight / 2)
      .attr("y", -margin.left + 20)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .text("Condition (Measure)");

    chart.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", 0)
      .attr("y", d => y(d.Measure))
      .attr("width", d => x(d.AvgRisk))
      .attr("height", y.bandwidth())
      .attr("fill", "#4682B4");

    chart.selectAll("text.value")
      .data(data)
      .join("text")
      .attr("class", "value")
      .attr("x", d => x(d.AvgRisk) + 5)
      .attr("y", d => y(d.Measure) + y.bandwidth() / 2 + 4)
      .text(d => d.AvgRisk.toFixed(2))
      .style("font-size", "11px");
  }, [data]);

  const handleExport = () => {
    const csvContent = [
      ["Measure", "AvgRisk"],
      ...data.map(d => [d.Measure, d.AvgRisk.toFixed(2)])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "average_risk_by_condition.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h3>📊 Avg. Risk-Adjusted Rate by Condition</h3>
      <div style={{ display: "flex", justifyContent: "flex-end", width: `${width}px`, margin: "auto" }}>
        <button onClick={handleExport} style={{ marginBottom: "10px" }}>📥 Export CSV</button>
      </div>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default AverageRiskChart;
