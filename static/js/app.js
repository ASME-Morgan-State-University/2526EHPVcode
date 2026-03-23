"use strict";

let sensorHistoryChart;

// Sensor keys
const sensorKeys = [
  "latitude","longitude","Satellitecount","Auxvoltage","Auxcurrent",
  "Motorvoltage","Motorcurrent","Xaccel","Yaccel","Zaccel",
  "Xmag","Ymag","Zmag","Pitch","Roll","Yaw","Temp","Hum"
];

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
    legend: { position: "bottom" }
  };

  sensorHistoryChart = new ApexCharts(
    document.querySelector("#sensor-history-chart"),
    options
  );

  sensorHistoryChart.render();

  // ===== SOCKET =====
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

    // ===== MAP DATA =====
    const data = {
      latitude: msg.Lat,
      longitude: msg.Lon,
      Satellitecount: msg.Sc,
      Auxvoltage: msg.Auxvoltage,
      Auxcurrent: msg.Auxcurrent,
      Motorvoltage: msg.Motorvoltage,
      Motorcurrent: msg.Motorcurrent,
      Xaccel: msg.xaccel,
      Yaccel: msg.yaccel,
      Zaccel: msg.zaccel,
      Xmag: msg.xmag,
      Ymag: msg.ymag,
      Zmag: msg.zmag,
      Pitch: msg.P,
      Roll: msg.R,
      Yaw: msg.Y,
      Temp: msg.temp,
      Hum: msg.Hum
    };

    updateSensorHistory(data);
    updateCharts(data);
  });

});


// ===== UPDATE APEXCHART =====
function updateSensorHistory(sensorData) {
  const chart = sensorHistoryChart;
  const time = new Date().toLocaleTimeString();

  let categories = chart.w.globals.labels.slice();
  categories.push(time);
  if (categories.length > 50) categories.shift();

  let newSeries = sensorKeys.map((key, i) => {
    let d = chart.w.globals.series[i].slice();
    d.push(sensorData[key] || 0);
    if (d.length > 50) d.shift();
    return { name: key, data: d };
  });

  chart.updateOptions({ xaxis: { categories } });
  chart.updateSeries(newSeries);
}


// ===== UPDATE CHART.JS =====
function updateCharts(data) {

  const time = new Date().toLocaleTimeString();

  // Power chart
  if (window.powerChart) {
    window.powerChart.data.labels.push(time);
    window.powerChart.data.datasets[0].data.push(data.Auxvoltage || 0);

    if (window.powerChart.data.labels.length > 50) {
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

    if (window.voltageChart.data.labels.length > 50) {
      window.voltageChart.data.labels.shift();
      window.voltageChart.data.datasets.forEach(ds => ds.data.shift());
    }

    window.voltageChart.update();
  }
}