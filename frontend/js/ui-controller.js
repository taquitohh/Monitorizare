/* =====================================
   UI CONTROLLER
===================================== */

function initializeSidebarSwitch() {
    const vehiclesTab = document.getElementById("vehicles-tab");
    const incidentsTab = document.getElementById("routes-tab");

    if (vehiclesTab) {
        vehiclesTab.addEventListener("click", function () {
            showVehiclesSidebar();
        });
    }

    if (incidentsTab) {
        incidentsTab.addEventListener("click", async function () {
            await showIncidentsSidebar();
        });
    }
}

function showVehiclesSidebar() {
    sidebarMode = "vehicles";
    activeRouteId = null;
    activeIncidentId = null;
    activeIncidentCode = null;
    activeIncidentLocation = null;
    selectedVehicleId = null;

    const vehiclesTab = document.getElementById("vehicles-tab");
    const incidentsTab = document.getElementById("routes-tab");
    const vehiclesContainer = document.getElementById("vehicles-container");
    const incidentsContainer = document.getElementById("routes-container");
    const vehicleFilters = document.getElementById("vehicle-filters");
    const sidebarTitle = document.getElementById("sidebar-title");

    if (vehiclesTab) vehiclesTab.classList.add("active");
    if (incidentsTab) incidentsTab.classList.remove("active");
    if (vehiclesContainer) vehiclesContainer.hidden = false;
    if (incidentsContainer) incidentsContainer.hidden = true;
    if (vehicleFilters) vehicleFilters.hidden = false;
    if (sidebarTitle) sidebarTitle.textContent = "Vehicule";

    if (typeof clearIncidentRoute === "function") clearIncidentRoute();
    if (typeof removeIncidentMarker === "function") removeIncidentMarker();

    resetVehicleDetails();
    refreshVehicleView();
}

async function showIncidentsSidebar() {
    sidebarMode = "routes";
    activeRouteId = null;
    activeIncidentId = null;
    activeIncidentCode = null;
    activeIncidentLocation = null;
    selectedVehicleId = null;

    const vehiclesTab = document.getElementById("vehicles-tab");
    const incidentsTab = document.getElementById("routes-tab");
    const vehiclesContainer = document.getElementById("vehicles-container");
    const incidentsContainer = document.getElementById("routes-container");
    const vehicleFilters = document.getElementById("vehicle-filters");
    const sidebarTitle = document.getElementById("sidebar-title");

    if (vehiclesTab) vehiclesTab.classList.remove("active");
    if (incidentsTab) incidentsTab.classList.add("active");
    if (vehiclesContainer) vehiclesContainer.hidden = true;
    if (incidentsContainer) incidentsContainer.hidden = false;
    if (vehicleFilters) vehicleFilters.hidden = true;
    if (sidebarTitle) sidebarTitle.textContent = "Incidente";

    resetVehicleDetails();

    if (typeof clearIncidentRoute === "function") clearIncidentRoute();
    if (typeof removeIncidentMarker === "function") removeIncidentMarker();
    if (typeof updateVisibleMarkers === "function") updateVisibleMarkers([]);

    await loadIncidents();
}

async function showRoutesSidebar() {
    await showIncidentsSidebar();
}

function initializeRefreshButton() {
    const refreshButton = document.getElementById("refresh-button");
    if (!refreshButton) return;

    refreshButton.addEventListener("click", refreshApplication);
}

async function refreshApplication() {
    const refreshButton = document.getElementById("refresh-button");
    if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = "Se reîmprospătează...";
    }

    try {
        resetVehicleFilters();
        resetIncidentFilters();

        recommendationModeActive = false;
        recommendedVehicle = null;
        recommendedVehicleDistance = null;
        selectedVehicleId = null;
        activeRouteId = null;
        activeIncidentId = null;
        activeIncidentCode = null;
        activeIncidentLocation = null;

        hideRecommendationPanel();
        resetVehicleDetails();

        if (typeof clearIncidentRoute === "function") clearIncidentRoute();
        if (typeof removeIncidentMarker === "function") removeIncidentMarker();

        await loadVehicles();
        await loadIncidents();

        if (sidebarMode === "routes") {
            await showIncidentsSidebar();
        }
        else {
            showVehiclesSidebar();
        }
    }
    catch (error) {
        console.error("Application refresh failed:", error);
    }
    finally {
        if (refreshButton) {
            refreshButton.disabled = false;
            refreshButton.textContent = "Reîmprospătează";
        }
    }
}

function startAutomaticRefresh() {
    window.setInterval(async function () {
        await loadVehicles();
    }, REFRESH_INTERVAL);

    window.setInterval(async function () {
        await loadIncidents();
    }, ACTIVE_ROUTES_INTERVAL);

    window.setInterval(async function () {
        await refreshOpenedActiveRoute();
    }, ROUTE_REFRESH_INTERVAL);
}

function initializeFilters() {
    initializeVehicleFilters();
}

function resetFilters() {
    resetVehicleFilters();
}

function refreshView() {
    refreshVehicleView();
}

async function loadActiveRoutes() {
    await loadIncidents();
}

function displayActiveRoutes() {
    displayIncidents();
}

function applyAndDisplayIncidentFilters() {
    refreshIncidentView();
}
