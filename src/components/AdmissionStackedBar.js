import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import "../App.css";

const AdmissionStackedBar = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState(["Urgent", "Emergency", "Elective"]);
  const width = 1000;
  const height = 500;
  const margin = useMemo(() => ({ top: 60, right: 150, bottom: 100, left: 80 }), []);

  const admissionColors = useMemo(() => ({
    Urgent: "#e41a1c",
    Emergency: "#377eb8",
    Elective: "#4daf4a"
  }), []);

  useEffect(() => {
    d3.csv("/cleaned_healthcare_data.csv").then(setData);
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const grouped = d3.rollup(
      data,
      v => d3.rollup(v, v2 => v2.length, d => d.admission_type),
      d => d.medical_condition
    );

    const conditions = Array.from(grouped.keys());
    const stackData = conditions.map(condition => {
      const counts = grouped.get(condition);
      const entry = { condition };
      selectedTypes.forEach(type => {
        entry[type] = counts?.get(type) || 0;
      });
      return entry;
    });

    const chart = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(conditions)
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stackData, d => selectedTypes.reduce((sum, type) => sum + d[type], 0))])
      .nice()
      .range([innerHeight, 0]);

    const stack = d3.stack().keys(selectedTypes);
    const series = stack(stackData);

    const bars = chart.selectAll("g.layer")
      .data(series)
      .join("g")
      .attr("fill", d => admissionColors[d.key]);

    bars.selectAll("rect")
      .data(d => d)
      .join("rect")
      .attr("x", d => x(d.data.condition))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .append("title")
      .text(d => `${d.data.condition} - ${d[1] - d[0]} patients`);

    // Value Labels
    bars.selectAll("text")
      .data(d => d)
      .join("text")
      .text(d => (d[1] - d[0] > 0 ? d[1] - d[0] : ""))
      .attr("x", d => x(d.data.condition) + x.bandwidth() / 2)
      .attr("y", d => y(d[1]) + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "11px");

    chart.append("g").call(d3.axisLeft(y));

    chart.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Axis Labels
    chart.append("text")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 20)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Patient Count");

    chart.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 70)
      .attr("text-anchor", "middle")
      .text("Medical Condition");

  }, [data, selectedTypes, margin, admissionColors]);

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const exportCSV = () => {
    const csvRows = [];
    const headers = ["Medical Condition", ...selectedTypes];
    csvRows.push(headers.join(","));

    const grouped = d3.rollup(
      data,
      v => d3.rollup(v, v2 => v2.length, d => d.admission_type),
      d => d.medical_condition
    );

    grouped.forEach((counts, condition) => {
      const row = [condition];
      selectedTypes.forEach(type => {
        row.push(counts.get(type) || 0);
      });
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const temp = document.createElement("a");
    temp.href = url;
    temp.download = "admission_summary.csv";
    temp.click();
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h3>📊 Admission Type by Medical Condition</h3>

      <div style={{ marginBottom: "10px" }}>
        {["Urgent", "Emergency", "Elective"].map(type => (
          <label key={type} style={{ marginRight: "15px" }}>
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={() => toggleType(type)}
            />
            {" "}
            {type}
          </label>
        ))}
        <button
          style={{ marginLeft: "30px", padding: "5px 10px", cursor: "pointer" }}
          onClick={exportCSV}
        >
          📥 Export CSV
        </button>
      </div>

      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default AdmissionStackedBar;
