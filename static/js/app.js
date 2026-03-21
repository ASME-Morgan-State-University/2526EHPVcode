document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  socket.on("connect", () => {
    console.log("Connected to server");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from server");
  });

  // Listen for telemetry data
  socket.on("telemetry", function (msg) {
    console.log("Telemetry received:", msg);

  if (msg) {
  // Update sensor values in tables
  document.getElementById("latitude").innerHTML = msg.Lat;
  document.getElementById("longitude").innerHTML = msg.Lon;
  document.getElementById("Satellitecount").innerHTML = msg.Sc;

  document.getElementById("Auxvoltage").innerHTML = msg.Auxvoltage;
  document.getElementById("Auxcurrent").innerHTML = msg.Auxcurrent;

  document.getElementById("Motorvoltage").innerHTML = msg.Motorvoltage;
  document.getElementById("Motorcurrent").innerHTML = msg.Motorcurrent;

  document.getElementById("Xaccel").innerHTML = msg.xaccel;
  document.getElementById("Yaccel").innerHTML = msg.yaccel;
  document.getElementById("Zaccel").innerHTML = msg.zaccel;

  document.getElementById("Xmag").innerHTML = msg.xmag;
  document.getElementById("Ymag").innerHTML = msg.ymag;
  document.getElementById("Zmag").innerHTML = msg.zmag;

  document.getElementById("Pitch").innerHTML = msg.P;
  document.getElementById("Roll").innerHTML = msg.R;
  document.getElementById("Yaw").innerHTML = msg.Y;

  document.getElementById("Temp").innerHTML = msg.temp;
  document.getElementById("Hum").innerHTML = msg.Hum;

  // Update all chart histories
  if (window.updateSensorHistory) window.updateSensorHistory(msg);

      // 📊 Chart update
      if (window.lineChart1Instance) {
        window.lineChart1Data.push(Number(msg.Lat));

        if (window.lineChart1Data.length > 20) {
          window.lineChart1Data.shift();
        }

        window.lineChart1Instance.updateSeries([
          { data: window.lineChart1Data },
        ]);
      }
    }
  });
});