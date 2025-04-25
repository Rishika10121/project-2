import React from "react";
import HospitalMap from "./components/HospitalMap";
import AverageRiskChart from "./components/AverageRiskChart";
import ConditionTrendLine from "./components/ConditionTrendLine";
import AdmissionStackedBar from "./components/AdmissionStackedBar";
import GenderPieChart from "./components/GenderPieChart";

import "./App.css";

function App() {
  return (
    <div className="App">
      {/* 🗺️ Map: Hospital Performance */}
      <HospitalMap />

      {/* 📊 Bar Chart: Average Risk by Condition */}
      <div style={{ marginTop: "60px" }}>
        <AverageRiskChart />
      </div>

      {/* 📈 Trend Analysis: Admissions vs Billing */}
      <div style={{ marginTop: "60px" }}>
        <ConditionTrendLine />
      </div>

      {/* 🧱 Stacked Bar: Admission Types by Condition */}
      <div style={{ marginTop: "60px" }}>
        <AdmissionStackedBar />
      </div>

      {/* 🥧 Pie Chart: Gender Distribution */}
      <div style={{ marginTop: "60px" }}>
        <GenderPieChart />
      </div>

      
    </div>
  );
}

export default App;
