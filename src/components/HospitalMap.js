import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../App.css";

const HospitalMap = () => {
  const svgRef = useRef();
  const width = 800;
  const height = 1000;

  const [hospitalData, setHospitalData] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [selectedRating, setSelectedRating] = useState("All");
  const [selectedMeasure, setSelectedMeasure] = useState("All");

  useEffect(() => {
    Promise.all([
      d3.json("/map.json"),
      d3.csv("/hosp_cords.csv", d3.autoType)
    ]).then(([geo, hospitals]) => {
      setGeoData(geo);
      setHospitalData(hospitals);
    });
  }, []);

  useEffect(() => {
    if (!geoData || hospitalData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const projection = d3.geoMercator().fitSize([width, height], geoData);
    const path = d3.geoPath().projection(projection);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("id", "tooltip")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "8px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("display", "none");

    const filteredHospitals = hospitalData.filter(d =>
      d.Latitude != null &&
      d.Longitude != null &&
      (selectedRating === "All" || d.Performance_Rating === selectedRating) &&
      (selectedMeasure === "All" || d.Measure === selectedMeasure)
    );

    svg.append("g")
      .selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("d", path)
      .attr("fill", "#f8f8f8")
      .attr("stroke", "#aaa");

    svg.append("g")
      .selectAll("circle")
      .data(filteredHospitals)
      .join("circle")
      .attr("cx", d => projection([d.Longitude, d.Latitude])[0])
      .attr("cy", d => projection([d.Longitude, d.Latitude])[1])
      .attr("r", 5)
      .attr("fill", d => {
        if (d.Performance_Rating === "Worse") return "red";
        if (d.Performance_Rating === "As Expected") return "orange";
        if (d.Performance_Rating === "Better") return "green";
        return "#999";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", (event, d) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + "px")
          .style("display", "block")
          .html(`
            <strong>${d.Hospital}</strong><br/>
            ${d.County} County<br/>
            Measure: ${d.Measure}<br/>
            Rating: ${d.Performance_Rating}
          `);
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });

    const legend = svg.append("g").attr("transform", `translate(${width - 150}, 50)`);
    const ratings = [
      { label: "Better", color: "green" },
      { label: "As Expected", color: "orange" },
      { label: "Worse", color: "red" }
    ];

    legend.selectAll("circle")
      .data(ratings)
      .join("circle")
      .attr("cx", 0)
      .attr("cy", (d, i) => i * 25)
      .attr("r", 6)
      .attr("fill", d => d.color);

    legend.selectAll("text")
      .data(ratings)
      .join("text")
      .attr("x", 12)
      .attr("y", (d, i) => i * 25 + 4)
      .text(d => d.label)
      .style("font-size", "13px")
      .attr("alignment-baseline", "middle");
  }, [geoData, hospitalData, selectedRating, selectedMeasure]);

  const uniqueRatings = ["All", ...Array.from(new Set(hospitalData.map(d => d.Performance_Rating)))];
  const uniqueMeasures = ["All", ...Array.from(new Set(hospitalData.map(d => d.Measure)))];

  const handleExport = () => {
    const csvContent = [
      ["Year", "County", "Hospital", "Measure", "Adverse_Events", "Cases", "Risk_Adjusted_Rate", "Performance_Rating", "Latitude", "Longitude"],
      ...hospitalData.map(d => [
        d.Year, d.County, d.Hospital, d.Measure, d.Adverse_Events, d.Cases, d.Risk_Adjusted_Rate, d.Performance_Rating, d.Latitude, d.Longitude
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "filtered_hospitals.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h3>Visualizing hospital outcomes across California by condition and risk</h3>
      

      <div style={{ marginBottom: "20px" }}>
        <label>Performance Rating: </label>
        <select value={selectedRating} onChange={e => setSelectedRating(e.target.value)}>
          {uniqueRatings.map(rating => (
            <option key={rating} value={rating}>{rating}</option>
          ))}
        </select>

        <label style={{ marginLeft: "20px" }}>Measure: </label>
        <select value={selectedMeasure} onChange={e => setSelectedMeasure(e.target.value)}>
          {uniqueMeasures.map(measure => (
            <option key={measure} value={measure}>{measure}</option>
          ))}
        </select>

        <button onClick={handleExport} style={{ marginLeft: "20px" }}>
          📥 Export CSV
        </button>
      </div>

      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default HospitalMap;
