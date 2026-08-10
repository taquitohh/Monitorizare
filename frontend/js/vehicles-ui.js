/* =====================================
   ÎNCĂRCARE VEHICULE
===================================== */

async function loadVehicles() {

    try {

        const result =
            await window.getVehicles();

        if (!Array.isArray(result)) {

            throw new Error(
                "API-ul vehiculelor nu a returnat o listă validă."
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
            "Vehiculele nu au putut fi încărcate:",
            error
        );

    }

}


/* =====================================
   ACTUALIZARE DATE VEHICULE RECOMANDATE
===================================== */

function updateRecommendedVehicleFromLatestData() {

    if (
        !Array.isArray(
            recommendedVehicles
        )
        ||
        recommendedVehicles.length === 0
    ) {

        recommendedVehicle =
            null;

        return;

    }

    recommendedVehicles =
        recommendedVehicles.map(
            function (
                recommendedItem
            ) {

                const updatedVehicle =
                    vehicles.find(
                        function (
                            vehicle
                        ) {

                            return (
                                Number(
                                    vehicle.id
                                )
                                ===
                                Number(
                                    recommendedItem.id
                                )
                            );

                        }
                    );

                if (!updatedVehicle) {

                    return (
                        recommendedItem
                    );

                }

                return {
                    ...updatedVehicle,

                    displayName:
                        getVehicleDisplayName(
                            updatedVehicle
                                .vehicle_code
                        ),

                    distance_km:
                        recommendedItem
                            .distance_km
                };

            }
        );

    recommendedVehicle =
        recommendedVehicles[0]
        ||
        null;

    if (recommendedVehicle) {

        recommendedVehicleDistance =
            Number(
                recommendedVehicle
                    .distance_km
            );

    }

}


/* =====================================
   INIȚIALIZARE FILTRE VEHICULE
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
   RESETARE FILTRE VEHICULE
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
   APLICARE FILTRE VEHICULE
===================================== */

function applyVehicleFilters() {

    return vehicles.filter(
        function (vehicle) {

            const vehicleType =
                String(
                    vehicle.vehicle_type
                    ||
                    ""
                ).toLowerCase();

            const vehicleStatus =
                String(
                    vehicle.status
                    ||
                    ""
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
                typeMatches
                &&
                statusMatches
            );

        }
    );

}


/* =====================================
   ACTUALIZARE VEDERE VEHICULE
===================================== */

function refreshVehicleView() {

    if (
        recommendationModeActive
        &&
        Array.isArray(
            recommendedVehicles
        )
        &&
        recommendedVehicles.length > 0
    ) {

        filteredVehicles = [
            ...recommendedVehicles
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
        sidebarMode === "vehicles"
        &&
        activeRouteId === null
    ) {

        updateVisibleMarkers(
            filteredVehicles
        );

    }

    refreshSelectedVehicleDetails();

}


/* =====================================
   ACTUALIZARE NUMĂR VEHICULE
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
   AFIȘARE VEHICULE
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
        !Array.isArray(
            vehicleList
        )
        ||
        vehicleList.length === 0
    ) {

        list.innerHTML = `
            <p class="empty-message">
                Nu există vehicule care să corespundă filtrelor selectate.
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

            const vehicleType =
                String(
                    vehicle.vehicle_type
                    ||
                    ""
                ).toLowerCase();

            const vehicleStatus =
                String(
                    vehicle.status
                    ||
                    ""
                ).toLowerCase();

            card.className =
                `vehicle-card ${escapeHtml(
                    vehicleType
                )}`;

            if (
                vehicle.vehicle_code ===
                selectedVehicleId
            ) {

                card.classList.add(
                    "selected"
                );

            }

            const isRecommended =
                Array.isArray(
                    recommendedVehicles
                )
                &&
                recommendedVehicles.some(
                    function (
                        recommendedItem
                    ) {

                        return (
                            Number(
                                recommendedItem.id
                            )
                            ===
                            Number(
                                vehicle.id
                            )
                        );

                    }
                );

            if (isRecommended) {

                card.classList.add(
                    "recommended"
                );

            }

            const displayName =
                vehicle.displayName
                ||
                getVehicleDisplayName(
                    vehicle.vehicle_code
                );

            const distance =
                Number(
                    vehicle.distance_km
                );

            const recommendationDistanceHtml =
                (
                    recommendationModeActive
                    &&
                    isRecommended
                    &&
                    Number.isFinite(
                        distance
                    )
                )
                    ? `
                        <div class="vehicle-status">
                            <strong>
                                Distanță:
                            </strong>

                            ${escapeHtml(
                                distance.toFixed(
                                    3
                                )
                            )} km
                        </div>
                    `
                    : "";

            card.innerHTML = `
                <div class="vehicle-name">
                    ${escapeHtml(
                        displayName
                    )}
                </div>

                <div class="vehicle-status">
                    <strong>
                        Tip:
                    </strong>

                    ${escapeHtml(
                        getReadableStatus(
                            vehicleType
                        )
                    )}
                </div>

                <div
                    class="
                        vehicle-status
                        status-${escapeHtml(
                            vehicleStatus
                        )}
                    "
                >
                    ● ${escapeHtml(
                        getReadableStatus(
                            vehicleStatus
                        )
                    )}
                </div>

                ${recommendationDistanceHtml}
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
   SELECTARE VEHICUL
===================================== */

function selectVehicle(
    vehicle
) {

    if (!vehicle) {

        return;

    }

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

    /*
     * Înlocuim selecția anterioară.
     * Doar un vehicul rămâne selectat.
     */
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
   ACTUALIZARE DETALII VEHICUL SELECTAT
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

        return;

    }

    const selectedRecommendedVehicle =
        Array.isArray(
            recommendedVehicles
        )
            ? recommendedVehicles.find(
                function (
                    vehicle
                ) {

                    return (
                        vehicle.vehicle_code ===
                        selectedVehicleId
                    );

                }
            )
            : null;

    if (selectedRecommendedVehicle) {

        displayVehicleDetails(
            selectedRecommendedVehicle
        );

        return;

    }

    selectedVehicleId =
        null;

    resetVehicleDetails();

}


/* =====================================
   AFIȘARE DETALII VEHICUL
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

    if (!vehicle) {

        resetVehicleDetails();

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

    const speed =
        Number(
            vehicle.speed
        );

    const distance =
        Number(
            vehicle.distance_km
        );

    const displayName =
        vehicle.displayName
        ||
        getVehicleDisplayName(
            vehicle.vehicle_code
        );

    const recommendationDistanceHtml =
        (
            recommendationModeActive
            &&
            Number.isFinite(
                distance
            )
        )
            ? `
                <div class="detail-item">

                    <div class="detail-label">
                        Distanță față de incident
                    </div>

                    <div class="detail-value">
                        ${escapeHtml(
                            distance.toFixed(
                                3
                            )
                        )} km
                    </div>

                </div>
            `
            : "";

    details.innerHTML = `
        <div class="details-grid">

            <div class="detail-item">

                <div class="detail-label">
                    Vehicul
                </div>

                <div class="detail-value">
                    ${escapeHtml(
                        displayName
                    )}
                </div>

            </div>

            <div class="detail-item">

                <div class="detail-label">
                    Cod vehicul
                </div>

                <div class="detail-value">
                    ${escapeHtml(
                        vehicle.vehicle_code
                        ||
                        "-"
                    )}
                </div>

            </div>

            <div class="detail-item">

                <div class="detail-label">
                    Tip
                </div>

                <div class="detail-value">
                    ${escapeHtml(
                        getReadableStatus(
                            vehicle.vehicle_type
                        )
                    )}
                </div>

            </div>

            <div class="detail-item">

                <div class="detail-label">
                    Stare
                </div>

                <div
                    class="
                        detail-value
                        status-${escapeHtml(
                            String(
                                vehicle.status
                                ||
                                ""
                            ).toLowerCase()
                        )}
                    "
                >
                    ${escapeHtml(
                        getReadableStatus(
                            vehicle.status
                        )
                    )}
                </div>

            </div>

            <div class="detail-item">

                <div class="detail-label">
                    Viteză
                </div>

                <div class="detail-value">
                    ${
                        Number.isFinite(
                            speed
                        )
                            ? `${formatNumber(
                                speed,
                                2
                            )} km/h`
                            : "-"
                    }
                </div>

            </div>

            <div class="detail-item">

                <div class="detail-label">
                    Latitudine
                </div>

                <div class="detail-value">
                    ${formatCoordinate(
                        latitude
                    )}
                </div>

            </div>

            <div class="detail-item">

                <div class="detail-label">
                    Longitudine
                </div>

                <div class="detail-value">
                    ${formatCoordinate(
                        longitude
                    )}
                </div>

            </div>

            <div class="detail-item">

                <div class="detail-label">
                    Ultima actualizare
                </div>

                <div class="detail-value">
                    ${escapeHtml(
                        vehicle.updated_at
                        ??
                        "-"
                    )}
                </div>

            </div>

            ${recommendationDistanceHtml}

        </div>
    `;

}


/* =====================================
   RESETARE DETALII VEHICUL
===================================== */

function resetVehicleDetails() {

    const details =
        document.getElementById(
            "vehicle-details"
        );

    if (details) {

        details.innerHTML = `
            <p class="empty-message">
                Selectează un vehicul pentru a vedea detaliile acestuia.
            </p>
        `;

    }

}