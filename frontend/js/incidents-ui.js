/* =====================================
   LOAD INCIDENTS
===================================== */

async function loadIncidents() {

    if (
        sidebarMode !== "routes"
    ) {

        hideSelectedIncidentDetailsPanel();

    }


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
                function (
                    incident
                ) {

                    return isIncidentActive(
                        incident
                    );

                }
            );


        filteredIncidents =
            applyIncidentFilters();


        displayIncidents();


        if (
            sidebarMode ===
            "routes"
        ) {

            updateSidebarCount(
                filteredIncidents.length
            );

        }


        if (
            activeRouteId !==
            null
        ) {

            const routeStillActive =
                activeRoutes.some(
                    function (
                        incident
                    ) {

                        return (
                            Number(
                                incident.id
                            )
                            ===
                            Number(
                                activeRouteId
                            )
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
        function (
            incident
        ) {

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
                    category ===
                    "active";

            }

            else if (
                incidentFilters.status ===
                "archived"
            ) {

                statusMatches =
                    category ===
                    "archived";

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
                statusMatches
                &&
                typeMatches
                &&
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
        sidebarMode ===
        "routes"
    ) {

        updateSidebarCount(
            filteredIncidents.length
        );

    }


    if (
        activeRouteId !==
        null
    ) {

        const selectedStillVisible =
            filteredIncidents.some(
                function (
                    incident
                ) {

                    return (
                        Number(
                            incident.id
                        )
                        ===
                        Number(
                            activeRouteId
                        )
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
        filteredIncidents.length ===
        0
    ) {

        list.innerHTML = `
            <div class="routes-empty-state">
                Nu există incidente care să corespundă filtrelor selectate.
            </div>
        `;

        return;

    }


    filteredIncidents.forEach(
        function (
            incident
        ) {

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


    /*
     * Folosim activeIncidentId,
     * nu activeRouteId.
     *
     * Astfel și incidentele arhivate
     * rămân marcate ca selectate.
     */
    if (
        Number(
            incident.id
        )
        ===
        Number(
            activeIncidentId
        )
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
     * Fallback pentru incidentele vechi.
     */
    if (
        assignedVehicles.length ===
            0
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
                incident.title
                ||
                "-"
            )}
        </div>


        <div class="route-card-info">

            <div>
                <strong>
                    Stare în baza de date:
                </strong>

                ${escapeHtml(
                    getReadableStatus(
                        incident.status
                    )
                )}
            </div>


            <div>
                <strong>
                    Tip incident:
                </strong>

                ${escapeHtml(
                    getReadableStatus(
                        incident.incident_type
                    )
                )}
            </div>


            <div>
                <strong>
                    Vehicul necesar:
                </strong>

                ${escapeHtml(
                    getReadableStatus(
                        incident.required_vehicle_type
                    )
                )}
            </div>


            <div>
                <strong>
                    Prioritate:
                </strong>

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
                <strong>
                    Creat:
                </strong>

                ${escapeHtml(
                    createdAt
                )}
            </div>


            ${
                incident.dispatched_at
                    ?
                    `
                        <div>
                            <strong>
                                Dispecat:
                            </strong>

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
                            <strong>
                                Rezolvat:
                            </strong>

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


    /* =====================================
       CLICK PE INCIDENT
    ===================================== */

    card.addEventListener(
        "click",
        async function () {

            /*
             * Mai întâi afișăm boxul
             * Incident selectat.
             */
            await openSelectedIncidentDetails(
                incident
            );


            /*
             * Păstrăm comportamentul vechi
             * al hărții.
             */
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
            async function (
                event
            ) {

                event.stopPropagation();


                await openSelectedIncidentDetails(
                    incident
                );


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
            function (
                event
            ) {

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
        !Array.isArray(
            vehicles
        )
        ||
        vehicles.length ===
            0
    ) {

        return `
            <div class="incident-assigned-vehicles-empty">
                Neatribuit
            </div>
        `;

    }


    const groupedVehicles =
        {};


    vehicles.forEach(
        function (
            vehicle
        ) {

            const vehicleType =
                String(
                    vehicle.vehicle_type
                    ||
                    "unknown"
                ).toLowerCase();


            if (
                !groupedVehicles[
                    vehicleType
                ]
            ) {

                groupedVehicles[
                    vehicleType
                ] = [];

            }


            const alreadyExists =
                groupedVehicles[
                    vehicleType
                ].some(
                    function (
                        existingVehicle
                    ) {

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
                            function (
                                vehicle
                            ) {

                                const code =
                                    vehicle.vehicle_code
                                    ||
                                    (
                                        "ID "
                                        +
                                        vehicle.vehicle_id
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
            "Pompieri",

        firefighters:
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
            "🚒",

        firefighters:
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
   INCIDENT SELECTAT - ÎNCĂRCARE
===================================== */

async function openSelectedIncidentDetails(
    incident
) {

    if (
        sidebarMode !==
            "routes"
        ||
        !incident
        ||
        !incident.id
    ) {

        return;

    }


    activeIncidentId =
        incident.id;


    activeIncidentCode =
        incident.incident_code
        ||
        null;


    displayIncidents();


    displaySelectedIncidentLoading(
        incident
    );


    try {

        const details =
            await window.getIncidentDetails(
                incident.id
            );


        /*
         * Dacă utilizatorul a selectat
         * alt incident între timp,
         * ignorăm răspunsul vechi.
         */
        if (
            sidebarMode !==
                "routes"
            ||
            Number(
                activeIncidentId
            )
            !==
            Number(
                incident.id
            )
        ) {

            return;

        }


        displaySelectedIncidentDetails(
            details
        );

    }

    catch (error) {

        console.error(
            "Detaliile incidentului nu au putut fi încărcate:",
            error
        );


        displaySelectedIncidentError(
            incident,
            error
        );

    }

}


/* =====================================
   INCIDENT SELECTAT - LOADING
===================================== */

function displaySelectedIncidentLoading(
    incident
) {

    const panel =
        document.getElementById(
            "incident-details-panel"
        );


    const title =
        document.getElementById(
            "selected-incident-title"
        );


    const status =
        document.getElementById(
            "selected-incident-status"
        );


    const container =
        document.getElementById(
            "selected-incident-details"
        );


    if (
        !panel
        ||
        !container
    ) {

        return;

    }


    panel.hidden =
        false;


    if (title) {

        title.textContent =
            incident.incident_code
            ||
            "Detalii incident";

    }


    if (status) {

        status.textContent =
            "Se încarcă...";

        status.className =
            "selected-incident-status";

    }


    container.innerHTML = `
        <p class="empty-message">
            Se încarcă detaliile incidentului...
        </p>
    `;

}


/* =====================================
   INCIDENT SELECTAT - DISPLAY
===================================== */

function displaySelectedIncidentDetails(
    details
) {

    const panel =
        document.getElementById(
            "incident-details-panel"
        );


    const title =
        document.getElementById(
            "selected-incident-title"
        );


    const status =
        document.getElementById(
            "selected-incident-status"
        );


    const container =
        document.getElementById(
            "selected-incident-details"
        );


    if (
        !panel
        ||
        !container
    ) {

        return;

    }


    const incident =
        details?.incident
        ||
        {};


    const incidentTypes =
        Array.isArray(
            details?.incident_types
        )
            ?
            details.incident_types
            :
            (
                Array.isArray(
                    incident.incident_types
                )
                    ?
                    incident.incident_types
                    :
                    (
                        incident.incident_type
                            ?
                            [
                                incident.incident_type
                            ]
                            :
                            []
                    )
            );


    const requiredResources =
        Array.isArray(
            details?.required_resources
        )
            ?
            details.required_resources
            :
            (
                Array.isArray(
                    incident.required_resources
                )
                    ?
                    incident.required_resources
                    :
                    []
            );


    const assignments =
        Array.isArray(
            details?.assignments
        )
            ?
            details.assignments
            :
            (
                Array.isArray(
                    incident.assigned_vehicles
                )
                    ?
                    incident.assigned_vehicles
                    :
                    []
            );


    const reinforcementRequests =
        Array.isArray(
            details?.reinforcement_requests
        )
            ?
            details.reinforcement_requests
            :
            [];


    const operationalTimes =
        details?.operational_times
        ||
        {};


    const specialistProgress =
        details?.specialist_progress
        ||
        null;


    panel.hidden =
        false;


    if (title) {

        title.textContent =
            incident.incident_code
            ||
            "Detalii incident";

    }


    if (status) {

        const normalizedStatus =
            String(
                incident.status
                ||
                ""
            ).toLowerCase();


        status.textContent =
            getReadableStatus(
                incident.status
                ||
                "-"
            );


        status.className =
            (
                "selected-incident-status "
                +
                `selected-incident-status-${normalizedStatus}`
            );

    }


    const incidentTypesHtml =
        incidentTypes.length >
            0
            ?
            incidentTypes
                .map(
                    function (
                        incidentType
                    ) {

                        return `
                            <span class="selected-incident-chip">
                                ${escapeHtml(
                                    getReadableStatus(
                                        incidentType
                                    )
                                )}
                            </span>
                        `;

                    }
                )
                .join("")
            :
            `
                <span class="selected-incident-muted">
                    Nedefinit
                </span>
            `;


    const requiredResourcesHtml =
        buildSelectedIncidentResourcesHtml(
            requiredResources
        );


    const assignmentsHtml =
        buildSelectedIncidentAssignmentsHtml(
            assignments
        );


    const reinforcementHtml =
        buildSelectedIncidentReinforcementHtml(
            reinforcementRequests
        );


    const specialistProgressHtml =
        buildSelectedIncidentSpecialistProgressHtml(
            specialistProgress
        );


    const createdAt =
        formatIncidentDate(
            incident.created_at
        );


    const dispatchedAt =
        formatIncidentDate(
            operationalTimes.dispatched_at
            ||
            incident.dispatched_at
        );


    /*
     * Dacă backendul complet nu este
     * încă disponibil, putem calcula
     * prima sosire direct din assignments.
     */
    const assignmentArrivalTimes =
        assignments
            .map(
                function (
                    assignment
                ) {

                    return assignment.arrived_at;

                }
            )
            .filter(
                Boolean
            );


    const fallbackFirstArrival =
        getEarliestIncidentDateValue(
            assignmentArrivalTimes
        );


    const firstArrivalAt =
        formatIncidentDate(
            operationalTimes.first_arrival_at
            ||
            fallbackFirstArrival
        );


    const resolvedAt =
        formatIncidentDate(
            operationalTimes.resolved_at
            ||
            incident.resolved_at
        );


    let firstArrivalDuration =
        formatIncidentDurationSeconds(
            operationalTimes.first_arrival_seconds
        );


    if (
        firstArrivalDuration ===
            "-"
        &&
        (
            operationalTimes.dispatched_at
            ||
            incident.dispatched_at
        )
        &&
        fallbackFirstArrival
    ) {

        firstArrivalDuration =
            calculateIncidentDateDuration(
                operationalTimes.dispatched_at
                ||
                incident.dispatched_at,

                fallbackFirstArrival
            );

    }


    let totalIncidentDuration =
        formatIncidentDurationSeconds(
            operationalTimes.total_incident_seconds
        );


    if (
        totalIncidentDuration ===
            "-"
        &&
        incident.created_at
        &&
        incident.resolved_at
    ) {

        totalIncidentDuration =
            calculateIncidentDateDuration(
                incident.created_at,
                incident.resolved_at
            );

    }


    const locationText =
        buildSelectedIncidentLocationText(
            incident
        );


    container.innerHTML = `
        <div class="selected-incident-summary">

            <div class="selected-incident-summary-main">

                <span class="selected-incident-summary-label">
                    Eveniment
                </span>

                <strong class="selected-incident-summary-title">
                    ${escapeHtml(
                        incident.title
                        ||
                        "Incident fără titlu"
                    )}
                </strong>

                <span class="selected-incident-summary-code">
                    ID incident:
                    ${escapeHtml(
                        incident.id
                        ??
                        "-"
                    )}
                </span>

            </div>


            <div class="selected-incident-priority">

                <span>
                    Prioritate
                </span>

                <strong>
                    ${escapeHtml(
                        getReadableStatus(
                            incident.priority
                            ||
                            "-"
                        )
                    )}
                </strong>

            </div>

        </div>


        <div class="selected-incident-info-grid">

            <div class="selected-incident-info-item">
                <span>
                    Creat
                </span>

                <strong>
                    ${escapeHtml(
                        createdAt
                    )}
                </strong>
            </div>


            <div class="selected-incident-info-item">
                <span>
                    Dispecat
                </span>

                <strong>
                    ${escapeHtml(
                        dispatchedAt
                    )}
                </strong>
            </div>


            <div class="selected-incident-info-item">
                <span>
                    Prima sosire
                </span>

                <strong>
                    ${escapeHtml(
                        firstArrivalAt
                    )}
                </strong>
            </div>


            <div class="selected-incident-info-item">
                <span>
                    Timp până la prima sosire
                </span>

                <strong>
                    ${escapeHtml(
                        firstArrivalDuration
                    )}
                </strong>
            </div>


            <div class="selected-incident-info-item">
                <span>
                    Rezolvat
                </span>

                <strong>
                    ${escapeHtml(
                        resolvedAt
                    )}
                </strong>
            </div>


            <div class="selected-incident-info-item">
                <span>
                    Durată totală
                </span>

                <strong>
                    ${escapeHtml(
                        totalIncidentDuration
                    )}
                </strong>
            </div>

        </div>


        <div class="selected-incident-section">

            <h3>
                Tipuri incident
            </h3>

            <div class="selected-incident-chip-list">
                ${incidentTypesHtml}
            </div>

        </div>


        <div class="selected-incident-section">

            <h3>
                Locație
            </h3>

            <div class="selected-incident-location">
                ${escapeHtml(
                    locationText
                )}
            </div>

        </div>


        <div class="selected-incident-section">

            <h3>
                Detalii inițiale
            </h3>

            <p class="selected-incident-description">
                ${escapeHtml(
                    incident.details
                    ||
                    "Nu au fost introduse detalii suplimentare."
                )}
            </p>

        </div>


        <div class="selected-incident-section">

            <h3>
                Resurse solicitate inițial
            </h3>

            ${requiredResourcesHtml}

        </div>


        <div class="selected-incident-section">

            <div class="selected-incident-section-heading">

                <h3>
                    Vehicule implicate
                </h3>

                <span>
                    ${assignments.length}
                </span>

            </div>

            ${assignmentsHtml}

        </div>


        ${reinforcementHtml}


        ${specialistProgressHtml}
    `;

}


/* =====================================
   RESURSE INCIDENT SELECTAT
===================================== */

function buildSelectedIncidentResourcesHtml(
    resources
) {

    if (
        !Array.isArray(
            resources
        )
        ||
        resources.length ===
            0
    ) {

        return `
            <p class="selected-incident-muted">
                Nu există resurse inițiale înregistrate.
            </p>
        `;

    }


    return `
        <div class="selected-incident-resource-list">

            ${
                resources
                    .map(
                        function (
                            resource
                        ) {

                            const vehicleType =
                                String(
                                    resource.vehicle_type
                                    ||
                                    ""
                                ).toLowerCase();


                            const quantity =
                                Number(
                                    resource.quantity
                                    ??
                                    resource.requested_quantity
                                    ??
                                    0
                                );


                            return `
                                <div class="selected-incident-resource-item">

                                    <span class="selected-incident-resource-icon">
                                        ${getIncidentVehicleTypeIcon(
                                            vehicleType
                                        )}
                                    </span>

                                    <div>

                                        <strong>
                                            ${escapeHtml(
                                                getIncidentVehicleTypeName(
                                                    vehicleType
                                                )
                                            )}
                                        </strong>

                                        <span>
                                            ${escapeHtml(
                                                quantity
                                            )}
                                            vehicul(e) solicitat(e)
                                        </span>

                                    </div>

                                </div>
                            `;

                        }
                    )
                    .join("")
            }

        </div>
    `;

}


/* =====================================
   VEHICULE INCIDENT SELECTAT
===================================== */

function buildSelectedIncidentAssignmentsHtml(
    assignments
) {

    if (
        !Array.isArray(
            assignments
        )
        ||
        assignments.length ===
            0
    ) {

        return `
            <p class="selected-incident-muted">
                Nu există vehicule înregistrate pentru acest incident.
            </p>
        `;

    }


    return `
        <div class="selected-incident-assignment-list">

            ${
                assignments
                    .map(
                        function (
                            assignment
                        ) {

                            const vehicleType =
                                String(
                                    assignment.vehicle_type
                                    ||
                                    ""
                                ).toLowerCase();


                            const assignmentType =
                                getSelectedIncidentAssignmentTypeName(
                                    assignment.assignment_type
                                );


                            const assignmentStatus =
                                getSelectedIncidentAssignmentStatusName(
                                    assignment.assignment_status
                                    ||
                                    assignment.status
                                );


                            const assignedAt =
                                formatIncidentDate(
                                    assignment.assigned_at
                                );


                            const arrivedAt =
                                formatIncidentDate(
                                    assignment.arrived_at
                                );


                            const releasedAt =
                                formatIncidentDate(
                                    assignment.released_at
                                );


                            const travelDuration =
                                calculateIncidentDateDuration(
                                    assignment.assigned_at,
                                    assignment.arrived_at
                                );


                            const missionDuration =
                                calculateIncidentDateDuration(
                                    assignment.assigned_at,
                                    assignment.released_at
                                    ||
                                    assignment.arrived_at
                                );


                            const vehicleCode =
                                assignment.vehicle_code
                                ||
                                (
                                    "Vehicul "
                                    +
                                    (
                                        assignment.vehicle_id
                                        ||
                                        "-"
                                    )
                                );


                            return `
                                <div class="selected-incident-assignment-card">

                                    <div class="selected-incident-assignment-header">

                                        <div class="selected-incident-assignment-vehicle">

                                            <span>
                                                ${getIncidentVehicleTypeIcon(
                                                    vehicleType
                                                )}
                                            </span>

                                            <div>

                                                <strong>
                                                    ${escapeHtml(
                                                        vehicleCode
                                                    )}
                                                </strong>

                                                <small>
                                                    ${escapeHtml(
                                                        getIncidentVehicleTypeName(
                                                            vehicleType
                                                        )
                                                    )}
                                                    ·
                                                    ${escapeHtml(
                                                        assignmentType
                                                    )}
                                                </small>

                                            </div>

                                        </div>


                                        <span class="selected-incident-assignment-status">
                                            ${escapeHtml(
                                                assignmentStatus
                                            )}
                                        </span>

                                    </div>


                                    <div class="selected-incident-assignment-times">

                                        <div>
                                            <span>
                                                Asignat
                                            </span>

                                            <strong>
                                                ${escapeHtml(
                                                    assignedAt
                                                )}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Ajuns
                                            </span>

                                            <strong>
                                                ${escapeHtml(
                                                    arrivedAt
                                                )}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Eliberat
                                            </span>

                                            <strong>
                                                ${escapeHtml(
                                                    releasedAt
                                                )}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Deplasare
                                            </span>

                                            <strong>
                                                ${escapeHtml(
                                                    travelDuration
                                                )}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Timp alocat
                                            </span>

                                            <strong>
                                                ${escapeHtml(
                                                    missionDuration
                                                )}
                                            </strong>
                                        </div>

                                    </div>

                                </div>
                            `;

                        }
                    )
                    .join("")
            }

        </div>
    `;

}


/* =====================================
   ÎNTĂRIRI INCIDENT SELECTAT
===================================== */

function buildSelectedIncidentReinforcementHtml(
    requests
) {

    if (
        !Array.isArray(
            requests
        )
        ||
        requests.length ===
            0
    ) {

        return "";

    }


    const activeCount =
        requests.filter(
            function (
                request
            ) {

                return [
                    "pending",
                    "partially_assigned"
                ].includes(
                    String(
                        request.status
                        ||
                        ""
                    ).toLowerCase()
                );

            }
        ).length;


    const completedCount =
        requests.filter(
            function (
                request
            ) {

                return [
                    "accepted",
                    "completed"
                ].includes(
                    String(
                        request.status
                        ||
                        ""
                    ).toLowerCase()
                );

            }
        ).length;


    return `
        <div class="selected-incident-section">

            <div class="selected-incident-section-heading">

                <h3>
                    Cereri de întăriri
                </h3>

                <span>
                    ${requests.length}
                </span>

            </div>


            <div class="selected-incident-info-grid">

                <div class="selected-incident-info-item">

                    <span>
                        Total cereri
                    </span>

                    <strong>
                        ${requests.length}
                    </strong>

                </div>


                <div class="selected-incident-info-item">

                    <span>
                        Active
                    </span>

                    <strong>
                        ${activeCount}
                    </strong>

                </div>


                <div class="selected-incident-info-item">

                    <span>
                        Aprobate / finalizate
                    </span>

                    <strong>
                        ${completedCount}
                    </strong>

                </div>

            </div>

        </div>
    `;

}


/* =====================================
   PROGRES CHESTIONARE
===================================== */

function buildSelectedIncidentSpecialistProgressHtml(
    progress
) {

    if (
        !progress
        ||
        Number(
            progress.total
            ||
            0
        ) ===
        0
    ) {

        return "";

    }


    const total =
        Number(
            progress.total
            ||
            0
        );


    const confirmed =
        Number(
            progress.confirmed
            ||
            0
        );


    const pending =
        Number(
            progress.pending
            ??
            Math.max(
                total - confirmed,
                0
            )
        );


    return `
        <div class="selected-incident-section">

            <h3>
                Informații operative
            </h3>


            <div class="selected-incident-info-grid">

                <div class="selected-incident-info-item">

                    <span>
                        Chestionare necesare
                    </span>

                    <strong>
                        ${total}
                    </strong>

                </div>


                <div class="selected-incident-info-item">

                    <span>
                        Confirmate
                    </span>

                    <strong>
                        ${confirmed}
                    </strong>

                </div>


                <div class="selected-incident-info-item">

                    <span>
                        Rămase
                    </span>

                    <strong>
                        ${pending}
                    </strong>

                </div>

            </div>


            <p class="selected-incident-muted">
                Conținutul complet al chestionarelor va fi inclus în raportul incidentului.
            </p>

        </div>
    `;

}


/* =====================================
   INCIDENT SELECTAT - HELPERS
===================================== */

function getSelectedIncidentAssignmentTypeName(
    assignmentType
) {

    const names = {

        primary:
            "Principal",

        reinforcement:
            "Întărire"

    };


    const normalized =
        String(
            assignmentType
            ||
            ""
        ).toLowerCase();


    return (
        names[
            normalized
        ]
        ||
        getReadableStatus(
            normalized
            ||
            "-"
        )
    );

}


function getSelectedIncidentAssignmentStatusName(
    assignmentStatus
) {

    const names = {

        assigned:
            "Asignat",

        in_progress:
            "În deplasare",

        arrived:
            "Ajuns",

        released:
            "Eliberat",

        cancelled:
            "Anulat"

    };


    const normalized =
        String(
            assignmentStatus
            ||
            ""
        ).toLowerCase();


    return (
        names[
            normalized
        ]
        ||
        getReadableStatus(
            normalized
            ||
            "-"
        )
    );

}


/* =====================================
   LOCAȚIE INCIDENT
===================================== */

function buildSelectedIncidentLocationText(
    incident
) {

    if (
        incident.latitude ===
            null
        ||
        incident.latitude ===
            undefined
        ||
        incident.longitude ===
            null
        ||
        incident.longitude ===
            undefined
    ) {

        return (
            "Locația nu este disponibilă."
        );

    }


    const latitude =
        Number(
            incident.latitude
        );


    const longitude =
        Number(
            incident.longitude
        );


    if (
        !Number.isFinite(
            latitude
        )
        ||
        !Number.isFinite(
            longitude
        )
    ) {

        return (
            "Locația nu este disponibilă."
        );

    }


    return (
        `Latitudine ${latitude.toFixed(6)}, `
        +
        `longitudine ${longitude.toFixed(6)}`
    );

}


/* =====================================
   PRIMA DATĂ DIN LISTĂ
===================================== */

function getEarliestIncidentDateValue(
    values
) {

    if (
        !Array.isArray(
            values
        )
        ||
        values.length ===
            0
    ) {

        return null;

    }


    let earliestValue =
        null;


    let earliestTimestamp =
        null;


    values.forEach(
        function (
            value
        ) {

            const parsed =
                parseIncidentDateValue(
                    value
                );


            if (!parsed) {

                return;

            }


            const timestamp =
                parsed.getTime();


            if (
                earliestTimestamp ===
                    null
                ||
                timestamp <
                    earliestTimestamp
            ) {

                earliestTimestamp =
                    timestamp;

                earliestValue =
                    value;

            }

        }
    );


    return earliestValue;

}


/* =====================================
   CALCUL DURATĂ ÎNTRE DATE
===================================== */

function calculateIncidentDateDuration(
    startValue,
    endValue
) {

    if (
        !startValue
        ||
        !endValue
    ) {

        return "-";

    }


    const startDate =
        parseIncidentDateValue(
            startValue
        );


    const endDate =
        parseIncidentDateValue(
            endValue
        );


    if (
        !startDate
        ||
        !endDate
    ) {

        return "-";

    }


    const seconds =
        Math.max(
            Math.round(
                (
                    endDate.getTime()
                    -
                    startDate.getTime()
                )
                /
                1000
            ),
            0
        );


    return formatIncidentDurationSeconds(
        seconds
    );

}


/* =====================================
   PARSARE DATĂ
===================================== */

function parseIncidentDateValue(
    value
) {

    if (!value) {

        return null;

    }


    const normalizedValue =
        typeof value ===
            "string"
            ?
            value.replace(
                " ",
                "T"
            )
            :
            value;


    const date =
        new Date(
            normalizedValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


/* =====================================
   FORMAT DURATĂ
===================================== */

function formatIncidentDurationSeconds(
    secondsValue
) {

    if (
        secondsValue ===
            null
        ||
        secondsValue ===
            undefined
        ||
        secondsValue ===
            ""
    ) {

        return "-";

    }


    const totalSeconds =
        Number(
            secondsValue
        );


    if (
        !Number.isFinite(
            totalSeconds
        )
        ||
        totalSeconds <
            0
    ) {

        return "-";

    }


    const totalMinutes =
        Math.floor(
            totalSeconds
            /
            60
        );


    const hours =
        Math.floor(
            totalMinutes
            /
            60
        );


    const minutes =
        totalMinutes %
        60;


    if (
        hours >
        0
    ) {

        return (
            `${hours} h ${minutes} min`
        );

    }


    if (
        totalMinutes >
        0
    ) {

        return (
            `${totalMinutes} min`
        );

    }


    return (
        `${Math.round(
            totalSeconds
        )} sec`
    );

}


/* =====================================
   INCIDENT SELECTAT - EROARE
===================================== */

function displaySelectedIncidentError(
    incident,
    error
) {

    const panel =
        document.getElementById(
            "incident-details-panel"
        );


    const title =
        document.getElementById(
            "selected-incident-title"
        );


    const status =
        document.getElementById(
            "selected-incident-status"
        );


    const container =
        document.getElementById(
            "selected-incident-details"
        );


    if (
        !panel
        ||
        !container
    ) {

        return;

    }


    panel.hidden =
        false;


    if (title) {

        title.textContent =
            incident?.incident_code
            ||
            "Detalii incident";

    }


    if (status) {

        status.textContent =
            "Eroare";


        status.className =
            (
                "selected-incident-status "
                +
                "selected-incident-status-error"
            );

    }


    container.innerHTML = `
        <p class="empty-message">
            ${escapeHtml(
                error?.message
                ||
                "Detaliile incidentului nu au putut fi încărcate."
            )}
        </p>
    `;

}


/* =====================================
   ASCUNDE INCIDENT SELECTAT
===================================== */

function hideSelectedIncidentDetailsPanel() {

    const panel =
        document.getElementById(
            "incident-details-panel"
        );


    if (panel) {

        panel.hidden =
            true;

    }

}


/* =====================================
   SHOW INCIDENT LOCATION ON MAP
===================================== */

function showIncidentOnMap(
    incident
) {

    if (
        sidebarMode !==
        "routes"
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


    updateVisibleMarkers(
        []
    );


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
        sidebarMode !==
        "routes"
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
    updateVisibleMarkers(
        []
    );


    resetVehicleDetails();


    displayIncidents();


    try {

        const routeData =
            await window.getIncidentRoute(
                incident.id
            );


        if (
            sidebarMode !==
                "routes"
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
        sidebarMode !==
            "routes"
        ||
        activeRouteId ===
            null
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
            sidebarMode !==
                "routes"
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


    hideSelectedIncidentDetailsPanel();


    displayIncidents();


    if (
        sidebarMode ===
        "vehicles"
    ) {

        refreshVehicleView();

    }

    else {

        updateVisibleMarkers(
            []
        );

    }

}