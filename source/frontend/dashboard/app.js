const API_URL = "http://localhost:8000/api";

const ENDPOINTS = {
  latestEvents: "/events/latest",
  archiveEvents: "/events/history",
  processingUnits: "/processing-units",
  sensors: "/sensors",
  systemInfo: "/system/config",
  mtbe: "/events/mtbe",
  liveStream: "/stream/events"
};

const USE_MOCK_DATA = true;

const MOCK_DATA = {
  latestEvents: [
    {
      id: "EVT-1001",
      type: "Earthquake",
      frequency: 1.4,
      sensorId: "SEN-001",
      timestamp: "2026-03-29T10:12:10Z",
      amplitude: 8.2,
      location: "Rome Sector A",
      latitude: "41.9028",
      longitude: "12.4964"
    },
    {
      id: "EVT-1002",
      type: "Conventional Explosion",
      frequency: 5.7,
      sensorId: "SEN-004",
      timestamp: "2026-03-29T10:13:42Z",
      amplitude: 14.1,
      location: "Naples Sector B",
      latitude: "40.8518",
      longitude: "14.2681"
    },
    {
      id: "EVT-1003",
      type: "Nuclear Explosion",
      frequency: 10.8,
      sensorId: "SEN-006",
      timestamp: "2026-03-29T10:14:20Z",
      amplitude: 21.5,
      location: "Taranto Sector C",
      latitude: "40.4644",
      longitude: "17.2470"
    },
    {
      id: "EVT-1004",
      type: "Earthquake",
      frequency: 2.3,
      sensorId: "SEN-002",
      timestamp: "2026-03-29T10:15:31Z",
      amplitude: 9.6,
      location: "Milan Sector D",
      latitude: "45.4642",
      longitude: "9.1900"
    },
    {
      id: "EVT-1005",
      type: "Conventional Explosion",
      frequency: 4.1,
      sensorId: "SEN-007",
      timestamp: "2026-03-29T10:17:05Z",
      amplitude: 12.7,
      location: "Bari Sector E",
      latitude: "41.1171",
      longitude: "16.8719"
    },
    {
      id: "EVT-1006",
      type: "Earthquake",
      frequency: 0.9,
      sensorId: "SEN-003",
      timestamp: "2026-03-29T10:18:11Z",
      amplitude: 6.9,
      location: "Turin Sector F",
      latitude: "45.0703",
      longitude: "7.6869"
    },
    {
      id: "EVT-1007",
      type: "Nuclear Explosion",
      frequency: 12.1,
      sensorId: "SEN-008",
      timestamp: "2026-03-29T10:19:48Z",
      amplitude: 24.3,
      location: "Cagliari Sector G",
      latitude: "39.2238",
      longitude: "9.1217"
    },
    {
      id: "EVT-1008",
      type: "Conventional Explosion",
      frequency: 6.2,
      sensorId: "SEN-005",
      timestamp: "2026-03-29T10:20:36Z",
      amplitude: 13.4,
      location: "Palermo Sector H",
      latitude: "38.1157",
      longitude: "13.3615"
    }
  ],

  processingUnits: [
    { id: "PRU-001", state: "active" },
    { id: "PRU-002", state: "active" },
    { id: "PRU-003", state: "active" },
    { id: "PRU-004", state: "failed" },
    { id: "PRU-005", state: "active" },
    { id: "PRU-006", state: "failed" }
  ],

  sensors: [
    { id: "SEN-001", eventsCount: 34, latitude: "41.9028", longitude: "12.4964" },
    { id: "SEN-002", eventsCount: 18, latitude: "45.4642", longitude: "9.1900" },
    { id: "SEN-003", eventsCount: 25, latitude: "45.0703", longitude: "7.6869" },
    { id: "SEN-004", eventsCount: 41, latitude: "40.8518", longitude: "14.2681" },
    { id: "SEN-005", eventsCount: 22, latitude: "38.1157", longitude: "13.3615" },
    { id: "SEN-006", eventsCount: 9, latitude: "40.4644", longitude: "17.2470" },
    { id: "SEN-007", eventsCount: 27, latitude: "41.1171", longitude: "16.8719" },
    { id: "SEN-008", eventsCount: 13, latitude: "39.2238", longitude: "9.1217" }
  ],

  systemInfo: {
    samplingRate: "20 Hz",
    windowSize: 128,
    overlap: "50%",
    processingMethod: "FFT",
    deploymentVersion: "v1.2.4",
    totalSensors: 8,
    totalProcessingUnits: 6
  },

  mtbe: {
    earthquake: "18.4 h",
    conventionalExplosion: "9.7 h",
    nuclearExplosion: "43.2 h"
  },

  archiveEvents: [
    {
      id: "EVT-0951",
      type: "Earthquake",
      frequency: 1.1,
      sensorId: "SEN-001",
      timestamp: "2026-03-28T08:10:00Z",
      amplitude: 7.2,
      location: "Rome Sector A",
      latitude: "41.9028",
      longitude: "12.4964"
    },
    {
      id: "EVT-0952",
      type: "Conventional Explosion",
      frequency: 4.9,
      sensorId: "SEN-004",
      timestamp: "2026-03-28T09:25:00Z",
      amplitude: 13.3,
      location: "Naples Sector B",
      latitude: "40.8518",
      longitude: "14.2681"
    },
    {
      id: "EVT-0953",
      type: "Nuclear Explosion",
      frequency: 11.6,
      sensorId: "SEN-006",
      timestamp: "2026-03-28T10:41:00Z",
      amplitude: 22.4,
      location: "Taranto Sector C",
      latitude: "40.4644",
      longitude: "17.2470"
    },
    {
      id: "EVT-0954",
      type: "Earthquake",
      frequency: 2.0,
      sensorId: "SEN-003",
      timestamp: "2026-03-28T11:15:00Z",
      amplitude: 8.7,
      location: "Turin Sector F",
      latitude: "45.0703",
      longitude: "7.6869"
    },
    {
      id: "EVT-0955",
      type: "Conventional Explosion",
      frequency: 5.3,
      sensorId: "SEN-005",
      timestamp: "2026-03-28T12:02:00Z",
      amplitude: 12.5,
      location: "Palermo Sector H",
      latitude: "38.1157",
      longitude: "13.3615"
    },
    {
      id: "EVT-0956",
      type: "Earthquake",
      frequency: 0.8,
      sensorId: "SEN-002",
      timestamp: "2026-03-28T12:48:00Z",
      amplitude: 6.1,
      location: "Milan Sector D",
      latitude: "45.4642",
      longitude: "9.1900"
    },
    {
      id: "EVT-0957",
      type: "Nuclear Explosion",
      frequency: 9.9,
      sensorId: "SEN-008",
      timestamp: "2026-03-28T13:33:00Z",
      amplitude: 20.9,
      location: "Cagliari Sector G",
      latitude: "39.2238",
      longitude: "9.1217"
    },
    {
      id: "EVT-0958",
      type: "Conventional Explosion",
      frequency: 6.0,
      sensorId: "SEN-007",
      timestamp: "2026-03-28T14:21:00Z",
      amplitude: 11.9,
      location: "Bari Sector E",
      latitude: "41.1171",
      longitude: "16.8719"
    },
    {
      id: "EVT-0959",
      type: "Earthquake",
      frequency: 1.7,
      sensorId: "SEN-001",
      timestamp: "2026-03-28T15:40:00Z",
      amplitude: 8.4,
      location: "Rome Sector A",
      latitude: "41.9028",
      longitude: "12.4964"
    },
    {
      id: "EVT-0960",
      type: "Conventional Explosion",
      frequency: 3.8,
      sensorId: "SEN-004",
      timestamp: "2026-03-28T16:03:00Z",
      amplitude: 10.6,
      location: "Naples Sector B",
      latitude: "40.8518",
      longitude: "14.2681"
    },
    {
      id: "EVT-0961",
      type: "Nuclear Explosion",
      frequency: 13.0,
      sensorId: "SEN-006",
      timestamp: "2026-03-28T16:49:00Z",
      amplitude: 23.7,
      location: "Taranto Sector C",
      latitude: "40.4644",
      longitude: "17.2470"
    },
    {
      id: "EVT-0962",
      type: "Earthquake",
      frequency: 2.6,
      sensorId: "SEN-003",
      timestamp: "2026-03-28T17:10:00Z",
      amplitude: 9.1,
      location: "Turin Sector F",
      latitude: "45.0703",
      longitude: "7.6869"
    }
  ]
};

let liveStreamSource = null;
let mockStreamInterval = null;

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
      loadSensors(),
      loadSystemInfo()
    ]);

    connectLiveStream();
  } catch (error) {
    console.error("Dashboard initialization error:", error);
  }
}

async function initArchivePage() {
  setupArchiveNavigation();
  setupArchiveFilters();

  try {
    await Promise.all([
      loadArchiveEvents(),
      loadMTBE()
    ]);
  } catch (error) {
    console.error("Archive initialization error:", error);
  }
}

/* =========================
   API HELPERS
========================= */

async function fetchJSON(endpoint, queryParams = null) {
  if (USE_MOCK_DATA) {
    if (endpoint === ENDPOINTS.latestEvents) {
      return MOCK_DATA.latestEvents;
    }

    if (endpoint === ENDPOINTS.processingUnits) {
      return MOCK_DATA.processingUnits;
    }

    if (endpoint === ENDPOINTS.sensors) {
      return MOCK_DATA.sensors;
    }

    if (endpoint === ENDPOINTS.systemInfo) {
      return MOCK_DATA.systemInfo;
    }

    if (endpoint === ENDPOINTS.mtbe) {
      return MOCK_DATA.mtbe;
    }

    if (endpoint === ENDPOINTS.archiveEvents) {
      let events = [...MOCK_DATA.archiveEvents];

      if (queryParams && Object.keys(queryParams).length > 0) {
        const type = (queryParams.type || "").toLowerCase();
        const sensorId = (queryParams.sensorId || "").toLowerCase();

        const dateFrom = queryParams.dateFrom ? new Date(queryParams.dateFrom) : null;
        const dateTo = queryParams.dateTo ? new Date(queryParams.dateTo + "T23:59:59") : null;

        const latitudeFrom = parseOptionalNumber(queryParams.latitudeFrom);
        const latitudeTo = parseOptionalNumber(queryParams.latitudeTo);
        const longitudeFrom = parseOptionalNumber(queryParams.longitudeFrom);
        const longitudeTo = parseOptionalNumber(queryParams.longitudeTo);

        events = events.filter((event) => {
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
            latitudeFrom === null || (Number.isFinite(eventLat) && eventLat >= latitudeFrom);

          const matchesLatitudeTo =
            latitudeTo === null || (Number.isFinite(eventLat) && eventLat <= latitudeTo);

          const matchesLongitudeFrom =
            longitudeFrom === null || (Number.isFinite(eventLon) && eventLon >= longitudeFrom);

          const matchesLongitudeTo =
            longitudeTo === null || (Number.isFinite(eventLon) && eventLon <= longitudeTo);

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

      return events;
    }

    return [];
  }

  const url = new URL(API_URL + endpoint);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, value);
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} on ${url.pathname}`);
  }

  return await response.json();
}

/* =========================
   DASHBOARD LOADERS
========================= */

async function loadLiveEvents() {
  const events = await fetchJSON(ENDPOINTS.latestEvents);
  renderLiveEvents(Array.isArray(events) ? events : []);
}

async function loadProcessingUnits() {
  const units = await fetchJSON(ENDPOINTS.processingUnits);
  renderProcessingUnits(Array.isArray(units) ? units : []);
}

async function loadSensors() {
  const sensors = await fetchJSON(ENDPOINTS.sensors);
  renderSensors(Array.isArray(sensors) ? sensors : []);
}

async function loadSystemInfo() {
  const info = await fetchJSON(ENDPOINTS.systemInfo);
  renderSystemInfo(info || {});
}

/* =========================
   ARCHIVE LOADERS
========================= */

async function loadArchiveEvents(filters = {}) {
  const events = await fetchJSON(ENDPOINTS.archiveEvents, filters);
  renderArchiveEvents(Array.isArray(events) ? events : []);
}

async function loadMTBE() {
  const mtbe = await fetchJSON(ENDPOINTS.mtbe);

  setText("mtbeEarthquake", mtbe.earthquake ?? "-");
  setText("mtbeConventional", mtbe.conventionalExplosion ?? "-");
  setText("mtbeNuclear", mtbe.nuclearExplosion ?? "-");
}

/* =========================
   LIVE STREAM
========================= */

function connectLiveStream() {
  if (USE_MOCK_DATA) {
    if (mockStreamInterval) {
      clearInterval(mockStreamInterval);
    }

    const fakeStreamEvents = [
      {
        id: "EVT-1101",
        type: "Earthquake",
        frequency: 1.9,
        sensorId: "SEN-001",
        amplitude: 8.9,
        location: "Rome Sector A",
        latitude: "41.9028",
        longitude: "12.4964"
      },
      {
        id: "EVT-1102",
        type: "Conventional Explosion",
        frequency: 4.8,
        sensorId: "SEN-007",
        amplitude: 13.6,
        location: "Bari Sector E",
        latitude: "41.1171",
        longitude: "16.8719"
      },
      {
        id: "EVT-1103",
        type: "Nuclear Explosion",
        frequency: 11.4,
        sensorId: "SEN-008",
        amplitude: 24.8,
        location: "Cagliari Sector G",
        latitude: "39.2238",
        longitude: "9.1217"
      }
    ];

    let index = 0;

    mockStreamInterval = setInterval(() => {
      const template = fakeStreamEvents[index % fakeStreamEvents.length];
      const newEvent = {
        ...template,
        id: `EVT-LIVE-${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      prependLiveEvent(newEvent);
      incrementSensorEventCount(newEvent.sensorId);
      index++;
    }, 5000);

    return;
  }

  if (liveStreamSource) {
    liveStreamSource.close();
  }

  liveStreamSource = new EventSource(API_URL + ENDPOINTS.liveStream);

  liveStreamSource.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      prependLiveEvent(parsed);
      incrementSensorEventCount(parsed.sensorId || parsed.sensor_id);
    } catch (error) {
      console.error("Invalid SSE event payload:", error);
    }
  };

  liveStreamSource.onerror = () => {
    console.warn("Live stream disconnected. Retrying automatically...");
  };
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
   DASHBOARD RENDER
========================= */

function renderLiveEvents(events) {
  const tbody = document.querySelector("#liveEventsTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  events.forEach((event) => {
    tbody.appendChild(buildLiveEventRow(normalizeEvent(event)));
  });
}

function prependLiveEvent(event) {
  const tbody = document.querySelector("#liveEventsTable tbody");
  if (!tbody) return;

  const normalized = normalizeEvent(event);
  const row = buildLiveEventRow(normalized);

  tbody.prepend(row);

  const maxRows = 50;
  while (tbody.children.length > maxRows) {
    tbody.removeChild(tbody.lastChild);
  }
}

function buildLiveEventRow(event) {
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
  return row;
}

function renderProcessingUnits(units) {
  const tbody = document.querySelector("#unitsTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  units.forEach((unit) => {
    const normalized = normalizeProcessingUnit(unit);
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(normalized.id)}</td>
      <td class="${normalized.stateClass}">${escapeHtml(normalized.stateLabel)}</td>
    `;

    tbody.appendChild(row);
  });
}

function renderSensors(sensors) {
  const tbody = document.querySelector("#sensorsTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  sensors.forEach((sensor) => {
    const normalized = normalizeSensor(sensor);
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(normalized.id)}</td>
      <td>${escapeHtml(String(normalized.eventsCount))}</td>
      <td>${escapeHtml(normalized.latitude)}</td>
      <td>${escapeHtml(normalized.longitude)}</td>
    `;

    tbody.appendChild(row);
  });
}

function renderSystemInfo(info) {
  const container = document.getElementById("systemInfo");
  if (!container) return;

  container.innerHTML = "";

  const entries = Object.entries(info);
  if (entries.length === 0) {
    container.innerHTML = `<div class="info-row">No system information available.</div>`;
    return;
  }

  entries.forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "info-row";
    row.innerHTML = `
      <span class="info-label">${escapeHtml(toReadableLabel(key))}: </span>
      <span class="info-value">${escapeHtml(String(value))}</span>
    `;
    container.appendChild(row);
  });
}

/* =========================
   ARCHIVE RENDER
========================= */

function renderArchiveEvents(events) {
  const tbody = document.querySelector("#archiveTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  events.forEach((event) => {
    const normalized = normalizeEvent(event);
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(normalized.id)}</td>
      <td>${escapeHtml(normalized.type)}</td>
      <td>${escapeHtml(formatFrequencyPlain(normalized.frequency))}</td>
      <td>${escapeHtml(normalized.sensorId)}</td>
      <td>${formatTimestampForTable(normalized.timestamp)}</td>
      <td>${escapeHtml(normalized.latitude)}</td>
      <td>${escapeHtml(normalized.longitude)}</td>
    `;

    tbody.appendChild(row);
  });
}

/* =========================
   FILTERS
========================= */

function setupArchiveFilters() {
  const applyBtn = document.getElementById("applyFiltersBtn");
  const clearBtn = document.getElementById("clearFiltersBtn");

  if (applyBtn) {
    applyBtn.addEventListener("click", async () => {
      try {
        const filters = {
          dateFrom: getInputValue("dateFromFilter"),
          dateTo: getInputValue("dateToFilter"),
          type: getInputValue("eventTypeFilter"),
          sensorId: getInputValue("sensorIdFilter"),
          latitudeFrom: getInputValue("latitudeFromFilter"),
          latitudeTo: getInputValue("latitudeToFilter"),
          longitudeFrom: getInputValue("longitudeFromFilter"),
          longitudeTo: getInputValue("longitudeToFilter")
        };

        await loadArchiveEvents(filters);
      } catch (error) {
        console.error("Error applying filters:", error);
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      setInputValue("dateFromFilter", "");
      setInputValue("dateToFilter", "");
      setInputValue("eventTypeFilter", "");
      setInputValue("sensorIdFilter", "");
      setInputValue("latitudeFromFilter", "");
      setInputValue("latitudeToFilter", "");
      setInputValue("longitudeFromFilter", "");
      setInputValue("longitudeToFilter", "");

      try {
        await loadArchiveEvents();
      } catch (error) {
        console.error("Error clearing filters:", error);
      }
    });
  }
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

      <div class="detail-label">Type</div>
      <div class="detail-value ${getTypeClass(event.type)}">${escapeHtml(event.type)}</div>

      <div class="detail-label">Frequency</div>
      <div class="detail-value">${escapeHtml(formatFrequencyPlain(event.frequency))} Hz</div>

      <div class="detail-label">Sensor ID</div>
      <div class="detail-value">${escapeHtml(event.sensorId)}</div>

      <div class="detail-label">Timestamp</div>
      <div class="detail-value">${escapeHtml(event.timestamp)}</div>

      <div class="detail-label">Amplitude</div>
      <div class="detail-value">${escapeHtml(String(event.amplitude))}</div>

      <div class="detail-label">Location</div>
      <div class="detail-value">${escapeHtml(event.location)}</div>

      <div class="detail-label">Latitude</div>
      <div class="detail-value">${escapeHtml(event.latitude)}</div>

      <div class="detail-label">Longitude</div>
      <div class="detail-value">${escapeHtml(event.longitude)}</div>
    </div>
  `;

  modal.classList.remove("hidden");
}

/* =========================
   NORMALIZATION
========================= */

function normalizeEvent(event) {
  return {
    id: event.id ?? event.eventId ?? "-",
    type: normalizeEventType(event.type ?? event.classification ?? "-"),
    frequency: Number(event.frequency ?? event.dominantFrequency ?? event.dominant_frequency_hz ?? 0),
    sensorId: event.sensorId ?? event.sensor_id ?? "-",
    timestamp: event.timestamp ?? event.time ?? "-",
    amplitude: event.amplitude ?? event.value ?? "-",
    location: event.location ?? event.monitoredArea ?? event.area ?? "-",
    latitude: event.latitude ?? "-",
    longitude: event.longitude ?? "-"
  };
}

function normalizeProcessingUnit(unit) {
  const rawState = String(unit.state ?? unit.status ?? "unknown").toLowerCase();
  const isActive = rawState === "active" || rawState === "healthy" || rawState === "up";

  return {
    id: unit.id ?? unit.unitId ?? unit.name ?? "-",
    stateLabel: isActive ? "Active" : "Non active",
    stateClass: isActive ? "state-active" : "state-failed"
  };
}

function normalizeSensor(sensor) {
  return {
    id: sensor.id ?? sensor.sensorId ?? sensor.sensor_id ?? "-",
    eventsCount: sensor.eventsCount ?? sensor.events_count ?? sensor.detectedEvents ?? sensor.detected_events ?? 0,
    latitude: sensor.latitude ?? "-",
    longitude: sensor.longitude ?? "-"
  };
}

/* =========================
   HELPERS
========================= */

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeEventType(type) {
  const value = String(type).toLowerCase();

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

function incrementSensorEventCount(sensorId) {
  if (!sensorId) return;

  const rows = document.querySelectorAll("#sensorsTable tbody tr");
  rows.forEach((row) => {
    const sensorCell = row.children[0];
    const countCell = row.children[1];

    if (sensorCell && countCell && sensorCell.textContent === sensorId) {
      const current = parseInt(countCell.textContent, 10);
      if (!Number.isNaN(current)) {
        countCell.textContent = String(current + 1);
      }
    }
  });
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

function toReadableLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}