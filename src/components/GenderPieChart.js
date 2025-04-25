import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../App.css";

const GenderPieChart = () => {
  const svgRef = useRef();
  const [pieData, setPieData] = useState([]);
  const width = 500;
  const height = 400;
  const margin = 40;

  useEffect(() => {
    d3.csv("/cleaned_healthcare_data.csv").then((data) => {
      const genderCounts = d3.rollup(
        data,
        (v) => v.length,
        (d) => d.gender
      );

      const processed = Array.from(genderCounts, ([key, value]) => ({
        gender: key,
        count: value,
      }));

      setPieData(processed);

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const radius = Math.min(width, height) / 2 - margin;

      const color = d3
        .scaleOrdinal()
        .domain(processed.map((d) => d.gender))
        .range(["#66c2a5", "#fc8d62", "#8da0cb"]);

      const pie = d3.pie().value((d) => d.count);
      const data_ready = pie(processed);

      const arc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(radius);

      const chart = svg
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      chart
        .selectAll("path")
        .data(data_ready)
        .join("path")
        .attr("d", arc)
        .attr("fill", (d) => color(d.data.gender))
        .attr("stroke", "white")
        .style("stroke-width", "2px");

      chart
        .selectAll("text")
        .data(data_ready)
        .join("text")
        .text((d) => `${d.data.gender} (${d.data.count})`)
        .attr("transform", (d) => `translate(${arc.centroid(d)})`)
        .style("text-anchor", "middle")
        .style("font-size", 13);
    });
  }, []);

  const handleDownload = () => {
    const csvContent = [
      ["Gender", "Count"],
      ...pieData.map((d) => [d.gender, d.count]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gender_distribution.csv";
    link.click();
  };

  return (
    <div style={{ textAlign: "center", marginTop: "30px" }}>
      <h3>👨‍⚕️ Gender Distribution of Patients</h3>
      <div style={{ marginBottom: "15px" }}>
        <button onClick={handleDownload}>📥 Export CSV</button>
      </div>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default GenderPieChart;
