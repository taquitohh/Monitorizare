/* =====================================
   LOAD INCIDENTS
===================================== */

async function loadIncidents() {

    if (activeRoutesLoading) {

        return;

    }

    activeRoutesLoading =
        true;

    try {

        const incidents =
            await window.getIncidents();

        if (!Array.isArray(incidents)) {

            throw new Error(
                "The incidents API did not return an array."
            );

        }

        allIncidents =
            incidents;

        activeRoutes =
            allIncidents.filter(
                function (incident) {

                    return isIncidentActive(
                        incident
                    );

                }
            );

        filteredIncidents =
            applyIncidentFilters();

        displayIncidents();

        if (
            sidebarMode === "routes"
        ) {

            updateSidebarCount(
                filteredIncidents.length
            );

        }

        if (
            activeRouteId !== null
        ) {

            const routeStillActive =
                activeRoutes.some(
                    function (incident) {

                        return (
                            Number(incident.id) ===
                            Number(activeRouteId)
                        );

                    }
                );

            if (!routeStillActive) {

                closeActiveRouteView();

            }

        }

    }

    catch (error) {

        console.error(
            "Could not load incidents:",
            error
        );

    }

    finally {

        activeRoutesLoading =
            false;

    }

}


/* =====================================
   INITIALIZE INCIDENT FILTERS
===================================== */

function initializeIncidentFilters() {

    const statusFilter =
        document.getElementById(
            "incident-status-filter"
        );

    const typeFilter =
        document.getElementById(
            "incident-type-filter"
        );

    const priorityFilter =
        document.getElementById(
            "incident-priority-filter"
        );

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            function () {

                incidentFilters.status =
                    this.value;

                refreshIncidentView();

            }
        );

    }

    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            function () {

                incidentFilters.type =
                    this.value;

                refreshIncidentView();

            }
        );

    }

    if (priorityFilter) {

        priorityFilter.addEventListener(
            "change",
            function () {

                incidentFilters.priority =
                    this.value;

                refreshIncidentView();

            }
        );

    }

}


/* =====================================
   RESET INCIDENT FILTERS
===================================== */

function resetIncidentFilters() {

    incidentFilters.status =
        "all";

    incidentFilters.type =
        "all";

    incidentFilters.priority =
        "all";

    const statusFilter =
        document.getElementById(
            "incident-status-filter"
        );

    const typeFilter =
        document.getElementById(
            "incident-type-filter"
        );

    const priorityFilter =
        document.getElementById(
            "incident-priority-filter"
        );

    if (statusFilter) {

        statusFilter.value =
            "all";

    }

    if (typeFilter) {

        typeFilter.value =
            "all";

    }

    if (priorityFilter) {

        priorityFilter.value =
            "all";

    }

}


/* =====================================
   APPLY INCIDENT FILTERS
===================================== */

function applyIncidentFilters() {

    return allIncidents.filter(
        function (incident) {

            const category =
                getIncidentCategory(
                    incident
                );

            const vehicleType =
                String(
                    incident.required_vehicle_type
                    ||
                    ""
                ).toLowerCase();

            const priority =
                String(
                    incident.priority
                    ||
                    ""
                ).toLowerCase();

            let statusMatches =
                true;

            if (
                incidentFilters.status ===
                "active"
            ) {

                statusMatches =
                    category === "active";

            }

            else if (
                incidentFilters.status ===
                "archived"
            ) {

                statusMatches =
                    category === "archived";

            }

            const typeMatches =
                incidentFilters.type ===
                    "all"
                ||
                vehicleType ===
                    incidentFilters.type;

            const priorityMatches =
                incidentFilters.priority ===
                    "all"
                ||
                priority ===
                    incidentFilters.priority;

            return (
                statusMatches &&
                typeMatches &&
                priorityMatches
            );

        }
    );

}


/* =====================================
   REFRESH INCIDENT VIEW
===================================== */

function refreshIncidentView() {

    filteredIncidents =
        applyIncidentFilters();

    displayIncidents();

    if (
        sidebarMode === "routes"
    ) {

        updateSidebarCount(
            filteredIncidents.length
        );

    }

    if (
        activeRouteId !== null
    ) {

        const selectedStillVisible =
            filteredIncidents.some(
                function (incident) {

                    return (
                        Number(incident.id) ===
                        Number(activeRouteId)
                    );

                }
            );

        if (!selectedStillVisible) {

            closeActiveRouteView();

        }

    }

}


/* =====================================
   DISPLAY INCIDENTS
===================================== */

function displayIncidents() {

    const list =
        document.getElementById(
            "routes-list"
        );

    if (!list) {

        return;

    }

    list.innerHTML =
        "";

    if (
        filteredIncidents.length === 0
    ) {

        list.innerHTML = `
            <div class="routes-empty-state">
                Nu există incidente care să corespundă filtrelor selectate.
            </div>
        `;

        return;

    }

    filteredIncidents.forEach(
        function (incident) {

            list.appendChild(
                createIncidentCard(
                    incident
                )
            );

        }
    );

}


/* =====================================
   CREATE INCIDENT CARD
===================================== */

function createIncidentCard(
    incident
) {

    const card =
        document.createElement(
            "div"
        );

    const category =
        getIncidentCategory(
            incident
        );

    card.className =
        `route-card incident-${category}`;

    if (
        Number(incident.id) ===
        Number(activeRouteId)
    ) {

        card.classList.add(
            "selected"
        );

    }

    /* =====================================
   TOATE VEHICULELE ASIGNATE
===================================== */

const assignedVehicles =
    Array.isArray(
        incident.assigned_vehicles
    )
        ?
        incident.assigned_vehicles
        :
        [];


/*
 * Fallback pentru incidentele vechi sau
 * pentru cazul în care API-ul nu trimite
 * încă assigned_vehicles.
 */
if (
    assignedVehicles.length === 0
    &&
    incident.assigned_vehicle_code
) {

    assignedVehicles.push({
        vehicle_id:
            incident.assigned_vehicle_id,

        vehicle_code:
            incident.assigned_vehicle_code,

        vehicle_type:
            incident.assigned_vehicle_type
            ||
            incident.required_vehicle_type,

        assignment_type:
            "primary"
    });

}


const assignedVehiclesHtml =
    createIncidentAssignedVehiclesHtml(
        assignedVehicles
    );

    const createdAt =
        formatIncidentDate(
            incident.created_at
        );

    const dispatchedAt =
        formatIncidentDate(
            incident.dispatched_at
        );

    const resolvedAt =
        formatIncidentDate(
            incident.resolved_at
        );

    const reportAvailable =
        isIncidentArchived(
            incident
        );

    card.innerHTML = `
        <div class="route-card-header">

            <div class="route-card-code">
                ${escapeHtml(
                    incident.incident_code
                )}
            </div>

            <div
                class="
                    route-card-status
                    route-card-status-${category}
                "
            >
                ${escapeHtml(
                    getReadableStatus(
                        category
                    )
                )}
            </div>

        </div>

        <div class="route-card-title">
            ${escapeHtml(
                incident.title || "-"
            )}
        </div>

        <div class="route-card-info">

            <div>
                <strong>Stare în baza de date:</strong>
                ${escapeHtml(
                    getReadableStatus(
                        incident.status
                    )
                )}
            </div>

            <div>
                <strong>Tip incident:</strong>
                ${escapeHtml(
                    getReadableStatus(
                        incident.incident_type
                    )
                )}
            </div>

            <div>
                <strong>Vehicul necesar:</strong>
                ${escapeHtml(
                    getReadableStatus(
                        incident.required_vehicle_type
                    )
                )}
            </div>

            <div>
                <strong>Prioritate:</strong>
                ${escapeHtml(
                    getReadableStatus(
                        incident.priority
                    )
                )}
            </div>

            <div class="incident-assigned-vehicles">

    <strong>
        Vehicule asignate:
        ${assignedVehicles.length}
    </strong>

    ${assignedVehiclesHtml}

</div>

            <div>
                <strong>Creat:</strong>
                ${escapeHtml(
                    createdAt
                )}
            </div>

            ${
                incident.dispatched_at
                    ?
                    `
                        <div>
                            <strong>Dispecat:</strong>
                            ${escapeHtml(
                                dispatchedAt
                            )}
                        </div>
                    `
                    :
                    ""
            }

            ${
                incident.resolved_at
                    ?
                    `
                        <div>
                            <strong>Rezolvat:</strong>
                            ${escapeHtml(
                                resolvedAt
                            )}
                        </div>
                    `
                    :
                    ""
            }

        </div>

        <div class="route-card-actions">

            ${
                isIncidentActive(
                    incident
                )
                    ?
                    `
                        <button
                            type="button"
                            class="route-view-button"
                        >
                            Vezi ruta live
                        </button>
                    `
                    :
                    ""
            }

            <button
                type="button"
                class="incident-report-button"
                ${
                    reportAvailable
                        ?
                        ""
                        :
                        "disabled"
                }
                title="${
                    reportAvailable
                        ?
                        "Deschide raportul PDF"
                        :
                        "Raportul devine disponibil după arhivarea incidentului"
                }"
            >
                Raport
            </button>

        </div>
    `;

  /*
 * Click pe card:
 * pentru incidentul activ afișează toate rutele;
 * pentru incidentul arhivat afișează doar locația.
 */

card.addEventListener(
    "click",
    async function () {

        if (
            isIncidentActive(
                incident
            )
        ) {

            await openActiveRoute(
                incident
            );

            return;

        }

        showIncidentOnMap(
            incident
        );

    }
);

    const routeButton =
        card.querySelector(
            ".route-view-button"
        );

    if (routeButton) {

        routeButton.addEventListener(
            "click",
            async function (event) {

                event.stopPropagation();

                await openActiveRoute(
                    incident
                );

            }
        );

    }

    const reportButton =
        card.querySelector(
            ".incident-report-button"
        );

    if (reportButton) {

        reportButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (!reportAvailable) {

                    return;

                }

                openIncidentReport(
                    incident
                );

            }
        );

    }

    return card;

}


/* =====================================
   VEHICULE ASIGNATE INCIDENTULUI
===================================== */

function createIncidentAssignedVehiclesHtml(
    vehicles
) {

    if (
        !Array.isArray(vehicles)
        ||
        vehicles.length === 0
    ) {

        return `
            <div class="incident-assigned-vehicles-empty">
                Neatribuit
            </div>
        `;

    }


    const groupedVehicles = {};


    vehicles.forEach(
        function (vehicle) {

            const vehicleType =
                String(
                    vehicle.vehicle_type
                    ||
                    "unknown"
                ).toLowerCase();


            if (!groupedVehicles[vehicleType]) {

                groupedVehicles[vehicleType] =
                    [];

            }


            /*
             * Evităm afișarea accidentală
             * de două ori a aceleiași mașini.
             */
            const alreadyExists =
                groupedVehicles[
                    vehicleType
                ].some(
                    function (existingVehicle) {

                        return (
                            Number(
                                existingVehicle.vehicle_id
                            )
                            ===
                            Number(
                                vehicle.vehicle_id
                            )
                        );

                    }
                );


            if (!alreadyExists) {

                groupedVehicles[
                    vehicleType
                ].push(
                    vehicle
                );

            }

        }
    );


    return Object
        .entries(
            groupedVehicles
        )
        .map(
            function (
                [
                    vehicleType,
                    typeVehicles
                ]
            ) {

                const typeName =
                    getIncidentVehicleTypeName(
                        vehicleType
                    );


                const icon =
                    getIncidentVehicleTypeIcon(
                        vehicleType
                    );


                const vehicleCodes =
                    typeVehicles
                        .map(
                            function (vehicle) {

                                const code =
                                    vehicle.vehicle_code
                                    ||
                                    (
                                        "ID "
                                        + vehicle.vehicle_id
                                    );


                                return `
                                    <span class="incident-assigned-vehicle-code">

                                        ${escapeHtml(
                                            code
                                        )}

                                        ${
                                            vehicle.vehicle_id
                                                ?
                                                `
                                                    <small>
                                                        ID ${escapeHtml(
                                                            vehicle.vehicle_id
                                                        )}
                                                    </small>
                                                `
                                                :
                                                ""
                                        }

                                    </span>
                                `;

                            }
                        )
                        .join("");


                return `
                    <div class="incident-assigned-vehicle-group">

                        <div class="incident-assigned-vehicle-type">

                            <span>
                                ${icon}
                            </span>

                            <strong>
                                ${escapeHtml(
                                    typeName
                                )}
                                (${typeVehicles.length})
                            </strong>

                        </div>

                        <div class="incident-assigned-vehicle-codes">
                            ${vehicleCodes}
                        </div>

                    </div>
                `;

            }
        )
        .join("");

}


/* =====================================
   NUME TIP VEHICUL
===================================== */

function getIncidentVehicleTypeName(
    vehicleType
) {

    const names = {

        police:
            "Poliție",

        ambulance:
            "Ambulanță",

        fire:
            "Pompieri"

    };


    return (
        names[
            String(
                vehicleType
                ||
                ""
            ).toLowerCase()
        ]
        ||
        "Alt tip"
    );

}


/* =====================================
   ICON TIP VEHICUL
===================================== */

function getIncidentVehicleTypeIcon(
    vehicleType
) {

    const icons = {

        police:
            "🚓",

        ambulance:
            "🚑",

        fire:
            "🚒"

    };


    return (
        icons[
            String(
                vehicleType
                ||
                ""
            ).toLowerCase()
        ]
        ||
        "🚗"
    );

}

/* =====================================
   SHOW INCIDENT LOCATION ON MAP
===================================== */

function showIncidentOnMap(
    incident
) {

    if (
        sidebarMode !== "routes"
    ) {

        return;

    }

    if (
        !incidentHasLocation(
            incident
        )
    ) {

        alert(
            "Acest incident nu are o locație salvată."
        );

        return;

    }

    activeRouteId =
        null;

    activeIncidentId =
        incident.id;

    activeIncidentCode =
        incident.incident_code;

    activeIncidentLocation = {
        latitude:
            Number(
                incident.latitude
            ),

        longitude:
            Number(
                incident.longitude
            )
    };

    selectedVehicleId =
        null;

    clearIncidentRoute();

    updateVisibleMarkers([]);

    resetVehicleDetails();

    displayIncidentLocationMarker(
        incident
    );

    displayIncidents();

}


/* =====================================
   OPEN ACTIVE ROUTE
===================================== */

async function openActiveRoute(
    incident
) {

    if (
        sidebarMode !== "routes"
    ) {

        return;

    }

    if (
        !isIncidentActive(
            incident
        )
    ) {

        return;

    }

    activeRouteId =
        incident.id;

    activeIncidentId =
        incident.id;

    activeIncidentCode =
        incident.incident_code;

    activeIncidentLocation = {
        latitude:
            Number(
                incident.latitude
            ),

        longitude:
            Number(
                incident.longitude
            )
    };

    selectedVehicleId =
        null;

    /*
     * Nu mai afișăm manual primul vehicul.
     * displayIncidentRoutes() va afișa toate
     * vehiculele din răspunsul backend-ului.
     */
    updateVisibleMarkers([]);

    resetVehicleDetails();

    displayIncidents();

    try {

        const routeData =
            await window.getIncidentRoute(
                incident.id
            );

        if (
            sidebarMode !== "routes"
            ||
            Number(
                activeRouteId
            )
            !==
            Number(
                incident.id
            )
        ) {

            return;

        }

        displayIncidentRoutes(
            routeData
        );

    }

    catch (error) {

        console.error(
            "Rutele incidentului nu au putut fi deschise:",
            error
        );

        alert(
            error.message
        );

        await loadIncidents();

    }

}

/* =====================================
   REFRESH OPEN ACTIVE ROUTE
===================================== */

async function refreshOpenedActiveRoute() {

    if (
        sidebarMode !== "routes"
        ||
        activeRouteId === null
        ||
        activeRouteRefreshRunning
    ) {

        return;

    }

    activeRouteRefreshRunning =
        true;

    try {

        const routeId =
            activeRouteId;

        const activeIncident =
            activeRoutes.find(
                function (
                    incident
                ) {

                    return (
                        Number(
                            incident.id
                        )
                        ===
                        Number(
                            routeId
                        )
                    );

                }
            );

        if (!activeIncident) {

            closeActiveRouteView();

            return;

        }

        const routeData =
            await window.getIncidentRoute(
                routeId
            );

        if (
            sidebarMode !== "routes"
            ||
            Number(
                activeRouteId
            )
            !==
            Number(
                routeId
            )
        ) {

            return;

        }

        /*
         * Răspunsul conține poziția actuală
         * și ruta fiecărui vehicul asignat.
         */
        displayIncidentRoutes(
            routeData
        );

    }

    catch (error) {

        console.error(
            "Rutele active nu au putut fi actualizate:",
            error
        );

        await loadIncidents();

    }

    finally {

        activeRouteRefreshRunning =
            false;

    }

}


/* =====================================
   CLOSE ACTIVE ROUTE VIEW
===================================== */

function closeActiveRouteView() {

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

    clearIncidentRoute();

    removeIncidentMarker();

    resetVehicleDetails();

    displayIncidents();

    if (
        sidebarMode === "vehicles"
    ) {

        refreshVehicleView();

    }

    else {

        updateVisibleMarkers([]);

    }

}