const API_URL = "http://localhost:8200/api";

const ENDPOINTS = {
  liveEvents: "/live",
  allEvents: "/events",
  processingStatus: "/processing-status"
};

let allArchiveEvents = [];
let livePollingInterval = null;

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;

  if (page === "dashboard") {
    await initDashboardPage();
  }

  if (page === "archive") {
    await initArchivePage();
  }
});

/* =========================
   INIT
========================= */

async function initDashboardPage() {
  setupDashboardNavigation();
  setupModal();

  try {
    await Promise.all([
      loadLiveEvents(),
      loadProcessingUnits(),
      loadDashboardDerivedData()
    ]);

    startLivePolling();
  } catch (error) {
    console.error("Dashboard initialization error:", error);
  }
}

async function initArchivePage() {
  setupArchiveNavigation();
  setupArchiveFilters();

  try {
    await loadArchiveDataset();
  } catch (error) {
    console.error("Archive initialization error:", error);
  }
}

/* =========================
   FETCH
========================= */

async function fetchJSON(endpoint) {
  const response = await fetch(API_URL + endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} on ${endpoint}`);
  }

  return await response.json();
}

/* =========================
   DASHBOARD
========================= */

async function loadLiveEvents() {
  const response = await fetchJSON(ENDPOINTS.liveEvents);
  const items = Array.isArray(response?.items) ? response.items : [];
  const normalized = items.map(normalizeEvent);
  renderLiveEvents(normalized);
}

async function loadProcessingUnits() {
  const response = await fetchJSON(ENDPOINTS.processingStatus);
  const units = Array.isArray(response?.units) ? response.units : [];
  renderProcessingUnits(units.map(normalizeProcessingUnit));
}

async function loadDashboardDerivedData() {
  const response = await fetchJSON(ENDPOINTS.allEvents);
  const items = Array.isArray(response?.items) ? response.items : [];
  const normalized = items.map(normalizeEvent);

  const sensors = buildSensorsFromEvents(normalized);
  renderSensors(sensors);

  const info = buildSystemInfo(normalized, sensors);
  renderSystemInfo(info);
}

function startLivePolling() {
  if (livePollingInterval) {
    clearInterval(livePollingInterval);
  }

  livePollingInterval = setInterval(async () => {
    try {
      await Promise.all([
        loadLiveEvents(),
        loadProcessingUnits(),
        loadDashboardDerivedData()
      ]);
    } catch (error) {
      console.error("Live polling error:", error);
    }
  }, 5000);
}

/* =========================
   ARCHIVE
========================= */

async function loadArchiveDataset() {
  const response = await fetchJSON(ENDPOINTS.allEvents);
  const items = Array.isArray(response?.items) ? response.items : [];
  allArchiveEvents = items.map(normalizeEvent);

  renderArchiveEvents(allArchiveEvents);
  renderMTBE(allArchiveEvents);
}

/* =========================
   NAVIGATION
========================= */

function setupDashboardNavigation() {
  const goArchiveBtn = document.getElementById("goArchiveBtn");
  if (goArchiveBtn) {
    goArchiveBtn.addEventListener("click", () => {
      window.location.href = "archive.html";
    });
  }
}

function setupArchiveNavigation() {
  const goDashboardBtn = document.getElementById("goDashboardBtn");
  if (goDashboardBtn) {
    goDashboardBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
}

/* =========================
   RENDER DASHBOARD
========================= */

function renderLiveEvents(events) {
  const tbody = document.querySelector("#liveEventsTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  events.forEach((event) => {
    const row = document.createElement("tr");
    row.classList.add("clickable-row");

    row.innerHTML = `
      <td>${escapeHtml(event.id)}</td>
      <td class="${getHzClass(event.type)}">${formatFrequency(event.frequency)}</td>
      <td class="${getTypeClass(event.type)}">${escapeHtml(event.type)}</td>
      <td>${escapeHtml(event.sensorId)}</td>
      <td>${escapeHtml(formatTimeOnly(event.timestamp))}</td>
    `;

    row.addEventListener("click", () => openEventModal(event));
    tbody.appendChild(row);
  });
}

function formatDateTime(timestamp) {
  if (!timestamp || timestamp === "-") return "-";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return String(timestamp);

  return date.toISOString().replace("T", " ").substring(0, 19) + " UTC";
}

function renderProcessingUnits(units) {
  const tbody = document.querySelector("#unitsTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  units.forEach((unit) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(unit.id)}</td>
      <td class="${unit.stateClass}">${escapeHtml(unit.stateLabel)}</td>
      <td>${escapeHtml(unit.lastChecked)}</td>
    `;

    tbody.appendChild(row);
  });
}

function renderSensors(sensors) {
  const tbody = document.querySelector("#sensorsTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  sensors.forEach((sensor) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(sensor.id)}</td>
      <td>${escapeHtml(String(sensor.eventsCount))}</td>
      <td>${escapeHtml(sensor.latitude)}</td>
      <td>${escapeHtml(sensor.longitude)}</td>
    `;

    tbody.appendChild(row);
  });
}

function renderSystemInfo(info) {
  const container = document.getElementById("systemInfo");
  if (!container) return;

  container.innerHTML = "";

  Object.entries(info).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "info-row";
    row.innerHTML = `
      <span class="info-label">${escapeHtml(key)}: </span>
      <span class="info-value">${escapeHtml(String(value))}</span>
    `;
    container.appendChild(row);
  });
}

/* =========================
   RENDER ARCHIVE
========================= */

function renderArchiveEvents(events) {
  const tbody = document.querySelector("#archiveTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  events.forEach((event) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(event.id)}</td>
      <td>${escapeHtml(event.sensorId)}</td>
      <td>${escapeHtml(event.sensorName)}</td>
      <td class="${getTypeClass(event.type)}">${escapeHtml(event.type)}</td>
      <td>${formatTimestampForTable(event.timestamp)}</td>
      <td>${escapeHtml(event.region)}</td>
      <td>${escapeHtml(event.category)}</td>
      <td>${escapeHtml(formatFrequencyPlain(event.frequency))}</td>
      <td>${escapeHtml(String(event.amplitude))}</td>
      <td>${escapeHtml(String(event.peakSpectrum))}</td>
      <td>${escapeHtml(String(event.windowSize))}</td>
      <td>${escapeHtml(event.reportedBy)}</td>
      <td>${escapeHtml(event.latitude)}</td>
      <td>${escapeHtml(event.longitude)}</td>
      <td>${formatTimestampForTable(event.createdAt)}</td>
    `;

    tbody.appendChild(row);
  });
}

function renderMTBE(events) {
  setText("mtbeEarthquake", computeMTBE(events, "Earthquake"));
  setText("mtbeConventional", computeMTBE(events, "Conventional Explosion"));
  setText("mtbeNuclear", computeMTBE(events, "Nuclear Explosion"));
}

/* =========================
   FILTERS
========================= */

function setupArchiveFilters() {
  const applyBtn = document.getElementById("applyFiltersBtn");
  const clearBtn = document.getElementById("clearFiltersBtn");

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const filtered = applyArchiveFiltersClientSide();
      renderArchiveEvents(filtered);
      renderMTBE(filtered);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      setInputValue("dateFromFilter", "");
      setInputValue("dateToFilter", "");
      setInputValue("eventTypeFilter", "");
      setInputValue("sensorIdFilter", "");
      setInputValue("latitudeFromFilter", "");
      setInputValue("latitudeToFilter", "");
      setInputValue("longitudeFromFilter", "");
      setInputValue("longitudeToFilter", "");

      renderArchiveEvents(allArchiveEvents);
      renderMTBE(allArchiveEvents);
    });
  }
}

function applyArchiveFiltersClientSide() {
  const type = getInputValue("eventTypeFilter").toLowerCase();
  const sensorId = getInputValue("sensorIdFilter").toLowerCase();

  const dateFromValue = getInputValue("dateFromFilter");
  const dateToValue = getInputValue("dateToFilter");

  const latitudeFromValue = getInputValue("latitudeFromFilter");
  const latitudeToValue = getInputValue("latitudeToFilter");

  const longitudeFromValue = getInputValue("longitudeFromFilter");
  const longitudeToValue = getInputValue("longitudeToFilter");

  const dateFrom = dateFromValue ? new Date(dateFromValue) : null;
  const dateTo = dateToValue ? new Date(dateToValue + "T23:59:59") : null;

  const latitudeFrom = latitudeFromValue !== "" ? parseFloat(latitudeFromValue) : null;
  const latitudeTo = latitudeToValue !== "" ? parseFloat(latitudeToValue) : null;

  const longitudeFrom = longitudeFromValue !== "" ? parseFloat(longitudeFromValue) : null;
  const longitudeTo = longitudeToValue !== "" ? parseFloat(longitudeToValue) : null;

  return allArchiveEvents.filter((event) => {
    const eventDate = new Date(event.timestamp);
    const eventLat = parseFloat(event.latitude);
    const eventLon = parseFloat(event.longitude);

    const matchesType =
      !type || event.type.toLowerCase().includes(type);

    const matchesSensor =
      !sensorId || event.sensorId.toLowerCase().includes(sensorId);

    const matchesDateFrom =
      !dateFrom || eventDate >= dateFrom;

    const matchesDateTo =
      !dateTo || eventDate <= dateTo;

    const matchesLatitudeFrom =
      latitudeFrom === null || (!Number.isNaN(eventLat) && eventLat >= latitudeFrom);

    const matchesLatitudeTo =
      latitudeTo === null || (!Number.isNaN(eventLat) && eventLat <= latitudeTo);

    const matchesLongitudeFrom =
      longitudeFrom === null || (!Number.isNaN(eventLon) && eventLon >= longitudeFrom);

    const matchesLongitudeTo =
      longitudeTo === null || (!Number.isNaN(eventLon) && eventLon <= longitudeTo);

    return (
      matchesType &&
      matchesSensor &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesLatitudeFrom &&
      matchesLatitudeTo &&
      matchesLongitudeFrom &&
      matchesLongitudeTo
    );
  });
}

/* =========================
   MODAL
========================= */

function setupModal() {
  const modal = document.getElementById("eventModal");
  const closeBtn = document.getElementById("closeModalBtn");

  if (!modal || !closeBtn) return;

  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  });
}

function openEventModal(event) {
  const modal = document.getElementById("eventModal");
  const body = document.getElementById("eventDetailsBody");
  if (!modal || !body) return;

  body.innerHTML = `
    <div class="detail-grid">
      <div class="detail-label">Event ID</div>
      <div class="detail-value">${escapeHtml(event.id)}</div>

      <div class="detail-label">Sensor ID</div>
      <div class="detail-value">${escapeHtml(event.sensorId)}</div>

      <div class="detail-label">Sensor Name</div>
      <div class="detail-value">${escapeHtml(event.sensorName)}</div>

      <div class="detail-label">Type</div>
      <div class="detail-value ${getTypeClass(event.type)}">${escapeHtml(event.type)}</div>

      <div class="detail-label">Timestamp</div>
      <div class="detail-value">${escapeHtml(event.timestamp)}</div>

      <div class="detail-label">Region</div>
      <div class="detail-value">${escapeHtml(event.region)}</div>

      <div class="detail-label">Category</div>
      <div class="detail-value">${escapeHtml(event.category)}</div>

      <div class="detail-label">Dominant Frequency</div>
      <div class="detail-value">${escapeHtml(formatFrequencyPlain(event.frequency))} Hz</div>

      <div class="detail-label">Peak Amplitude</div>
      <div class="detail-value">${escapeHtml(String(event.amplitude))}</div>

      <div class="detail-label">Peak Spectrum</div>
      <div class="detail-value">${escapeHtml(String(event.peakSpectrum))}</div>

      <div class="detail-label">Window Size</div>
      <div class="detail-value">${escapeHtml(String(event.windowSize))}</div>

      <div class="detail-label">Reported By</div>
      <div class="detail-value">${escapeHtml(event.reportedBy)}</div>

      <div class="detail-label">Latitude</div>
      <div class="detail-value">${escapeHtml(event.latitude)}</div>

      <div class="detail-label">Longitude</div>
      <div class="detail-value">${escapeHtml(event.longitude)}</div>

      <div class="detail-label">Created At</div>
      <div class="detail-value">${escapeHtml(event.createdAt)}</div>
    </div>
  `;

  modal.classList.remove("hidden");
}

/* =========================
   NORMALIZATION
========================= */

function normalizeEvent(event) {
  const coordinates = parseCoordinates(event.coordinates);

  return {
    id: event.id ?? "-",
    sensorId: event.sensor_id ?? "-",
    sensorName: event.sensor_name ?? "-",
    category: event.category ?? "-",
    region: event.region ?? "-",
    type: normalizeEventType(event.event_type ?? "-"),
    timestamp: event.event_timestamp ?? "-",
    frequency: Number(event.dominant_frequency_hz ?? 0),
    amplitude: event.peak_amplitude ?? "-",
    peakSpectrum: event.peak_spectrum ?? "-",
    windowSize: event.window_size ?? "-",
    reportedBy: event.reported_by ?? "-",
    createdAt: event.created_at ?? "-",
    latitude: extractLatitude(coordinates),
    longitude: extractLongitude(coordinates)
  };
}

function normalizeProcessingUnit(unit) {
  const rawState = String(unit.status ?? "unknown").toLowerCase();

  let stateLabel = "Non active";
  let stateClass = "state-failed";

  if (rawState === "online") {
    stateLabel = "Active";
    stateClass = "state-active";
  } else if (rawState === "suspect") {
    stateLabel = "Suspect";
    stateClass = "type-conventional";
  } else if (rawState === "offline") {
    stateLabel = "Offline";
    stateClass = "state-failed";
  }

  return {
    id: unit.service_id || unit.url || "-",
    stateLabel,
    stateClass,
    lastChecked: formatDateTime(unit.last_ok_at)
  };
}

function parseCoordinates(value) {
  if (!value) return {};

  if (typeof value === "object") {
    return value;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  return {};
}

function extractLatitude(coords) {
  const value =
    coords.latitude ??
    coords.lat ??
    coords.y ??
    "-";

  return String(value);
}

function extractLongitude(coords) {
  const value =
    coords.longitude ??
    coords.lon ??
    coords.lng ??
    coords.x ??
    "-";

  return String(value);
}

function buildSensorsFromEvents(events) {
  const map = new Map();

  events.forEach((event) => {
    const key = event.sensorId;
    if (!map.has(key)) {
      map.set(key, {
        id: event.sensorId,
        eventsCount: 0,
        latitude: event.latitude,
        longitude: event.longitude
      });
    }

    const current = map.get(key);
    current.eventsCount += 1;

    if ((current.latitude === "-" || current.latitude === "") && event.latitude !== "-") {
      current.latitude = event.latitude;
    }

    if ((current.longitude === "-" || current.longitude === "") && event.longitude !== "-") {
      current.longitude = event.longitude;
    }
  });

  return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
}

function buildSystemInfo(events, sensors) {
  const latestCreatedAt =
    events.length > 0
      ? [...events]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
          .createdAt
      : "-";

  return {
    "Gateway API": API_URL,
    "Stored Events": events.length,
    "Known Sensors": sensors.length,
    "Live Refresh": "Every 5 seconds",
    "Live Source": "/api/live",
    "Archive Source": "/api/events",
    "Last Record Created": latestCreatedAt
  };
}

/* =========================
   MTBE
========================= */

function computeMTBE(events, type) {
  const filtered = events
    .filter((event) => event.type === type)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (filtered.length < 2) {
    return "-";
  }

  let totalDiffMs = 0;

  for (let i = 1; i < filtered.length; i++) {
    const prev = new Date(filtered[i-1].timestamp).getTime();
    const curr = new Date(filtered[i].timestamp).getTime();
    totalDiffMs += curr - prev;
  }

  const avgMs = totalDiffMs / (filtered.length - 1);
  const seconds = avgMs / (1000);

  return `${seconds.toFixed(1)} s`;
}

/* =========================
   HELPERS
========================= */

function normalizeEventType(type) {
  const value = String(type).toLowerCase().replaceAll("_", " ").trim();

  if (value.includes("earthquake")) return "Earthquake";
  if (value.includes("conventional")) return "Conventional Explosion";
  if (value.includes("nuclear")) return "Nuclear Explosion";

  return String(type);
}

function getTypeClass(type) {
  if (type === "Earthquake") return "type-earthquake";
  if (type === "Conventional Explosion") return "type-conventional";
  return "type-nuclear";
}

function getHzClass(type) {
  if (type === "Earthquake") return "hz-earthquake";
  if (type === "Conventional Explosion") return "hz-conventional";
  return "hz-nuclear";
}

function formatFrequency(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "-";
  return `${number.toFixed(1)}Hz`;
}

function formatFrequencyPlain(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "-";
  return `${number.toFixed(1)}`;
}

function formatTimeOnly(timestamp) {
  if (!timestamp || timestamp === "-") return "-";

  const date = new Date(timestamp);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().substring(11, 19) + " UTC";
  }

  return String(timestamp);
}

function formatTimestampForTable(timestamp) {
  if (!timestamp || timestamp === "-") return "-";

  const date = new Date(timestamp);
  if (!Number.isNaN(date.getTime())) {
    const iso = date.toISOString().replace("T", " ");
    return iso.substring(0, 19).replace(" ", "<br>");
  }

  return escapeHtml(String(timestamp)).replace(" ", "<br>");
}

function getInputValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function setInputValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.value = value;
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}