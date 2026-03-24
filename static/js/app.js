"use strict";

// ── CONFIG ────────────────────────────────────────────────────────────────────
const THRESHOLDS = {
    voltage:      10.00,
    voltageWarn:   0.01,
    current:       0.50,
    currentWarn:   1.00,
    temperature:   0.00,
    tempWarn:      0.01,
    humidity:      0.00,
    humWarn:       0.10,
    lat:           0.00,
    latWarn:       0.01,
    lon:           0.00,
    lonWarn:       0.01,
    sc:            0.00,
    scWarn:        0.01,
    accel:         0.00,
    accelWarn:     0.01,
    mag:           0.00,
    magWarn:       0.01,
    gyro:          0.00,
    gyroWarn:      0.01,
};

const MAX_POINTS = 20;

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
    const time         = new Date().toLocaleTimeString();
    const Motorvoltage = parseFloat(msg.Motorvoltage) || 0;
    const Motorcurrent = parseFloat(msg.Motorcurrent) || 0;
    const Auxvoltage   = parseFloat(msg.Auxvoltage)   || 0;
    const Auxcurrent   = parseFloat(msg.Auxcurrent)   || 0;
    const motorPower   = Motorvoltage * Motorcurrent;
    const auxPower     = Auxvoltage   * Auxcurrent;

    // ── Power bar chart ───────────────────────────────────────────────────────
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

    }


    // ── HELPERS ───────────────────────────────────────────────────────────────────
    function setLabelLevel(labelId, level) {
        const el = document.getElementById(labelId);
        if (!el) return;
        el.classList.remove("alert-danger", "alert-warning");
        if (level === "danger")  el.classList.add("alert-danger");
        if (level === "warning") el.classList.add("alert-warning");
    }

/*
    FIX: thresholdLevel now correctly receives the raw value AND the two
    threshold keys to look up in THRESHOLDS, instead of using a phantom
    variable `absVal` that never existed.

    Logic per the request:
        value === 0          → "danger"   (red)
        0 < |value| < 0.5   → "warning"  (orange)  [closest to 0 end]
        |value| >= 0.5       → "ok"       (no colour change)

    The dangerBelow / warnBelow parameters let each sensor type use
    its own threshold pair from the THRESHOLDS config object.
*/
function thresholdLevel(value, dangerBelow, warnBelow) {
    const abs = Math.abs(parseFloat(value) || 0);
    if (abs <= dangerBelow) return "danger";
    if (abs <  warnBelow)   return "warning";
    return "ok";
}

function worstLevel(...levels) {
    const rank = { ok: 0, warning: 1, danger: 2 };
    return levels.reduce((a, b) => rank[a] >= rank[b] ? a : b, "ok");
}


// ── LABEL ALERT COLOURING ─────────────────────────────────────────────────────
/*
    Each sensor label checks ALL the values that belong to that row.
    The worst (most severe) level among all values wins.

    Sensor1 [GPS] — Lat, Lon, Sc
        value === 0        → red   (no GPS fix, sensor offline)
        0 < value < 0.5    → orange (weak / partial fix)
        value >= 0.5       → ok

    All other sensors follow their specific THRESHOLDS danger/warn pair.
    */
function updateLabelAlerts(msg) {

    // ── Sensor1 [GPS] ─────────────────────────────────────────────────────────
    // Uses lat/lon/sc thresholds — value=0 means no fix → red
    setLabelLevel("label-GPS", worstLevel(
        thresholdLevel(msg.Lat, THRESHOLDS.lat,  THRESHOLDS.latWarn),
        thresholdLevel(msg.Lon, THRESHOLDS.lon,  THRESHOLDS.lonWarn),
        thresholdLevel(msg.Sc,  THRESHOLDS.sc,   THRESHOLDS.scWarn)
    ));

    // ── Sensor2 [AUX battery] ─────────────────────────────────────────────────
    setLabelLevel("label-Aux", worstLevel(
        thresholdLevel(msg.Auxvoltage, THRESHOLDS.voltage, THRESHOLDS.voltageWarn),
        thresholdLevel(msg.Auxcurrent, THRESHOLDS.current, THRESHOLDS.currentWarn)
    ));

    // ── Sensor3 [Motor battery] ───────────────────────────────────────────────
    setLabelLevel("label-Motor", worstLevel(
        thresholdLevel(msg.Motorvoltage, THRESHOLDS.voltage, THRESHOLDS.voltageWarn),
        thresholdLevel(msg.Motorcurrent, THRESHOLDS.current, THRESHOLDS.currentWarn)
    ));

    // ── Sensor4 [IMU Accel] ───────────────────────────────────────────────────
    // Math.abs handled inside thresholdLevel — accel can be negative
    setLabelLevel("label-Accel", worstLevel(
        thresholdLevel(msg.xaccel, THRESHOLDS.accel, THRESHOLDS.accelWarn),
        thresholdLevel(msg.yaccel, THRESHOLDS.accel, THRESHOLDS.accelWarn),
        thresholdLevel(msg.zaccel, THRESHOLDS.accel, THRESHOLDS.accelWarn)
    ));

    // ── Sensor4-1 [IMU Mag] ───────────────────────────────────────────────────
    setLabelLevel("label-Mag", worstLevel(
        thresholdLevel(msg.xmag, THRESHOLDS.mag, THRESHOLDS.magWarn),
        thresholdLevel(msg.ymag, THRESHOLDS.mag, THRESHOLDS.magWarn),
        thresholdLevel(msg.zmag, THRESHOLDS.mag, THRESHOLDS.magWarn)
    ));

    // ── Sensor4-2 [IMU Gyro] ─────────────────────────────────────────────────
    setLabelLevel("label-Gyro", worstLevel(
        thresholdLevel(msg.P, THRESHOLDS.gyro, THRESHOLDS.gyroWarn),
        thresholdLevel(msg.R, THRESHOLDS.gyro, THRESHOLDS.gyroWarn),
        thresholdLevel(msg.Y, THRESHOLDS.gyro, THRESHOLDS.gyroWarn)
    ));

    // ── Sensor5 [Temp / Humidity] ─────────────────────────────────────────────
    setLabelLevel("label-Temp", worstLevel(
        thresholdLevel(msg.temp, THRESHOLDS.temperature, THRESHOLDS.tempWarn),
        thresholdLevel(msg.Hum,  THRESHOLDS.humidity,    THRESHOLDS.humWarn)
    ));
}