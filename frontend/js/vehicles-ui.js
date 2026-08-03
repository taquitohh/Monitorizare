/* =====================================
   LOAD VEHICLES
===================================== */

async function loadVehicles() {

    try {

        const result =
            await window.getVehicles();

        if (!Array.isArray(result)) {

            throw new Error(
                "The vehicles API did not return an array."
            );

        }

        vehicles = result;

        vehicles.sort(
            function (
                vehicleA,
                vehicleB
            ) {

                return (
                    getVehicleNumber(
                        vehicleA.vehicle_code
                    )
                    -
                    getVehicleNumber(
                        vehicleB.vehicle_code
                    )
                );

            }
        );

        vehicles.forEach(
            function (vehicle) {

                vehicle.displayName =
                    getVehicleDisplayName(
                        vehicle.vehicle_code
                    );

            }
        );

        updateRecommendedVehicleFromLatestData();

        refreshVehicleView();

    }

    catch (error) {

        console.error(
            "Could not load vehicles:",
            error
        );

    }

}


/* =====================================
   UPDATE RECOMMENDED VEHICLE DATA
===================================== */

function updateRecommendedVehicleFromLatestData() {

    if (!recommendedVehicle) {

        return;

    }

    const updatedVehicle =
        vehicles.find(
            function (vehicle) {

                return (
                    Number(vehicle.id) ===
                    Number(
                        recommendedVehicle.id
                    )
                );

            }
        );

    if (updatedVehicle) {

        recommendedVehicle =
            updatedVehicle;

    }

}


/* =====================================
   INITIALIZE VEHICLE FILTERS
===================================== */

function initializeVehicleFilters() {

    const typeFilter =
        document.getElementById(
            "type-filter"
        );

    const statusFilter =
        document.getElementById(
            "status-filter"
        );

    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            function () {

                recommendationModeActive =
                    false;

                hideRecommendationPanel();

                filters.type =
                    this.value;

                refreshVehicleView();

            }
        );

    }

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            function () {

                recommendationModeActive =
                    false;

                hideRecommendationPanel();

                filters.status =
                    this.value;

                refreshVehicleView();

            }
        );

    }

}


/* =====================================
   RESET VEHICLE FILTERS
===================================== */

function resetVehicleFilters() {

    filters.type =
        "all";

    filters.status =
        "all";

    const typeFilter =
        document.getElementById(
            "type-filter"
        );

    const statusFilter =
        document.getElementById(
            "status-filter"
        );

    if (typeFilter) {

        typeFilter.value =
            "all";

    }

    if (statusFilter) {

        statusFilter.value =
            "all";

    }

}


/* =====================================
   APPLY VEHICLE FILTERS
===================================== */

function applyVehicleFilters() {

    return vehicles.filter(
        function (vehicle) {

            const vehicleType =
                String(
                    vehicle.vehicle_type || ""
                ).toLowerCase();

            const vehicleStatus =
                String(
                    vehicle.status || ""
                ).toLowerCase();

            const typeMatches =
                filters.type === "all"
                ||
                vehicleType ===
                    filters.type;

            const statusMatches =
                filters.status === "all"
                ||
                vehicleStatus ===
                    filters.status;

            return (
                typeMatches &&
                statusMatches
            );

        }
    );

}


/* =====================================
   REFRESH VEHICLE VIEW
===================================== */

function refreshVehicleView() {

    if (
        recommendationModeActive &&
        recommendedVehicle
    ) {

        filteredVehicles = [
            recommendedVehicle
        ];

    }

    else {

        filteredVehicles =
            applyVehicleFilters();

    }

    if (
        sidebarMode === "vehicles"
    ) {

        updateSidebarCount(
            filteredVehicles.length
        );

    }

    displayVehicles(
        filteredVehicles
    );

    if (
        sidebarMode === "vehicles" &&
        activeRouteId === null
    ) {

        updateVisibleMarkers(
            filteredVehicles
        );

    }

    refreshSelectedVehicleDetails();

}


/* =====================================
   UPDATE SIDEBAR COUNT
===================================== */

function updateSidebarCount(
    count
) {

    const countElement =
        document.getElementById(
            "vehicle-count"
        );

    if (countElement) {

        countElement.textContent =
            count;

    }

}


/* =====================================
   DISPLAY VEHICLES
===================================== */

function displayVehicles(
    vehicleList
) {

    const list =
        document.getElementById(
            "vehicles-list"
        );

    if (!list) {

        return;

    }

    list.innerHTML =
        "";

    if (
        vehicleList.length === 0
    ) {

        list.innerHTML = `
            <p class="empty-message">
                No vehicles match the selected filters.
            </p>
        `;

        return;

    }

    vehicleList.forEach(
        function (vehicle) {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                `vehicle-card ${escapeHtml(
                    vehicle.vehicle_type
                )}`;

            if (
                vehicle.vehicle_code ===
                selectedVehicleId
            ) {

                card.classList.add(
                    "selected"
                );

            }

            if (
                recommendedVehicle &&
                Number(vehicle.id) ===
                Number(
                    recommendedVehicle.id
                )
            ) {

                card.classList.add(
                    "recommended"
                );

            }

            card.innerHTML = `
                <div class="vehicle-name">
                    ${escapeHtml(
                        vehicle.displayName
                    )}
                </div>

                <div class="vehicle-status">
                    <strong>Type:</strong>
                    ${escapeHtml(
                        vehicle.vehicle_type
                    )}
                </div>

                <div
                    class="
                        vehicle-status
                        status-${escapeHtml(
                            vehicle.status
                        )}
                    "
                >
                    ● ${escapeHtml(
                        vehicle.status
                    )}
                </div>
            `;

            card.addEventListener(
                "click",
                function () {

                    selectVehicle(
                        vehicle
                    );

                }
            );

            list.appendChild(
                card
            );

        }
    );

}


/* =====================================
   SELECT VEHICLE
===================================== */

function selectVehicle(
    vehicle
) {

    activeRouteId =
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

    selectedVehicleId =
        vehicle.vehicle_code;

    displayVehicles(
        filteredVehicles
    );

    focusVehicle(
        vehicle
    );

    displayVehicleDetails(
        vehicle
    );

}


/* =====================================
   REFRESH SELECTED VEHICLE DETAILS
===================================== */

function refreshSelectedVehicleDetails() {

    if (
        selectedVehicleId === null
    ) {

        return;

    }

    const selectedVehicle =
        vehicles.find(
            function (vehicle) {

                return (
                    vehicle.vehicle_code ===
                    selectedVehicleId
                );

            }
        );

    if (selectedVehicle) {

        displayVehicleDetails(
            selectedVehicle
        );

    }

}


/* =====================================
   DISPLAY VEHICLE DETAILS
===================================== */

function displayVehicleDetails(
    vehicle
) {

    const details =
        document.getElementById(
            "vehicle-details"
        );

    if (!details) {

        return;

    }

    const latitude =
        Number(
            vehicle.latitude
        );

    const longitude =
        Number(
            vehicle.longitude
        );

    details.innerHTML = `
        <div class="details-grid">

            <div class="detail-item">

                <div class="detail-label">
                    Vehicle
                </div>

                <div class="detail-value">
                    ${escapeHtml(
                        vehicle.displayName
                    )}
                </div>

            </div>

            <div class="detail-item">

                <div class="detail-label">
                    Type
                </div>

                <div class="detail-value">
                    ${escapeHtml(
                        vehicle.vehicle_type
                    )}
                </div>

            </div>

            <div class="detail-item">

                <div class="detail-label">
                    Status
                </div>

                <div class="detail-value">
                    ${escapeHtml(
                        vehicle.status
                    )}
                </div>

            </div>

            <div class="detail-item">

                <div class="detail-label">
                    Speed
                </div>

                <div class="detail-value">
                    ${formatNumber(
                        vehicle.speed,
                        2
                    )} km/h
                </div>

            </div>

            <div class="detail-item">

                <div class="detail-label">
                    Latitude
                </div>

                <div class="detail-value">
                    ${formatCoordinate(
                        latitude
                    )}
                </div>

            </div>

            <div class="detail-item">

                <div class="detail-label">
                    Longitude
                </div>

                <div class="detail-value">
                    ${formatCoordinate(
                        longitude
                    )}
                </div>

            </div>

            <div class="detail-item">

                <div class="detail-label">
                    Last Update
                </div>

                <div class="detail-value">
                    ${escapeHtml(
                        vehicle.updated_at ?? "-"
                    )}
                </div>

            </div>

        </div>
    `;

}


/* =====================================
   RESET VEHICLE DETAILS
===================================== */

function resetVehicleDetails() {

    const details =
        document.getElementById(
            "vehicle-details"
        );

    if (details) {

        details.innerHTML = `
            <p class="empty-message">
                Select a vehicle to view details
            </p>
        `;

    }

}