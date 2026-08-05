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
        "Se caută...";

    confirmButton.disabled =
        true;

    content.innerHTML = `
        <p>
            Se caută cel mai apropiat vehicul eligibil...
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
                "Serverul nu a returnat un vehicul."
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
            "Recomandat";

        confirmButton.disabled =
            false;

        content.innerHTML = `
            <div class="recommended-vehicle-card">

                <div>

                    <div class="recommended-label">
                        Vehicul
                    </div>

                    <div class="recommended-value">
                        ${escapeHtml(
                            recommendedVehicle.displayName
                        )}
                    </div>

                </div>

                <div>

                    <div class="recommended-label">
                        Tip
                    </div>

                    <div class="recommended-value">
                        ${escapeHtml(
                            recommendedVehicle.vehicle_type
                        )}
                    </div>

                </div>

                <div>

                    <div class="recommended-label">
                        Stare
                    </div>

                    <div
                        class="recommended-value status-active"
                    >
                        ● ${escapeHtml(
                            recommendedVehicle.status
                        )}
                    </div>

                </div>

                <div>

                    <div class="recommended-label">
                        Distanță directă
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
            "Eroare vehicul recomandat:",
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
            "Se atribuie...";

    }

    if (cancelButton) {

        cancelButton.disabled =
            true;

    }

    if (status) {

        status.textContent =
            "Se atribuie...";

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
                "Se calculează ruta...";

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
            `Vehiculul a fost atribuit la ${incident.incident_code}.\n\n`
            +
            "Misiunea este disponibilă în secțiunea Incidente."
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