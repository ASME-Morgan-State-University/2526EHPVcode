"use strict";

// ── CONFIG ────────────────────────────────────────────────────────────────────
const THRESHOLDS = {
    voltage:      10.00,
    voltageWarn:  0.01,
    current:      0.50,
    currentWarn:  1.00,
    temperature:  0.00,
    tempWarn:     0.01,
    humidity:     0.00,
    humWarn:      0.10,
    lat:          0.00,
    latWarn:      0.01,
    lon:          0.00,
    lonWarn:      0.01,
    sc:           0.00,
    scWarn:       0.01,
    accel:        0.00,
    accelWarn:    0.01,
    mag:          0.00,
    magWarn:      0.01,
    gyro:         0.00,
    gyroWarn:     0.01,
};

const sensorKeys   = ["Sensor1","Sensor2","Sensor3","Sensor4","Sensor5"];
const sensorGroups = [
    [0, 1, 2],
    [3, 4],
    [5, 6],
    [7, 8, 9, 10, 11, 12, 13, 14, 15],
    [16, 17]
];

// Colours per sensor in their OK state
const SERIES_COLOR_OK = ["#007bff","#28a745","#dc3545","#ffc107","#6f42c1"];
// When a sensor is LOW it turns red regardless of which sensor it is
const SERIES_COLOR_WARN    = "#fd7e14";   // orange
const SERIES_COLOR_DANGER  = "#dc3545";   // red

const MAX_POINTS = 20;

let sensorCategories = [];
let sensorHistoryChart;
const sensorSeriesData = sensorKeys.map(() => []);

document.addEventListener("DOMContentLoaded", () => {

  // ── SENSOR HISTORY (APEXCHARTS) ───────────────────────────────────────────
    

  // ── SOCKET.IO ─────────────────────────────────────────────────────────────
    const socket = io();
    socket.on("telemetry", (msg) => {
        if (!msg) return;
        updateTable(msg);
        updateCharts(msg);
        updateLabelAlerts(msg);
    });
});


// ── TABLE UPDATE ──────────────────────────────────────────────────────────────
function updateTable(msg) {
    const fields = [
        "Lat","Lon","Sc",
        "Auxvoltage","Auxcurrent",
        "Motorvoltage","Motorcurrent",
        "xaccel","yaccel","zaccel",
        "xmag","ymag","zmag",
        "P","R","Y",
        "temp","Hum"
    ];
    fields.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.textContent = msg[f] ?? "---";
    });
}


// ── CHART UPDATE ──────────────────────────────────────────────────────────────
function updateCharts(msg) {
    const time = new Date().toLocaleTimeString();
    const Motorvoltage = parseFloat(msg.Motorvoltage) || 0;
    const Motorcurrent = parseFloat(msg.Motorcurrent) || 0;
    const Auxvoltage   = parseFloat(msg.Auxvoltage)   || 0;
    const Auxcurrent   = parseFloat(msg.Auxcurrent)   || 0;
    const motorPower = Motorvoltage * Motorcurrent;
    const auxPower   = Auxvoltage   * Auxcurrent;

  // ── Power bar chart — Motor (blue) and Aux (red) as separate bars ─────────
    if (window.powerChart) {
        window.powerChart.data.labels.push(time);
        window.powerChart.data.datasets[0].data.push(parseFloat(motorPower.toFixed(2)));
        window.powerChart.data.datasets[1].data.push(parseFloat(auxPower.toFixed(2)));
        if (window.powerChart.data.labels.length > MAX_POINTS) {
            window.powerChart.data.labels.shift();
            window.powerChart.data.datasets.forEach(ds => ds.data.shift());
        }
        window.powerChart.update();
    }

  // ── Voltage / Current line chart ──────────────────────────────────────────
    if (window.voltageChart) {
        window.voltageChart.data.labels.push(time);
        window.voltageChart.data.datasets[0].data.push(Motorvoltage);
        window.voltageChart.data.datasets[1].data.push(Motorcurrent);
        window.voltageChart.data.datasets[2].data.push(Auxvoltage);
        window.voltageChart.data.datasets[3].data.push(Auxcurrent);
        if (window.voltageChart.data.labels.length > MAX_POINTS) {
            window.voltageChart.data.labels.shift();
            window.voltageChart.data.datasets.forEach(ds => ds.data.shift());
            }
            window.voltageChart.update();
    }

  // ── Sensor history ────────────────────────────────────────────────────────

}


// ── HELPERS ───────────────────────────────────────────────────────────────────
function setLabelLevel(labelId, level) {
    const el = document.getElementById(labelId);
    if (!el) return;
        el.classList.remove("alert-danger", "alert-warning");
        if (level === "danger")  el.classList.add("alert-danger");
        if (level === "warning") el.classList.add("alert-warning");
}

function thresholdLevel(value) {
    if (absVal===0) return "danger";
    if (absVal< 0.1)   return "warning";
    return "ok";
}

function worstLevel(...levels) {
    const rank = { ok: 0, warning: 1, danger: 2 };
    return levels.reduce((a, b) => rank[a] >= rank[b] ? a : b, "ok");
}


// ── LABEL ALERT COLOURING ─────────────────────────────────────────────────────
function updateLabelAlerts(msg) {

    setLabelLevel("label-GPS", worstLevel(
        thresholdLevel(msg.Lat),
        thresholdLevel(msg.Lon),
        thresholdLevel(msg.Sc)
    ));

    setLabelLevel("label-Aux", worstLevel(
        thresholdLevel(msg.Auxvoltage),
        thresholdLevel(msg.Auxcurrent)
    ));

    setLabelLevel("label-Motor", worstLevel(
        thresholdLevel(msg.Motorvoltage),
        thresholdLevel(msg.Motorcurrent)
    ));

    setLabelLevel("label-Accel", worstLevel(
        thresholdLevel(msg.xaccel),
        thresholdLevel(msg.yaccel),
        thresholdLevel(msg.zaccel)
    ));

    setLabelLevel("label-Mag", worstLevel(
        thresholdLevel(msg.xmag),
        thresholdLevel(msg.ymag),
        thresholdLevel(msg.zmag)
    ));

    setLabelLevel("label-Gyro", worstLevel(
        thresholdLevel(msg.P),
        thresholdLevel(msg.R),
        thresholdLevel(msg.Y)
    ));

    setLabelLevel("label-Temp", worstLevel(
        thresholdLevel(msg.temp),
        thresholdLevel(msg.Hum)
    ));
}