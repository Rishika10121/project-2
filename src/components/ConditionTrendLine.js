import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../App.css";

const ConditionTrendLine = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [conditionList, setConditionList] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const width = 1000;
  const height = 520;

  useEffect(() => {
    d3.csv("/healthcare_summary.csv", d3.autoType).then(rawData => {
      const uniqueConditions = [...new Set(rawData.map(d => d.medical_condition))].sort();
      setData(rawData);
      setConditionList(uniqueConditions);
      setSelectedCondition(uniqueConditions[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedCondition || data.length === 0) return;

    const margin = { top: 60, right: 30, bottom: 60, left: 120 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const filtered = data.filter(d => d.medical_condition === selectedCondition);
    const aggregated = d3.rollups(
      filtered,
      v => ({
        total: d3.sum(v, d => d.total_admissions),
        avgBilling: d3.mean(v, d => d.average_billing),
        hospital: v[0].hospital_clean
      }),
      d => d.hospital_clean
    ).map(([_, values]) => values);

    setFilteredData(aggregated);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const x = d3.scaleLinear()
      .domain([0, d3.max(aggregated, d => d.total)])
      .nice()
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(aggregated, d => d.avgBilling)])
      .nice()
      .range([innerHeight, 0]);

    const r = d3.scaleSqrt()
      .domain([0, d3.max(aggregated, d => d.avgBilling)])
      .range([4, 18]);

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Y Axis with label
    chart.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -70)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .text("Average Billing Amount ($)");

    // X Axis with label
    chart.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 40)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .text("Total Admissions");

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "8px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("display", "none");

    // Bubbles
    chart.selectAll("circle")
      .data(aggregated)
      .join("circle")
      .attr("cx", d => x(d.total))
      .attr("cy", d => y(d.avgBilling))
      .attr("r", d => r(d.avgBilling))
      .attr("fill", "orange")
      .attr("stroke", "#000")
      .attr("opacity", 0.75)
      .on("mouseover", (event, d) => {
        tooltip
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY + "px")
          .style("display", "block")
          .html(`
            <strong>${d.hospital}</strong><br/>
            Admissions: ${d.total}<br/>
            Avg Billing: $${d.avgBilling.toFixed(2)}
          `);
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 180}, 60)`);

    const legendVals = [2000, 6000, 10000];
    legend.selectAll("circle")
      .data(legendVals)
      .join("circle")
      .attr("cy", (d, i) => i * 30)
      .attr("r", d => r(d))
      .attr("fill", "orange")
      .attr("opacity", 0.6)
      .attr("stroke", "black")
      .attr("cx", 0);

    legend.selectAll("text")
      .data(legendVals)
      .join("text")
      .attr("x", 35)
      .attr("y", (d, i) => i * 30)
      .attr("dy", "0.35em")
      .style("font-size", "13px")
      .text(d => `$${d}`);
  }, [selectedCondition, data]);

  // Download CSV
  const downloadCSV = () => {
    const csvHeader = "hospital,total_admissions,avg_billing\n";
    const csvRows = filteredData.map(d =>
      `${d.hospital},${d.total},${d.avgBilling.toFixed(2)}`
    );
    const blob = new Blob([csvHeader + csvRows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedCondition.replace(/\s+/g, "_")}_trend.csv`;
    a.click();
  };

  return (
    <div style={{ textAlign: "center", maxWidth: "1100px", margin: "0 auto" }}>
      <h3>📈 Admissions Trend by Condition</h3>
      <p>Visualizing admission counts and billing costs for selected medical conditions</p>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
        <label style={{ marginRight: "10px" }}>
          Condition:
          <select value={selectedCondition} onChange={e => setSelectedCondition(e.target.value)} style={{ marginLeft: "5px" }}>
            {conditionList.map((cond, i) => (
              <option key={i} value={cond}>{cond}</option>
            ))}
          </select>
        </label>
        <button onClick={downloadCSV} style={{ marginLeft: "20px", padding: "4px 10px" }}>
          📥 Export CSV
        </button>
      </div>

      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default ConditionTrendLine;
