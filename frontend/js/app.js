/* =====================================
   APPLICATION INITIALIZATION
===================================== */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            initializeMap();

            initializeIncidentMapSelection();

            initializeVehicleFilters();

            initializeIncidentFilters();

            initializeIncidentForm();

            initializeRecommendationPanel();

            initializeSidebarSwitch();

            initializeRefreshButton();

            await loadVehicles();

            await loadIncidents();

            startAutomaticRefresh();

        }

        catch (error) {

            console.error(
                "Application initialization failed:",
                error
            );

        }

    }
);


/* =====================================
   SIDEBAR SWITCH INITIALIZATION
===================================== */

function initializeSidebarSwitch() {

    const vehiclesTab =
        document.getElementById(
            "vehicles-tab"
        );

    const incidentsTab =
        document.getElementById(
            "routes-tab"
        );

    if (vehiclesTab) {

        vehiclesTab.addEventListener(
            "click",
            function () {

                showVehiclesSidebar();

            }
        );

    }

    if (incidentsTab) {

        incidentsTab.addEventListener(
            "click",
            async function () {

                await showIncidentsSidebar();

            }
        );

    }

}


/* =====================================
   SHOW VEHICLES SIDEBAR
===================================== */

function showVehiclesSidebar() {

    sidebarMode =
        "vehicles";

    activeRouteId =
        null;

    activeIncidentId =
        null;

    activeIncidentCode =
        null;

    activeIncidentLocation =
        null;

    selectedVehicleId =
        null;

    const vehiclesTab =
        document.getElementById(
            "vehicles-tab"
        );

    const incidentsTab =
        document.getElementById(
            "routes-tab"
        );

    const vehiclesContainer =
        document.getElementById(
            "vehicles-container"
        );

    const incidentsContainer =
        document.getElementById(
            "routes-container"
        );

    const vehicleFilters =
        document.getElementById(
            "vehicle-filters"
        );

    const sidebarTitle =
        document.getElementById(
            "sidebar-title"
        );

    if (vehiclesTab) {

        vehiclesTab.classList.add(
            "active"
        );

    }

    if (incidentsTab) {

        incidentsTab.classList.remove(
            "active"
        );

    }

    if (vehiclesContainer) {

        vehiclesContainer.hidden =
            false;

    }

    if (incidentsContainer) {

        incidentsContainer.hidden =
            true;

    }

    if (vehicleFilters) {

        vehicleFilters.hidden =
            false;

    }

    if (sidebarTitle) {

        sidebarTitle.textContent =
            "Vehicles";

    }

    if (
        typeof clearIncidentRoute ===
        "function"
    ) {

        clearIncidentRoute();

    }

    if (
        typeof removeIncidentMarker ===
        "function"
    ) {

        removeIncidentMarker();

    }

    resetVehicleDetails();

    refreshVehicleView();

}


/* =====================================
   SHOW INCIDENTS SIDEBAR
===================================== */

async function showIncidentsSidebar() {

    sidebarMode =
        "routes";

    activeRouteId =
        null;

    activeIncidentId =
        null;

    activeIncidentCode =
        null;

    activeIncidentLocation =
        null;

    selectedVehicleId =
        null;

    const vehiclesTab =
        document.getElementById(
            "vehicles-tab"
        );

    const incidentsTab =
        document.getElementById(
            "routes-tab"
        );

    const vehiclesContainer =
        document.getElementById(
            "vehicles-container"
        );

    const incidentsContainer =
        document.getElementById(
            "routes-container"
        );

    const vehicleFilters =
        document.getElementById(
            "vehicle-filters"
        );

    const sidebarTitle =
        document.getElementById(
            "sidebar-title"
        );

    if (vehiclesTab) {

        vehiclesTab.classList.remove(
            "active"
        );

    }

    if (incidentsTab) {

        incidentsTab.classList.add(
            "active"
        );

    }

    if (vehiclesContainer) {

        vehiclesContainer.hidden =
            true;

    }

    if (incidentsContainer) {

        incidentsContainer.hidden =
            false;

    }

    if (vehicleFilters) {

        vehicleFilters.hidden =
            true;

    }

    if (sidebarTitle) {

        sidebarTitle.textContent =
            "Incidents";

    }

    resetVehicleDetails();

    if (
        typeof clearIncidentRoute ===
        "function"
    ) {

        clearIncidentRoute();

    }

    if (
        typeof removeIncidentMarker ===
        "function"
    ) {

        removeIncidentMarker();

    }

    if (
        typeof updateVisibleMarkers ===
        "function"
    ) {

        updateVisibleMarkers([]);

    }

    await loadIncidents();

}


/* =====================================
   LEGACY SIDEBAR FUNCTION
===================================== */

/*
 * Unele funcții mai vechi pot apela încă
 * showRoutesSidebar(). Păstrăm aliasul
 * pentru compatibilitate.
 */

async function showRoutesSidebar() {

    await showIncidentsSidebar();

}


/* =====================================
   REFRESH BUTTON
===================================== */

function initializeRefreshButton() {

    const refreshButton =
        document.getElementById(
            "refresh-button"
        );

    if (!refreshButton) {

        return;

    }

    refreshButton.addEventListener(
        "click",
        refreshApplication
    );

}


/* =====================================
   MANUAL APPLICATION REFRESH
===================================== */

async function refreshApplication() {

    const refreshButton =
        document.getElementById(
            "refresh-button"
        );

    if (refreshButton) {

        refreshButton.disabled =
            true;

        refreshButton.textContent =
            "Refreshing...";

    }

    try {

        resetVehicleFilters();

        resetIncidentFilters();

        recommendationModeActive =
            false;

        recommendedVehicle =
            null;

        recommendedVehicleDistance =
            null;

        selectedVehicleId =
            null;

        activeRouteId =
            null;

        activeIncidentId =
            null;

        activeIncidentCode =
            null;

        activeIncidentLocation =
            null;

        hideRecommendationPanel();

        resetVehicleDetails();

        if (
            typeof clearIncidentRoute ===
            "function"
        ) {

            clearIncidentRoute();

        }

        if (
            typeof removeIncidentMarker ===
            "function"
        ) {

            removeIncidentMarker();

        }

        await loadVehicles();

        await loadIncidents();

        if (
            sidebarMode === "routes"
        ) {

            await showIncidentsSidebar();

        }

        else {

            showVehiclesSidebar();

        }

    }

    catch (error) {

        console.error(
            "Application refresh failed:",
            error
        );

    }

    finally {

        if (refreshButton) {

            refreshButton.disabled =
                false;

            refreshButton.textContent =
                "Refresh";

        }

    }

}


/* =====================================
   AUTOMATIC REFRESH
===================================== */

function startAutomaticRefresh() {

    window.setInterval(
        async function () {

            await loadVehicles();

        },
        REFRESH_INTERVAL
    );

    window.setInterval(
        async function () {

            await loadIncidents();

        },
        ACTIVE_ROUTES_INTERVAL
    );

    window.setInterval(
        async function () {

            await refreshOpenedActiveRoute();

        },
        ROUTE_REFRESH_INTERVAL
    );

}


/* =====================================
   COMPATIBILITY FUNCTIONS
===================================== */

/*
 * Aceste aliasuri păstrează compatibilitatea
 * cu numele folosite în vechiul app.js.
 */

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