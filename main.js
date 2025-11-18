import "./style.css";
import PocketBase from "pocketbase";

// collegamento a pocketbase locale
const pb = new PocketBase("http://127.0.0.1:8090");

// nome della collection che ho deciso di usare
const COLLECTION = "Meteorologia";

// inizializzo la mappa centrata in modo generico
const map = L.map("map").setView([20, 0], 2);

// tile di base di OpenStreetMap
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

/* --------------------------------------------------
   funzione che decide il colore del marker in base
   alla temperatura (schema che ho scelto io)
-------------------------------------------------- */
function getMarkerColor(temp) {
  if (!Number.isFinite(temp)) return "grey"; // se non ho dati metto grigio
  if (temp > 20) return "red";
  if (temp > 10) return "yellow";
  if (temp > 0) return "green";
  return "blue";
}

/* --------------------------------------------------
   qui creo realmente il marker sulla mappa
   uso i circleMarker perché si vedono meglio
-------------------------------------------------- */
function createMarker(lat, lon, record) {
  const color = getMarkerColor(record.temperature);

  const marker = L.circleMarker([lat, lon], {
    color,
    fillColor: color,
    fillOpacity: 0.6,
    radius: 10,
  }).addTo(map);

  // popup con alcune info utili
  marker.bindPopup(`
    <b>${record.address || "Senza nome"}</b><br>
    <small>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}</small><br>
    Temperatura: ${
      Number.isFinite(record.temperature)
        ? record.temperature + "°C"
        : "N/D"
    }
  `);

  // aggiorno anche il pannello laterale
  addToList(record, color);
}

/* --------------------------------------------------
   aggiungo un record nella lista laterale
   così si vede l'elenco dei punti
-------------------------------------------------- */
function addToList(record, color) {
  const list = document.getElementById("marker-list");
  if (!list) return;

  const li = document.createElement("li");
  li.className = "marker-item";

  li.innerHTML = `
    <span class="dot" style="background:${color}"></span>
    <span class="city">${record.address || "Senza nome"}</span>
    <span class="temp">${
      Number.isFinite(record.temperature)
        ? record.temperature + "°C"
        : "—"
    }</span>
  `;

  list.appendChild(li);
}

/* --------------------------------------------------
   ricostruisce tutta la lista da zero
   (utile all'avvio)
-------------------------------------------------- */
function populateList(records) {
  const list = document.getElementById("marker-list");
  if (!list) return;
  list.innerHTML = "";

  records.forEach((r) =>
    addToList(r, getMarkerColor(r.temperature))
  );
}

/* --------------------------------------------------
   creo una leggenda per capire i colori della mappa
-------------------------------------------------- */
function createLegend() {
  const legend = L.control({ position: "bottomright" });

  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");

    const items = [
      { label: "> 20°C", color: "red" },
      { label: "10–20°C", color: "yellow" },
      { label: "1–10°C", color: "green" },
      { label: "≤ 0°C", color: "blue" },
      { label: "Nessun dato", color: "grey" },
    ];

    div.innerHTML = "<h4>Temperature</h4>";

    items.forEach((i) => {
      div.innerHTML += `
        <div><i style="background:${i.color}"></i>${i.label}</div>
      `;
    });

    return div;
  };

  legend.addTo(map);
}

/* --------------------------------------------------
   aggiorno le statistiche in basso (numero punti, media, ecc.)
-------------------------------------------------- */
async function updateStats(records = null) {
  const data =
    records ||
    (await pb.collection(COLLECTION).getFullList());

  const temps = data
    .map((r) => r.temperature)
    .filter((t) => Number.isFinite(t));

  // totale punti
  document.getElementById("total-markers").textContent =
    data.length;

  // se non ho temperature evito calcoli strani
  if (!temps.length) {
    document.getElementById("average-temperature").textContent = "—";
    document.getElementById("highest-temperature").textContent = "—";
    document.getElementById("lowest-temperature").textContent = "—";
    return;
  }

  // calcoli base
  const avg =
    temps.reduce((a, b) => a + b, 0) / temps.length;

  document.getElementById("average-temperature").textContent =
    avg.toFixed(2) + "°C";
  document.getElementById("highest-temperature").textContent =
    Math.max(...temps) + "°C";
  document.getElementById("lowest-temperature").textContent =
    Math.min(...temps) + "°C";
}

/* --------------------------------------------------
   caricamento iniziale dei dati dalla collection
-------------------------------------------------- */
(async function init() {
  const records = await pb.collection(COLLECTION).getFullList();

  // creo ogni marker sulla mappa
  records.forEach((rec) => {
    if (rec.coordinate?.lat && rec.coordinate?.lon) {
      createMarker(
        rec.coordinate.lat,
        rec.coordinate.lon,
        rec
      );
    }
  });

  populateList(records);
  createLegend();
  updateStats(records);
})();

/* --------------------------------------------------
   quando clicco sulla mappa voglio aggiungere un punto
-------------------------------------------------- */
let placingEnabled = true;

map.on("click", async (ev) => {
  if (!placingEnabled) return;

  const lat = ev.latlng.lat;
  const lon = ev.latlng.lng;

  // prendo il nome del luogo con Nominatim
  const locRes = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
  );
  const loc = await locRes.json();

  const addr = loc.address || {};
  const address =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    loc.display_name ||
    `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

  // prendo la temperatura tramite Open-Meteo
  const wRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
  );
  const wJson = await wRes.json();

  const temp = wJson.current_weather?.temperature ?? null;

  // costruisco il record per pocketbase
  const data = {
    coordinate: { lat, lon },
    address,
    temperature: Number.isFinite(temp) ? temp : null,
  };

  // lo salvo in pb
  const record = await pb.collection(COLLECTION).create(data);

  // infine creo visivamente il marker
  createMarker(lat, lon, record);
  updateStats();
});

/* --------------------------------------------------
   elimina tutti i record e resetta la pagina
-------------------------------------------------- */
async function clearDatabase() {
  const records = await pb.collection(COLLECTION).getFullList();

  await Promise.all(
    records.map((r) =>
      pb.collection(COLLECTION).delete(r.id)
    )
  );

  location.reload();
}

// tasto che pulisce tutto
document
  .getElementById("clear-database-btn")
  .addEventListener("click", () => {
    if (
      confirm(
        "Sei sicuro di voler cancellare tutti i marker? L'azione non si può annullare."
      )
    ) {
      clearDatabase();
    }
  });

// attiva/disattiva il posizionamento di nuovi marker
document
  .getElementById("toggle-placing-btn")
  .addEventListener("click", function () {
    placingEnabled = !placingEnabled;

    this.textContent = placingEnabled
      ? "Disable Marker Placement"
      : "Enable Marker Placement";

    this.style.backgroundColor = placingEnabled
      ? "#dc3545"
      : "#28a745";
  });
