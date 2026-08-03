/* =====================================
   INITIALIZE RECOMMENDATION PANEL
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
   LOAD RECOMMENDED VEHICLE
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
        "Searching...";

    confirmButton.disabled =
        true;

    content.innerHTML = `
        <p>
            Searching for the closest eligible vehicle...
        </p>
    `;

    try {

        const result =
            await window.getRecommendedVehicle(
                incidentId
            );

        recommendedVehicle =
            result.vehicle;

        if (!recommendedVehicle) {

            throw new Error(
                "The server did not return a vehicle."
            );

        }

        recommendedVehicle.displayName =
            getVehicleDisplayName(
                recommendedVehicle.vehicle_code
            );

        recommendedVehicleDistance =
            Number(
                result.distance_km
            );

        recommendationModeActive =
            true;

        selectedVehicleId =
            recommendedVehicle.vehicle_code;

        status.textContent =
            "Recommended";

        confirmButton.disabled =
            false;

        content.innerHTML = `
            <div class="recommended-vehicle-card">

                <div>

                    <div class="recommended-label">
                        Vehicle
                    </div>

                    <div class="recommended-value">
                        ${escapeHtml(
                            recommendedVehicle.displayName
                        )}
                    </div>

                </div>

                <div>

                    <div class="recommended-label">
                        Type
                    </div>

                    <div class="recommended-value">
                        ${escapeHtml(
                            recommendedVehicle.vehicle_type
                        )}
                    </div>

                </div>

                <div>

                    <div class="recommended-label">
                        Status
                    </div>

                    <div
                        class="
                            recommended-value
                            status-active
                        "
                    >
                        ● ${escapeHtml(
                            recommendedVehicle.status
                        )}
                    </div>

                </div>

                <div>

                    <div class="recommended-label">
                        Direct distance
                    </div>

                    <div class="recommended-value">
                        ${
                            Number.isFinite(
                                recommendedVehicleDistance
                            )
                                ?
                                recommendedVehicleDistance
                                    .toFixed(3)
                                :
                                "-"
                        } km
                    </div>

                </div>

            </div>
        `;

        refreshVehicleView();

        displayVehicleDetails(
            recommendedVehicle
        );

        focusVehicle(
            recommendedVehicle
        );

    }

    catch (error) {

        console.error(
            "Recommended vehicle error:",
            error
        );

        recommendedVehicle =
            null;

        recommendedVehicleDistance =
            null;

        recommendationModeActive =
            false;

        selectedVehicleId =
            null;

        status.textContent =
            "Unavailable";

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
   CONFIRM RECOMMENDED VEHICLE
===================================== */

async function confirmRecommendedVehicle() {

    if (
        !recommendedVehicle ||
        !activeIncidentId ||
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
            "Assigning...";

    }

    if (cancelButton) {

        cancelButton.disabled =
            true;

    }

    if (status) {

        status.textContent =
            "Assigning...";

    }

    try {

        const result =
            await window.assignVehicleToIncident(
                activeIncidentId,
                recommendedVehicle.id
            );

        const incident =
            result.incident;

        if (status) {

            status.textContent =
                "Calculating route...";

        }

        await window.getIncidentRoute(
            activeIncidentId
        );

        activeRouteId =
            incident.id;

        await loadIncidents();

        recommendationModeActive =
            false;

        selectedVehicleId =
            null;

        recommendedVehicle =
            null;

        recommendedVehicleDistance =
            null;

        hideRecommendationPanel();

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

        showVehiclesSidebar();

        alert(
            `Vehicle assigned to ${incident.incident_code}.\n\n`
            +
            "The mission is available in Incidents."
        );

    }

    catch (error) {

        console.error(
            "Vehicle assignment or route error:",
            error
        );

        alert(
            error.message
        );

        if (status) {

            status.textContent =
                "Operation failed";

        }

    }

    finally {

        assignmentSaving =
            false;

        if (confirmButton) {

            confirmButton.disabled =
                false;

            confirmButton.textContent =
                "Confirm assignment";

        }

        if (cancelButton) {

            cancelButton.disabled =
                false;

        }

    }

}


/* =====================================
   CANCEL RECOMMENDED VEHICLE
===================================== */

function cancelRecommendedVehicle() {

    if (assignmentSaving) {

        return;

    }

    recommendationModeActive =
        false;

    recommendedVehicle =
        null;

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
   HIDE RECOMMENDATION PANEL
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