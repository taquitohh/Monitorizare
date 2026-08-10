/* =====================================
   INITIALIZARE PANOU RECOMANDARE
===================================== */

function initializeRecommendationPanel() {

    const confirmButton =
        document.getElementById(
            "confirm-assignment-button"
        );

    const cancelButton =
        document.getElementById(
            "cancel-assignment-button"
        );

    if (
        !confirmButton ||
        !cancelButton
    ) {

        return;

    }

    confirmButton.addEventListener(
        "click",
        confirmRecommendedVehicle
    );

    cancelButton.addEventListener(
        "click",
        cancelRecommendedVehicle
    );

}


/* =====================================
   ÎNCĂRCARE VEHICULE RECOMANDATE
===================================== */

async function loadRecommendedVehicle(
    incidentId
) {

    const panel =
        document.getElementById(
            "recommendation-panel"
        );

    const status =
        document.getElementById(
            "recommendation-status"
        );

    const content =
        document.getElementById(
            "recommendation-content"
        );

    const confirmButton =
        document.getElementById(
            "confirm-assignment-button"
        );

    if (
        !panel ||
        !status ||
        !content ||
        !confirmButton
    ) {

        return;

    }

    panel.hidden =
        false;

    status.textContent =
        "Se caută...";

    confirmButton.disabled =
        true;

    content.innerHTML = `
        <p>
            Se caută cele mai apropiate vehicule disponibile...
        </p>
    `;

    try {

        const result =
            await window
                .getRecommendedVehicle(
                    incidentId
                );

        recommendedVehicles =
            Array.isArray(
                result.vehicles
            )
                ? result.vehicles
                : [];

        if (
            recommendedVehicles.length === 0
        ) {

            throw new Error(
                "Nu a fost găsit niciun vehicul disponibil."
            );

        }

        recommendedVehicles =
            recommendedVehicles.map(
                function (
                    vehicle
                ) {

                    return {
                        ...vehicle,

                        displayName:
                            getVehicleDisplayName(
                                vehicle.vehicle_code
                            ),

                        distance_km:
                            Number(
                                vehicle.distance_km
                            )
                    };

                }
            );

        recommendedVehicle =
            recommendedVehicles[0];

        recommendedVehicleDistance =
            recommendedVehicle
                .distance_km;

        recommendationModeActive =
            true;

        selectedVehicleId =
            null;

        const missingResources =
            Array.isArray(
                result.missing_resources
            )
                ? result.missing_resources
                : [];

        if (
            missingResources.length > 0
        ) {

            status.textContent =
                "Resurse insuficiente";

            confirmButton.disabled =
                true;

        }

        else {

            status.textContent =
                `${recommendedVehicles.length} vehicule`;

            confirmButton.disabled =
                false;

        }

        const vehicleCards =
            recommendedVehicles.map(
                function (
                    vehicle
                ) {

                    return `
                        <div class="recommended-vehicle-card">

                            <div>
                                <div class="recommended-label">
                                    Vehicul
                                </div>

                                <div class="recommended-value">
                                    ${escapeHtml(
                                        vehicle.displayName
                                    )}
                                </div>
                            </div>

                            <div>
                                <div class="recommended-label">
                                    Tip
                                </div>

                                <div class="recommended-value">
                                    ${escapeHtml(
                                        getReadableStatus(
                                            vehicle.vehicle_type
                                        )
                                    )}
                                </div>
                            </div>

                            <div>
                                <div class="recommended-label">
                                    Stare
                                </div>

                                <div class="recommended-value status-active">
                                    ● Disponibil
                                </div>
                            </div>

                            <div>
                                <div class="recommended-label">
                                    Distanță directă
                                </div>

                                <div class="recommended-value">
                                    ${
                                        Number.isFinite(
                                            vehicle.distance_km
                                        )
                                            ?
                                            vehicle.distance_km
                                                .toFixed(3)
                                            :
                                            "-"
                                    } km
                                </div>
                            </div>

                        </div>
                    `;

                }
            )
            .join("");

        let missingHtml =
            "";

        if (
            missingResources.length > 0
        ) {

            const labels = {
                police:
                    "Poliție",

                ambulance:
                    "Ambulanță",

                fire:
                    "Pompieri"
            };

            const missingItems =
                missingResources.map(
                    function (
                        resource
                    ) {

                        return `
                            <li>
                                ${escapeHtml(
                                    labels[
                                        resource.vehicle_type
                                    ]
                                    ||
                                    resource.vehicle_type
                                )}:
                                lipsesc
                                ${escapeHtml(
                                    resource.missing_quantity
                                )}
                            </li>
                        `;

                    }
                )
                .join("");

            missingHtml = `
                <div class="recommendation-error">
                    <strong>
                        Nu există suficiente vehicule disponibile.
                    </strong>

                    <ul>
                        ${missingItems}
                    </ul>
                </div>
            `;

        }

        content.innerHTML = `
            ${vehicleCards}
            ${missingHtml}
        `;

        refreshVehicleView();

        if (recommendedVehicle) {

            displayVehicleDetails(
                recommendedVehicle
            );

            focusVehicle(
                recommendedVehicle
            );

        }

    }

    catch (error) {

        console.error(
            "Eroare la recomandarea vehiculelor:",
            error
        );

        recommendedVehicle =
            null;

        recommendedVehicles =
            [];

        recommendedVehicleDistance =
            null;

        recommendationModeActive =
            false;

        selectedVehicleId =
            null;

        status.textContent =
            "Indisponibil";

        confirmButton.disabled =
            true;

        content.innerHTML = `
            <p class="recommendation-error">
                ${escapeHtml(
                    error.message
                )}
            </p>
        `;

        refreshVehicleView();

    }

}


/* =====================================
   CONFIRMARE ASIGNARE
===================================== */

async function confirmRecommendedVehicle() {

    if (
        !Array.isArray(
            recommendedVehicles
        )
        ||
        recommendedVehicles.length === 0
        ||
        !activeIncidentId
        ||
        assignmentSaving
    ) {

        return;

    }

    const confirmButton =
        document.getElementById(
            "confirm-assignment-button"
        );

    const cancelButton =
        document.getElementById(
            "cancel-assignment-button"
        );

    const status =
        document.getElementById(
            "recommendation-status"
        );

    assignmentSaving =
        true;

    if (confirmButton) {

        confirmButton.disabled =
            true;

        confirmButton.textContent =
            "Se asignează...";

    }

    if (cancelButton) {

        cancelButton.disabled =
            true;

    }

    if (status) {

        status.textContent =
            "Se asignează...";

    }

    try {

        const vehicleIds =
            recommendedVehicles.map(
                function (
                    vehicle
                ) {

                    return vehicle.id;

                }
            );

        const result =
            await window
                .assignVehicleToIncident(
                    activeIncidentId,
                    vehicleIds
                );

        activeRouteId =
            activeIncidentId;

        await loadVehicles();

        await loadIncidents();

        const assignedCount =
            Array.isArray(
                result.assignments
            )
                ? result.assignments.length
                : vehicleIds.length;

        recommendationModeActive =
            false;

        selectedVehicleId =
            null;

        recommendedVehicle =
            null;

        recommendedVehicles =
            [];

        recommendedVehicleDistance =
            null;

        hideRecommendationPanel();

        resetVehicleDetails();

        showVehiclesSidebar();

        alert(
            `${assignedCount} vehicule au fost asignate incidentului.`
        );

    }

    catch (error) {

        console.error(
            "Eroare la asignarea vehiculelor:",
            error
        );

        alert(
            error.message
        );

        if (status) {

            status.textContent =
                "Operațiunea a eșuat";

        }

    }

    finally {

        assignmentSaving =
            false;

        if (confirmButton) {

            confirmButton.disabled =
                false;

            confirmButton.textContent =
                "Confirmă asignarea";

        }

        if (cancelButton) {

            cancelButton.disabled =
                false;

        }

    }

}


/* =====================================
   ANULARE RECOMANDARE
===================================== */

function cancelRecommendedVehicle() {

    if (assignmentSaving) {

        return;

    }

    recommendationModeActive =
        false;

    recommendedVehicle =
        null;

    recommendedVehicles =
        [];

    recommendedVehicleDistance =
        null;

    selectedVehicleId =
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

    refreshVehicleView();

}


/* =====================================
   ASCUNDERE PANOU
===================================== */

function hideRecommendationPanel() {

    const panel =
        document.getElementById(
            "recommendation-panel"
        );

    if (panel) {

        panel.hidden =
            true;

    }

}