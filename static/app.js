// ===== app.js =====

// --- Connect to SocketIO ---
const socket = io();

// --- Table cells map ---
// Grab all <td> cells from the main table in order
const tableCells = document.querySelectorAll("#mainDataTable tbody tr td");

const tableCellMap = {
  lat: tableCells[0],
  lon: tableCells[1],
  sat: tableCells[2],
  auxV: tableCells[3],
  auxC: tableCells[4],
  motorV: tableCells[5],
  motorC: tableCells[6],
  xAccel: tableCells[7],
  yAccel: tableCells[8],
  zAccel: tableCells[9],
  pitch: tableCells[10],
  roll: tableCells[11],
  yaw: tableCells[12],
  temp: tableCells[13],
  hum: tableCells[14]
};

// --- Chart data arrays ---
const maxPoints = 50; // Keep last 50 points
let timeIndex = 0;

let categories = [];
let tempData = [];
let humData = [];
let pitchData = [];
let rollData = [];
let yawData = [];

// --- Initialize ApexCharts ---
const chart1 = new ApexCharts(document.querySelector("#chart1"), {
  chart: { type: 'line', height: 300 },
  series: [
    { name: "Temperature", data: [] },
    { name: "Humidity", data: [] }
  ],
  xaxis: { categories: [] }
});
chart1.render();

const chart2 = new ApexCharts(document.querySelector("#chart2"), {
  chart: { type: 'line', height: 300 },
  series: [
    { name: "Pitch", data: [] },
    { name: "Roll", data: [] },
    { name: "Yaw", data: [] }
  ],
  xaxis: { categories: [] }
});
chart2.render();

const chartBar = new ApexCharts(document.querySelector("#chartBar"), {
  chart: { type: 'bar', height: 400 },
  series: [
    { name: "Motor Voltage", data: [0] },
    { name: "Aux Voltage", data: [0] }
  ],
  xaxis: { categories: ["Voltage"] },
  plotOptions: { bar: { horizontal: true } }
});
chartBar.render();

// --- Socket listener ---
socket.on("telemetry", (data) => {
  if (!data) return;

  // --- Update table ---
  tableCellMap.lat.innerText = data.latitude.toFixed(6);
  tableCellMap.lon.innerText = data.longitude.toFixed(6);
  tableCellMap.sat.innerText = data.satellites;
  tableCellMap.auxV.innerText = data.auxVoltage.toFixed(2);
  tableCellMap.auxC.innerText = data.auxCurrent.toFixed(2);
  tableCellMap.motorV.innerText = data.motorVoltage.toFixed(2);
  tableCellMap.motorC.innerText = data.motorCurrent.toFixed(2);
  tableCellMap.xAccel.innerText = data.xAccel.toFixed(2);
  tableCellMap.yAccel.innerText = data.yAccel.toFixed(2);
  tableCellMap.zAccel.innerText = data.zAccel.toFixed(2);
  tableCellMap.pitch.innerText = data.pitch.toFixed(2);
  tableCellMap.roll.innerText = data.roll.toFixed(2);
  tableCellMap.yaw.innerText = data.yaw.toFixed(2);
  tableCellMap.temp.innerText = data.temperature.toFixed(2);
  tableCellMap.hum.innerText = data.humidity.toFixed(2);

  // --- Update chart data ---
  tempData.push(data.temperature);
  humData.push(data.humidity);
  pitchData.push(data.pitch);
  rollData.push(data.roll);
  yawData.push(data.yaw);
  categories.push(timeIndex++);

  // Keep only last maxPoints points
  [tempData, humData, pitchData, rollData, yawData, categories].forEach(arr => {
    if (arr.length > maxPoints) arr.shift();
  });

  // --- Update charts ---
  chart1.updateOptions({
    series: [
      { name: "Temperature", data: tempData },
      { name: "Humidity", data: humData }
    ],
    xaxis: { categories }
  });

  chart2.updateOptions({
    series: [
      { name: "Pitch", data: pitchData },
      { name: "Roll", data: rollData },
      { name: "Yaw", data: yawData }
    ],
    xaxis: { categories }
  });

  chartBar.updateSeries([
    { name: "Motor Voltage", data: [data.motorVoltage] },
    { name: "Aux Voltage", data: [data.auxVoltage] }
  ]);
});