"use strict";

// ── CONFIG ────────────────────────────────────────────────────────────────────
const THRESHOLDS = {
  // Voltage
  voltage:      0.00,   // V    — DANGER
  voltageWarn:  0.01,   // V    — WARNING

  // Current
  current:      0.50,   // A    — DANGER
  currentWarn:  1.00,   // A    — WARNING

  // Temperature
  temperature:  0.00,   // °C   — DANGER
  tempWarn:     0.01,   // °C   — WARNING

  // Humidity
  humidity:     0.00,   // %    — DANGER
  humWarn:      0.10,   // %    — WARNING

  // GPS (numeric — separate from binary check)
  lat:          0.00,   // °    — DANGER
  latWarn:      0.01,   // °    — WARNING
  lon:          0.00,   // °    — DANGER
  lonWarn:      0.01,   // °    — WARNING
  sc:           0.00,   //      — DANGER  (satellite count or speed)
  scWarn:       0.01,   //      — WARNING

  // IMU — Accelerometers (m/s²)
  accel:        0.00,   // m/s² — DANGER
  accelWarn:    0.01,   // m/s² — WARNING

  // IMU — Magnetometers (Gauss)
  mag:          0.00,   // G    — DANGER
  magWarn:      0.01,   // G    — WARNING

  // IMU — Gyroscopes (°)
  gyro:         0.00,   // °    — DANGER
  gyroWarn:     0.01,   // °    — WARNING
};

const sensorKeys   = ["Sensor1","Sensor2","Sensor3","Sensor4","Sensor5"];
const sensorColors = ["#007bff","#28a745","#dc3545","#ffc107","#6f42c1"];
const sensorGroups = [
    [0, 1, 2],
    [3, 4],
    [5, 6],
    [7, 8, 9, 10, 11, 12, 13, 14, 15],
    [16, 17]
];
const MAX_POINTS = 20;

let sensorCategories = [];
let sensorHistoryChart;

document.addEventListener("DOMContentLoaded", () => {
  // ── SENSOR HISTORY (APEXCHARTS) ───────────────────────────────────────────
    sensorHistoryChart = new ApexCharts(
        document.querySelector("#sensor-history-chart"),{
            chart: { type: "line", height: 300, animations: { enabled: false } },
            series: sensorKeys.map((k, i) => ({
            name: k, data: [], color: sensorColors[i]
            })),
            xaxis: { categories: [] },
            yaxis: {
                min: -0.1, max: 1.1,
                tickAmount: 1,
                labels: { formatter: v => v >= 0.5 ? "HIGH" : "LOW" }
            },
            legend: { position: "bottom" },
            stroke: { curve: "stepline" },
            annotations: {
            yaxis: [{
                y: 0.5,
                borderColor: "#dc3545",
                borderWidth: 2,
                strokeDashArray: 4,
                label: {
                    text: "LOW threshold",
                    style: { color: "#fff", background: "#dc3545" }
                }
            }]
            }
        }
    );
    sensorHistoryChart.render();

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
    const totalPower = (Motorvoltage * Motorcurrent) + (Auxvoltage * Auxcurrent);

    if (window.powerChart) {
        window.powerChart.data.labels.push(time);
        window.powerChart.data.datasets[0].data.push(parseFloat(totalPower.toFixed(2)));
        if (window.powerChart.data.labels.length > MAX_POINTS) {
            window.powerChart.data.labels.shift();
            window.powerChart.data.datasets[0].data.shift();
        }
        window.powerChart.update();
    }

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

    const rawData = [
        msg.Lat, msg.Lon, msg.Sc,
        msg.Auxvoltage, msg.Auxcurrent,
        msg.Motorvoltage, msg.Motorcurrent,
        msg.xaccel, msg.yaccel, msg.zaccel,
        msg.xmag, msg.ymag, msg.zmag,
        msg.P, msg.R, msg.Y,
        msg.temp, msg.Hum
    ];

    const sensorData = sensorGroups.map(group =>
        group.some(i => Math.abs(parseFloat(rawData[i])) > 0.5) ? 1 : 0
    );

    sensorCategories = [...sensorCategories, time].slice(-MAX_POINTS);

    const newSeries = sensorKeys.map((key, i) => {
        const prev = sensorHistoryChart.w.config.series[i].data;
        return { name: key, data: [...prev, sensorData[i]].slice(-MAX_POINTS) };
    });

    sensorHistoryChart.updateOptions({
        xaxis:  { categories: sensorCategories },
        series: newSeries
    });
}


// ── HELPERS ───────────────────────────────────────────────────────────────────

// Apply or clear alert class on a label <td>
function setLabelLevel(labelId, level) {
    const el = document.getElementById(labelId);
        if (!el) return;
        el.classList.remove("alert-danger", "alert-warning");
        if (level === "danger")  el.classList.add("alert-danger");
            if (level === "warning") el.classList.add("alert-warning");
}

// Map a numeric value to a severity level using two-band thresholds
function thresholdLevel(value, dangerBelow, warnBelow) {
    if (value < dangerBelow) return "danger";
        if (value < warnBelow)   return "warning";
            return "ok";
}

// Returns the more severe of two levels
function worstLevel(...levels) {
  const rank = { ok: 0, warning: 1, danger: 2 };
  return levels.reduce((a, b) => rank[a] >= rank[b] ? a : b, "ok");
}


// ── LABEL ALERT COLOURING ─────────────────────────────────────────────────────
function updateLabelAlerts(msg) {
  const Motorvoltage = parseFloat(msg.Motorvoltage) || 0;
  const Motorcurrent = parseFloat(msg.Motorcurrent) || 0;
    const Auxvoltage   = parseFloat(msg.Auxvoltage)   || 0;
    const Auxcurrent   = parseFloat(msg.Auxcurrent)   || 0;
    const Lat          = parseFloat(msg.Lat)           || 0;
    const Lon          = parseFloat(msg.Lon)           || 0;
    const Sc           = parseFloat(msg.Sc)            || 0;
    const xaccel       = parseFloat(msg.xaccel)        || 0;
    const yaccel       = parseFloat(msg.yaccel)        || 0;
    const zaccel       = parseFloat(msg.zaccel)        || 0;
    const xmag         = parseFloat(msg.xmag)          || 0;
    const ymag         = parseFloat(msg.ymag)          || 0;
    const zmag         = parseFloat(msg.zmag)          || 0;
    const P            = parseFloat(msg.P)             || 0;
    const R            = parseFloat(msg.R)             || 0;
    const Y            = parseFloat(msg.Y)             || 0;
    const temp         = parseFloat(msg.temp)          || 0;
    const Hum          = parseFloat(msg.Hum)           || 0;

  // ── Sensor1 [GPS] ─────────────────────────────────────────────────────────
  // All three GPS values checked individually, worst wins
    setLabelLevel("label-GPS", worstLevel(
        thresholdLevel(Math.abs(Lat), THRESHOLDS.lat,  THRESHOLDS.latWarn),
        thresholdLevel(Math.abs(Lon), THRESHOLDS.lon,  THRESHOLDS.lonWarn),
        thresholdLevel(Math.abs(Sc),  THRESHOLDS.sc,   THRESHOLDS.scWarn)
    ));

  // ── Sensor2 [AUX battery] ─────────────────────────────────────────────────
    setLabelLevel("label-Aux", worstLevel(
        thresholdLevel(Auxvoltage, THRESHOLDS.voltage, THRESHOLDS.voltageWarn),
        thresholdLevel(Auxcurrent, THRESHOLDS.current, THRESHOLDS.currentWarn)
    ));

  // ── Sensor3 [Motor battery] ───────────────────────────────────────────────
    setLabelLevel("label-Motor", worstLevel(
        thresholdLevel(Motorvoltage, THRESHOLDS.voltage, THRESHOLDS.voltageWarn),
        thresholdLevel(Motorcurrent, THRESHOLDS.current, THRESHOLDS.currentWarn)
    ));

  // ── Sensor4 [IMU Accel] ───────────────────────────────────────────────────
  // Uses Math.abs() — accelerometers produce negative values on some axes
    setLabelLevel("label-Accel", worstLevel(
        thresholdLevel(Math.abs(xaccel), THRESHOLDS.accel, THRESHOLDS.accelWarn),
        thresholdLevel(Math.abs(yaccel), THRESHOLDS.accel, THRESHOLDS.accelWarn),
        thresholdLevel(Math.abs(zaccel), THRESHOLDS.accel, THRESHOLDS.accelWarn)
    ));

  // ── Sensor4-1 [IMU Mag] ───────────────────────────────────────────────────
    setLabelLevel("label-Mag", worstLevel(
        thresholdLevel(Math.abs(xmag), THRESHOLDS.mag, THRESHOLDS.magWarn),
        thresholdLevel(Math.abs(ymag), THRESHOLDS.mag, THRESHOLDS.magWarn),
        thresholdLevel(Math.abs(zmag), THRESHOLDS.mag, THRESHOLDS.magWarn)
    ));

  // ── Sensor4-2 [IMU Gyro] ─────────────────────────────────────────────────
  // P, R, Y can all be legitimately 0 when perfectly level — only flag if
  // ALL THREE are zero simultaneously (likely offline), not individually
    setLabelLevel("label-Gyro", worstLevel(
        thresholdLevel(Math.abs(P), THRESHOLDS.gyro, THRESHOLDS.gyroWarn),
        thresholdLevel(Math.abs(R), THRESHOLDS.gyro, THRESHOLDS.gyroWarn),
    thresholdLevel(Math.abs(Y), THRESHOLDS.gyro, THRESHOLDS.gyroWarn)
    ));

  // ── Sensor5 [Temp / Humidity] ─────────────────────────────────────────────
    setLabelLevel("label-Temp", worstLevel(
        thresholdLevel(temp, THRESHOLDS.temperature, THRESHOLDS.tempWarn),
        thresholdLevel(Hum,  THRESHOLDS.humidity,    THRESHOLDS.humWarn)
    ));
}