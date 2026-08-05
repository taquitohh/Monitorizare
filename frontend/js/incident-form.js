/* =====================================
   INITIALIZE INCIDENT FORM
===================================== */

function initializeIncidentForm() {

    const form =
        document.getElementById(
            "incident-form"
        );

    const incidentName =
        document.getElementById(
            "incident-name"
        );

    const incidentType =
        document.getElementById(
            "incident-type"
        );

    const incidentPriority =
        document.getElementById(
            "incident-priority"
        );

    const requiredVehicle =
        document.getElementById(
            "required-vehicle"
        );

    const incidentDetails =
        document.getElementById(
            "incident-details"
        );

    const incidentDetailsCount =
        document.getElementById(
            "incident-details-count"
        );

    const submitButton =
        document.getElementById(
            "submit-incident-button"
        );

    const formStatus =
        document.querySelector(
            ".incident-form-status"
        );

    if (
        !form ||
        !incidentName ||
        !incidentType ||
        !incidentPriority ||
        !requiredVehicle ||
        !incidentDetails ||
        !incidentDetailsCount ||
        !submitButton
    ) {

        return;

    }

    incidentType.addEventListener(
        "change",
        function () {

            updateRequiredVehicle(
                incidentType,
                requiredVehicle
            );

        }
    );

    incidentDetails.addEventListener(
        "input",
        function () {

            incidentDetailsCount.textContent =
                `${this.value.length} / 1000`;

        }
    );

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const selectedOption =
                incidentType.options[
                    incidentType.selectedIndex
                ];

            const requiredVehicleType =
                selectedOption
                    .dataset
                    .vehicleType;

            const title =
                incidentName
                    .value
                    .trim();

            const selectedIncidentType =
                incidentType.value;

            const priority =
                incidentPriority.value;

            const details =
                incidentDetails
                    .value
                    .trim();

            if (!title) {

                alert(
                    "Te rugăm să introduci numele evenimentului."
                );

                incidentName.focus();

                return;

            }

            if (
                !selectedIncidentType ||
                !requiredVehicleType
            ) {

                alert(
                    "Te rugăm să selectezi un tip de incident."
                );

                incidentType.focus();

                return;

            }

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Se salvează...";

            if (formStatus) {

                formStatus.textContent =
                    "Se salvează...";

            }

            try {

                const result =
                    await window.createIncident({
                        title:
                            title,

                        incident_type:
                            selectedIncidentType,

                        required_vehicle_type:
                            requiredVehicleType,

                        priority:
                            priority,

                        details:
                            details
                    });

                const incident =
                    result.incident;

                activeIncidentId =
                    incident.id;

                activeIncidentCode =
                    incident.incident_code;

                activeIncidentLocation =
                    null;

                activeRouteId =
                    null;

                recommendationModeActive =
                    false;

                recommendedVehicle =
                    null;

                recommendedVehicleDistance =
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

                form.reset();

                if (formStatus) {

                    formStatus.textContent =
                        "Selectează locația";

                }

                showVehiclesSidebar();

                startIncidentLocationSelection(
                    incident
                );

            }

            catch (error) {

                console.error(
                    "Incident save error:",
                    error
                );

                alert(
                    error.message
                );

                if (formStatus) {

                    formStatus.textContent =
                        "Salvarea a eșuat";

                }

            }

            finally {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Salvează incidentul";

            }

        }
    );

    form.addEventListener(
        "reset",
        function () {

            window.setTimeout(
                function () {

                    requiredVehicle.className =
                        "required-vehicle";

                    requiredVehicle.textContent =
                        "Selectează un tip de incident";

                    incidentDetailsCount.textContent =
                        "0 / 1000";

                },
                0
            );

        }
    );

}


/* =====================================
   UPDATE REQUIRED VEHICLE
===================================== */

function updateRequiredVehicle(
    incidentType,
    requiredVehicle
) {

    const selectedOption =
        incidentType.options[
            incidentType.selectedIndex
        ];

    const vehicleType =
        selectedOption
            .dataset
            .vehicleType;

    requiredVehicle.className =
        "required-vehicle";

    if (!vehicleType) {

        requiredVehicle.textContent =
            "Selectează un tip de incident";

        return;

    }

    const labels = {
        police:
            "Vehicul de poliție",

        ambulance:
            "Ambulanță",

        fire:
            "Vehicul de pompieri"
    };

    requiredVehicle.classList.add(
        vehicleType
    );

    requiredVehicle.textContent =
        labels[vehicleType]
        ||
        vehicleType;

}