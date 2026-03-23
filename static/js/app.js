"use strict";

let sensorHistoryChart;

// Sensor keys
const sensorKeys = [
  "latitude","longitude","Satellitecount","Auxvoltage","Auxcurrent",
  "Motorvoltage","Motorcurrent","Xaccel","Yaccel","Zaccel",
  "Xmag","Ymag","Zmag","Pitch","Roll","Yaw","Temp","Hum"
];

// ⭐ Limit to 10 seconds
const MAX_POINTS = 20;

// ⭐ Define high/low thresholds (based on backend list positions)
const HIGH_POSITIONS = [0, 1, 2];  // example: positions 0-2 are high

document.addEventListener("DOMContentLoaded", () => {

  // ===== APEXCHART =====
  const series = sensorKeys.map(k => ({ name: k, data: [] }));

  const options = {
    chart: {
      type: 'line',
      height: 300,
      animations: { enabled: false }
    },
    series: series,
    xaxis: { categories: [] },
    legend: { position: "bottom" },
    stroke: { curve: 'stepline' } // Makes high/low steps visible like voltage/current
  };

  sensorHistoryChart = new ApexCharts(
    document.querySelector("#sensor-history-chart"),
    options
  );

  sensorHistoryChart.render();

  // ===== SOCKET.IO =====
  const socket = io();

  socket.on("telemetry", (msg) => {
    if (!msg) return;

    // ===== UPDATE TABLE =====
    document.getElementById("latitude").textContent = msg.Lat;
    document.getElementById("longitude").textContent = msg.Lon;
    document.getElementById("Satellitecount").textContent = msg.Sc;
    document.getElementById("Auxvoltage").textContent = msg.Auxvoltage;
    document.getElementById("Auxcurrent").textContent = msg.Auxcurrent;
    document.getElementById("Motorvoltage").textContent = msg.Motorvoltage;
    document.getElementById("Motorcurrent").textContent = msg.Motorcurrent;
    document.getElementById("Temp").textContent = msg.temp;
    document.getElementById("Hum").textContent = msg.Hum;

    // ===== MAP DATA & CONVERT TO HIGH/LOW =====
    const rawData = [
      msg.Lat, msg.Lon, msg.Sc, msg.Auxvoltage, msg.Auxcurrent,
      msg.Motorvoltage, msg.Motorcurrent, msg.xaccel, msg.yaccel, msg.zaccel,
      msg.xmag, msg.ymag, msg.zmag, msg.P, msg.R, msg.Y, msg.temp, msg.Hum
    ];

    const data = sensorKeys.map((key, i) => {
      return HIGH_POSITIONS.includes(i) ? 1 : 0; // 1 = High, 0 = Low
    });

    // Convert to object for ApexCharts
    const sensorData = {};
    sensorKeys.forEach((key, i) => sensorData[key] = data[i]);

    updateSensorHistory(sensorData);
    updateCharts(msg); // keep raw voltage/current charts
  });

});


// ===== UPDATE APEXCHART HIGH/LOW =====
function updateSensorHistory(sensorData) {
  const chart = sensorHistoryChart;
  const time = new Date().toLocaleTimeString();

  // Update X-axis
  let categories = chart.w.globals.labels.slice();
  categories.push(time);
  if (categories.length > MAX_POINTS) categories.shift();

  // Update series with high/low
  let newSeries = sensorKeys.map((key, i) => {
    let d = chart.w.globals.series[i].slice();
    d.push(sensorData[key] || 0);
    if (d.length > MAX_POINTS) d.shift();
    return { name: key, data: d };
  });

  chart.updateOptions({ xaxis: { categories } });
  chart.updateSeries(newSeries);
}


// ===== UPDATE CHART.JS (POWER + VOLTAGE) =====
function updateCharts(data) {
  const time = new Date().toLocaleTimeString();

  // Power chart
  if (window.powerChart) {
    window.powerChart.data.labels.push(time);
    window.powerChart.data.datasets[0].data.push(data.Auxvoltage || 0);

    if (window.powerChart.data.labels.length > MAX_POINTS) {
      window.powerChart.data.labels.shift();
      window.powerChart.data.datasets[0].data.shift();
    }

    window.powerChart.update();
  }

  // Voltage chart
  if (window.voltageChart) {
    window.voltageChart.data.labels.push(time);
    window.voltageChart.data.datasets[0].data.push(data.Motorvoltage || 0);
    window.voltageChart.data.datasets[1].data.push(data.Motorcurrent || 0);

    if (window.voltageChart.data.labels.length > MAX_POINTS) {
      window.voltageChart.data.labels.shift();
      window.voltageChart.data.datasets.forEach(ds => ds.data.shift());
    }

    window.voltageChart.update();
  }
}