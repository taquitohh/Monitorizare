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
   DISPATCHER WORKSPACE
===================================== */

function refreshDispatcherWorkspace() {

    const vehicleDetailsPanel =
        document.getElementById(
            "vehicle-details-panel"
        );

    const incidentPanel =
        document.getElementById(
            "incident-panel"
        );

    const recommendationPanel =
        document.getElementById(
            "recommendation-panel"
        );

    const specialistPanel =
        document.getElementById(
            "specialist-questionnaires-panel"
        );


    const locationMode =
        dispatcherWorkspaceMode ===
        "incident_location";

    const assignmentMode =
        dispatcherWorkspaceMode ===
        "assignment";

    const questionnairesMode =
        dispatcherWorkspaceMode ===
        "questionnaires";


    /*
     * =================================
     * MOD SELECTARE LOCAȚIE
     * =================================
     */

    if (locationMode) {

        if (incidentPanel) {
            incidentPanel.hidden = true;
        }

        if (vehicleDetailsPanel) {
            vehicleDetailsPanel.hidden = true;
        }

        if (recommendationPanel) {
            recommendationPanel.hidden = true;
        }

        if (specialistPanel) {
            specialistPanel.hidden = true;
        }

        return;
    }


    /*
     * =================================
     * MOD AȘTEPTARE ASIGNARE
     * =================================
     */

    if (assignmentMode) {

        if (incidentPanel) {
            incidentPanel.hidden = true;
        }

        if (vehicleDetailsPanel) {
            vehicleDetailsPanel.hidden =
                sidebarMode ===
                "requests";
        }

        if (specialistPanel) {
            specialistPanel.hidden = true;
        }

        /*
         * recommendationPanel este controlat
         * de recommendation.js.
         */

        return;
    }


    /*
     * =================================
     * MOD CHESTIONARE SPECIALIZATE
     * =================================
     */

    if (questionnairesMode) {

        if (incidentPanel) {
            incidentPanel.hidden = true;
        }

        if (vehicleDetailsPanel) {
            vehicleDetailsPanel.hidden = true;
        }

        if (recommendationPanel) {
            recommendationPanel.hidden = true;
        }

        if (specialistPanel) {
            specialistPanel.hidden = false;
        }

        return;
    }


    /*
     * =================================
     * MOD NORMAL
     * =================================
     */

    if (incidentPanel) {
        incidentPanel.hidden = false;
    }

    if (specialistPanel) {
        specialistPanel.hidden = true;
    }

    if (vehicleDetailsPanel) {

        vehicleDetailsPanel.hidden =
            sidebarMode ===
            "requests";

    }

}


/* =====================================
   RESETARE CONTEXT LA SCHIMBAREA TABULUI
===================================== */

function resetSidebarOperationalContext() {

    if (
        dispatcherWorkspaceMode ===
            "incident_location"
        ||
        dispatcherWorkspaceMode ===
            "assignment"
        ||
        dispatcherWorkspaceMode ===
            "questionnaires"
    ) {

        return;

    }


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

}


/* =====================================
   AFIȘARE VEHICULE
===================================== */

function showVehiclesSidebar() {

    sidebarMode =
        "vehicles";


    resetSidebarOperationalContext();


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


    refreshDispatcherWorkspace();


    if (
        dispatcherWorkspaceMode !==
            "incident_location"
        &&
        dispatcherWorkspaceMode !==
            "assignment"
        &&
        dispatcherWorkspaceMode !==
            "questionnaires"
    ) {

        refreshVehicleView();

    }

}


/* =====================================
   AFIȘARE INCIDENTE
===================================== */

async function showIncidentsSidebar() {

    sidebarMode =
        "routes";


    resetSidebarOperationalContext();


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


    refreshDispatcherWorkspace();


    if (
        dispatcherWorkspaceMode !==
            "incident_location"
        &&
        dispatcherWorkspaceMode !==
            "assignment"
        &&
        dispatcherWorkspaceMode !==
            "questionnaires"
        &&
        typeof updateVisibleMarkers ===
            "function"
    ) {

        updateVisibleMarkers(
            []
        );

    }


    await loadIncidents();

}


/* =====================================
   AFIȘARE CERERI DE ÎNTĂRIRI
===================================== */

async function showRequestsSidebar() {

    sidebarMode =
        "requests";


    resetSidebarOperationalContext();


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


    refreshDispatcherWorkspace();


    if (
        dispatcherWorkspaceMode !==
            "incident_location"
        &&
        dispatcherWorkspaceMode !==
            "assignment"
        &&
        dispatcherWorkspaceMode !==
            "questionnaires"
        &&
        typeof updateVisibleMarkers ===
            "function"
    ) {

        updateVisibleMarkers(
            []
        );

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

    if (
        dispatcherWorkspaceMode ===
            "incident_location"
        ||
        dispatcherWorkspaceMode ===
            "assignment"
        ||
        dispatcherWorkspaceMode ===
            "questionnaires"
    ) {

        return;

    }


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


        dispatcherWorkspaceMode =
            "normal";


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


        refreshDispatcherWorkspace();

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

            if (
                dispatcherWorkspaceMode ===
                    "incident_location"
                ||
                dispatcherWorkspaceMode ===
                    "assignment"
                ||
                dispatcherWorkspaceMode ===
                    "questionnaires"
            ) {

                return;

            }


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


/* =====================================
   RESETARE FILTRE
===================================== */

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

    refreshDispatcherWorkspace();

}