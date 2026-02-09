import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase setup
const supabase = createClient(
  "https://fzdqeiwbhtdliqcxxlxr.supabase.co/",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZHFlaXdiaHRkbGlxY3h4bHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTM1MjAsImV4cCI6MjA4NjE4OTUyMH0.LTQxMdooIn2trUbbyBE9jxN940utk8Yr_SptsZWBBt8"
);
window.supabase = supabase;

// Debug overlay helper
const logDebug = (msg) => {
  const el = document.getElementById("debug-overlay");
  if (el) {
    el.textContent += `\n[${new Date().toLocaleTimeString()}] ${msg}`;
    el.scrollTop = el.scrollHeight;
  } else {
    console.log(msg);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  logDebug("DOM carregado. A iniciar...");

  const startButton = document.getElementById("start-button");
  const toggleViewButton = document.getElementById("toggle-view");
  const centerMapButton = document.getElementById("center-map");
  const mapView = document.getElementById("map-view");
  const viewPOIsButton = document.getElementById("view-pois");
  const scene = document.querySelector("a-scene");

  if (scene) {
    scene.style.display = "none";
  }

  if (startButton) {
    startButton.addEventListener("click", () => {
      logDebug("Botão Start clicado!");
      startButton.style.display = "none";
      toggleViewButton.style.display = "block";
      centerMapButton.style.display = "block";
      viewPOIsButton.style.display = "block";
      scene.style.display = "block";
      fetchPOIs();
    });
  }

  if (toggleViewButton) {
    toggleViewButton.addEventListener("click", () => {
      const isMapVisible = mapView.style.display === "block";
      mapView.style.display = isMapVisible ? "none" : "block";
      scene.style.display = isMapVisible ? "block" : "none";
      toggleViewButton.textContent = isMapVisible ? "Mapa" : "AR";
      logDebug(isMapVisible ? "Vista AR ativada." : "Mapa mostrado.");

      if (!window._leafletMap && !isMapVisible) {
        window._leafletMap = L.map("leaflet-map").setView([65.0121, 25.4682], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors"
        }).addTo(window._leafletMap);
        logDebug("Mapa inicializado.");
        fetchPOIs();
      } else if (window._leafletMap) {
        window._leafletMap.invalidateSize();
      }
    });
  }

  if (centerMapButton) {
    centerMapButton.addEventListener("click", () => {
      if (!window._leafletMap) {
        logDebug("Mapa ainda não foi inicializado.");
        return;
      }
      if (!navigator.geolocation) {
        logDebug("Geolocalização não suportada pelo navegador.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          window._leafletMap.setView([latitude, longitude], 15);
          logDebug(`Mapa centrado em (${latitude.toFixed(5)}, ${longitude.toFixed(5)}).`);
          if (window._userLocationMarker) {
            window._leafletMap.removeLayer(window._userLocationMarker);
          }
          window._userLocationMarker = L.circle([latitude, longitude], {
            radius: 10,
            color: "#007aff",
            fillColor: "#007aff",
            fillOpacity: 0.8
          }).addTo(window._leafletMap);
        },
        (err) => {
          logDebug(`Erro ao obter localização: ${err.message}`);
        },
        { enableHighAccuracy: true }
      );
    });
  }

  if (viewPOIsButton) {
    viewPOIsButton.addEventListener("click", () => {
      if (!window._leafletMap || !window._poisData || window._poisData.length === 0) {
        logDebug("POIs não disponíveis ou mapa não inicializado.");
        return;
      }
      const bounds = L.latLngBounds(window._poisData.map(poi => [poi.latitude, poi.longitude]));
      window._leafletMap.fitBounds(bounds, { padding: [50, 50] });
      logDebug("Mapa ajustado para mostrar todos os POIs.");
    });
  }

  async function fetchPOIs() {
    const { data, error } = await supabase.from("pois").select("*");
    logDebug("A buscar POIs da base de dados...");
    if (error) {
      logDebug(`Erro ao buscar POIs: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      logDebug("Nenhum POI encontrado na base de dados.");
      return;
    }
    logDebug(`POIs carregados: ${data.length}`);
    window._poisData = data;

    data.forEach((poi) => {
      if (!poi.latitude || !poi.longitude) {
        logDebug(`POI inválido: ${JSON.stringify(poi)}`);
        return;
      }

      // AR
      const entity = document.createElement("a-entity");
      entity.setAttribute("gps-entity-place", `latitude: ${poi.latitude}; longitude: ${poi.longitude}`);
      entity.setAttribute("geometry", "primitive: box; height: 1; width: 1; depth: 1");
      entity.setAttribute("material", "color: red");
      entity.setAttribute("look-at", "[gps-camera]");
      entity.classList.add("clickable");
      scene.appendChild(entity);

      // Mapa
      if (window._leafletMap) {
        const circle = L.circleMarker([poi.latitude, poi.longitude], {
          radius: 6,
          color: "red",
          fillColor: "red",
          fillOpacity: 0.9
        }).addTo(window._leafletMap);

        const popupContent = `
          <strong>${poi.name || "POI"}</strong><br>
          ${poi.description || ""}
        `;
        circle.bindPopup(popupContent);
        logDebug(`Marcador adicionado: ${poi.name || "POI"} (${poi.latitude}, ${poi.longitude})`);
      }
    });

    if (window._leafletMap && data.length > 0) {
      const bounds = L.latLngBounds(data.map(poi => [poi.latitude, poi.longitude]));
      window._leafletMap.fitBounds(bounds, { padding: [50, 50] });
    }
  }
});
