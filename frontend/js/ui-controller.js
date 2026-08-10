/* =====================================
   UI CONTROLLER
===================================== */


/* =====================================
   INIȚIALIZARE TABURI LATERALE
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

    const requestsTab =
        document.getElementById(
            "requests-tab"
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

    if (requestsTab) {

        requestsTab.addEventListener(
            "click",
            async function () {

                await showRequestsSidebar();

            }
        );

    }

}


/* =====================================
   AFIȘARE VEHICULE
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

    selectedReinforcementRequestId =
        null;

    const vehiclesTab =
        document.getElementById(
            "vehicles-tab"
        );

    const incidentsTab =
        document.getElementById(
            "routes-tab"
        );

    const requestsTab =
        document.getElementById(
            "requests-tab"
        );

    const vehiclesContainer =
        document.getElementById(
            "vehicles-container"
        );

    const incidentsContainer =
        document.getElementById(
            "routes-container"
        );

    const requestsContainer =
        document.getElementById(
            "requests-container"
        );

    const vehicleFilters =
        document.getElementById(
            "vehicle-filters"
        );

    const sidebarTitle =
        document.getElementById(
            "sidebar-title"
        );
        
    
    const vehicleDetailsPanel =
    document.getElementById(
        "vehicle-details-panel"
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

    if (requestsTab) {

        requestsTab.classList.remove(
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

    if (requestsContainer) {

        requestsContainer.hidden =
            true;

    }

    if (vehicleFilters) {

        vehicleFilters.hidden =
            false;

    }

    if (sidebarTitle) {

        sidebarTitle.textContent =
            "Vehicule";

    }

    if (vehicleDetailsPanel) {

    vehicleDetailsPanel.hidden =
        false;

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
   AFIȘARE INCIDENTE
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

    selectedReinforcementRequestId =
        null;

    const vehiclesTab =
        document.getElementById(
            "vehicles-tab"
        );

    const incidentsTab =
        document.getElementById(
            "routes-tab"
        );

    const requestsTab =
        document.getElementById(
            "requests-tab"
        );

    const vehiclesContainer =
        document.getElementById(
            "vehicles-container"
        );

    const incidentsContainer =
        document.getElementById(
            "routes-container"
        );

    const requestsContainer =
        document.getElementById(
            "requests-container"
        );

    const vehicleFilters =
        document.getElementById(
            "vehicle-filters"
        );

    const sidebarTitle =
        document.getElementById(
            "sidebar-title"
        );

    const vehicleDetailsPanel =
    document.getElementById(
        "vehicle-details-panel"
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

    if (requestsTab) {

        requestsTab.classList.remove(
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

    if (requestsContainer) {

        requestsContainer.hidden =
            true;

    }

    if (vehicleFilters) {

        vehicleFilters.hidden =
            true;

    }

   if (sidebarTitle) {

    sidebarTitle.textContent =
        "Incidente";

}

resetVehicleDetails();

if (vehicleDetailsPanel) {

    vehicleDetailsPanel.hidden =
        true;

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

    if (
        typeof updateVisibleMarkers ===
        "function"
    ) {

        updateVisibleMarkers([]);

    }

    await loadIncidents();

}


/* =====================================
   AFIȘARE CERERI DE ÎNTĂRIRI
===================================== */

async function showRequestsSidebar() {

    sidebarMode =
        "requests";

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

    selectedReinforcementRequestId =
        null;

    const vehiclesTab =
        document.getElementById(
            "vehicles-tab"
        );

    const incidentsTab =
        document.getElementById(
            "routes-tab"
        );

    const requestsTab =
        document.getElementById(
            "requests-tab"
        );

    const vehiclesContainer =
        document.getElementById(
            "vehicles-container"
        );

    const incidentsContainer =
        document.getElementById(
            "routes-container"
        );

    const requestsContainer =
        document.getElementById(
            "requests-container"
        );

    const vehicleFilters =
        document.getElementById(
            "vehicle-filters"
        );

    const sidebarTitle =
        document.getElementById(
            "sidebar-title"
        );

    const vehicleDetailsPanel =
    document.getElementById(
        "vehicle-details-panel"
    );

    if (vehiclesTab) {

        vehiclesTab.classList.remove(
            "active"
        );

    }

    if (incidentsTab) {

        incidentsTab.classList.remove(
            "active"
        );

    }

    if (requestsTab) {

        requestsTab.classList.add(
            "active"
        );

    }

    if (vehiclesContainer) {

        vehiclesContainer.hidden =
            true;

    }

    if (incidentsContainer) {

        incidentsContainer.hidden =
            true;

    }

    if (requestsContainer) {

        requestsContainer.hidden =
            false;

    }

    if (vehicleFilters) {

        vehicleFilters.hidden =
            true;

    }

   if (sidebarTitle) {

    sidebarTitle.textContent =
        "Cereri";

}

resetVehicleDetails();

if (vehicleDetailsPanel) {

    vehicleDetailsPanel.hidden =
        true;

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

    if (
        typeof loadReinforcementRequests ===
        "function"
    ) {

        await loadReinforcementRequests();

    }

}


/* =====================================
   COMPATIBILITATE RUTE
===================================== */

async function showRoutesSidebar() {

    await showIncidentsSidebar();

}


/* =====================================
   BUTON REÎMPROSPĂTARE
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
   REÎMPROSPĂTARE COMPLETĂ
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
            "Se reîmprospătează...";

    }

    try {

        resetVehicleFilters();

        resetIncidentFilters();

        if (
            typeof resetReinforcementRequestFilters ===
            "function"
        ) {

            resetReinforcementRequestFilters();

        }

        recommendationModeActive =
            false;

        recommendedVehicle =
            null;

        if (
            typeof recommendedVehicles !==
            "undefined"
        ) {

            recommendedVehicles =
                [];

        }

        recommendedVehicleDistance =
            null;

        selectedVehicleId =
            null;

        selectedReinforcementRequestId =
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
            typeof loadReinforcementRequests ===
            "function"
        ) {

            await loadReinforcementRequests();

        }

        if (
            sidebarMode ===
            "routes"
        ) {

            await showIncidentsSidebar();

        }

        else if (
            sidebarMode ===
            "requests"
        ) {

            await showRequestsSidebar();

        }

        else {

            showVehiclesSidebar();

        }

    }

    catch (error) {

        console.error(
            "Reîmprospătarea aplicației a eșuat:",
            error
        );

    }

    finally {

        if (refreshButton) {

            refreshButton.disabled =
                false;

            refreshButton.textContent =
                "Reîmprospătează";

        }

    }

}


/* =====================================
   REFRESH AUTOMAT
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

    window.setInterval(
        async function () {

            if (
                sidebarMode !==
                "requests"
            ) {

                return;

            }

            if (
                typeof loadReinforcementRequests !==
                "function"
            ) {

                return;

            }

            await loadReinforcementRequests();

        },
        3000
    );

}


/* =====================================
   FILTRE
===================================== */

function initializeFilters() {

    initializeVehicleFilters();

}


function resetFilters() {

    resetVehicleFilters();

}


/* =====================================
   COMPATIBILITATE VEHICULE
===================================== */

function refreshView() {

    refreshVehicleView();

}


/* =====================================
   COMPATIBILITATE INCIDENTE
===================================== */

async function loadActiveRoutes() {

    await loadIncidents();

}


function displayActiveRoutes() {

    displayIncidents();

}


function applyAndDisplayIncidentFilters() {

    refreshIncidentView();

}


/* =====================================
   INIȚIALIZARE CONTROLLER
===================================== */

function initializeUiController() {

    initializeSidebarSwitch();

    initializeRefreshButton();

}