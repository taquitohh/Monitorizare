/* =====================================
   INIȚIALIZARE FORMULAR INCIDENT
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

    const incidentTypeToggle =
        document.getElementById(
            "incident-type-toggle"
        );

    const incidentTypeToggleText =
        document.getElementById(
            "incident-type-toggle-text"
        );

    const incidentTypeOptions =
        document.getElementById(
            "incident-type-options"
        );

    const selectedIncidentTypesContainer =
        document.getElementById(
            "selected-incident-types"
        );

    const incidentTypeCheckboxes =
        Array.from(
            document.querySelectorAll(
                ".incident-type-option input[type='checkbox']"
            )
        );

    const incidentPriority =
        document.getElementById(
            "incident-priority"
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

    /* ===========================
            RESOURCE INPUTS
            =========================== */

            const resourceInputs =
                Array.from(
                    document.querySelectorAll(
                        ".incident-resource-quantity"
                    )
                );

            const resourceStepperButtons =
                Array.from(
                    document.querySelectorAll(
                        ".resource-stepper-button"
                    )
                );


            resourceInputs.forEach(
                function (input) {

                    input.addEventListener(
                        "input",
                        function () {

                            let value =
                                parseInt(
                                    input.value,
                                    10
                                );

                            if (
                                Number.isNaN(
                                    value
                                )
                            ) {

                                value = 0;

                            }

                            value =
                                Math.max(
                                    0,
                                    Math.min(
                                        20,
                                        value
                                    )
                                );

                            input.value = value;

                            updateRequiredVehicleSummary();

                        }
                    );

                }
            );


            resourceStepperButtons.forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const input =
                                document.getElementById(
                                    button.dataset.target
                                );

                            if (!input) {

                                return;

                            }

                            let value =
                                parseInt(
                                    input.value,
                                    10
                                );

                            if (
                                Number.isNaN(
                                    value
                                )
                            ) {

                                value = 0;

                            }

                            if (
                                button.dataset.action ===
                                "increase"
                            ) {

                                value++;

                            }

                            else {

                                value--;

                            }

                            value =
                                Math.max(
                                    0,
                                    Math.min(
                                        20,
                                        value
                                    )
                                );

                            input.value =
                                value;

                            input.dispatchEvent(
                                new Event(
                                    "input",
                                    {
                                        bubbles: true
                                    }
                                )
                            );

                        }
                    );

                }
            );

    if (
        !form
        ||
        !incidentName
        ||
        !incidentTypeToggle
        ||
        !incidentTypeToggleText
        ||
        !incidentTypeOptions
        ||
        !selectedIncidentTypesContainer
        ||
        incidentTypeCheckboxes.length === 0
        ||
        !incidentPriority
        ||
        !incidentDetails
        ||
        !incidentDetailsCount
        ||
        !submitButton
    ) {

        console.error(
            "Formularul incidentului nu poate fi inițializat."
        );

        return;

    }


    /* =====================================
       DESCHIDERE / ÎNCHIDERE SELECTOR
    ===================================== */

    incidentTypeToggle.addEventListener(
        "click",
        function () {

            const shouldOpen =
                incidentTypeOptions.hidden;

            incidentTypeOptions.hidden =
                !shouldOpen;

            incidentTypeToggle.setAttribute(
                "aria-expanded",
                String(
                    shouldOpen
                )
            );

        }
    );


    /* =====================================
       SELECTAREA TIPURILOR
    ===================================== */

    incidentTypeCheckboxes.forEach(
        function (checkbox) {

            checkbox.addEventListener(
                "change",
                function () {

                    updateIncidentTypeSelection(
                        incidentTypeCheckboxes
                    );

                    applyResourcesFromIncidentTypes(
                        incidentTypeCheckboxes,
                        resourceInputs
                    );

                    updateRequiredResourcesSummary(
                        resourceInputs
                    );

                }
            );

        }
    );


    /* =====================================
       ÎNCHIDERE LA CLICK ÎN EXTERIOR
    ===================================== */

    document.addEventListener(
        "click",
        function (event) {

            const selector =
                document.getElementById(
                    "incident-type-selector"
                );

            if (
                !selector
                ||
                selector.contains(
                    event.target
                )
            ) {

                return;

            }

            closeIncidentTypeSelector();

        }
    );


    /* =====================================
       ÎNCHIDERE CU ESCAPE
    ===================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeIncidentTypeSelector();

            }

        }
    );


    /* =====================================
       CANTITĂȚILE DE VEHICULE
    ===================================== */

    resourceInputs.forEach(
        function (input) {

            input.addEventListener(
                "input",
                function () {

                    normalizeResourceQuantity(
                        input
                    );

                    updateRequiredResourcesSummary(
                        resourceInputs
                    );

                }
            );

            input.addEventListener(
                "change",
                function () {

                    normalizeResourceQuantity(
                        input
                    );

                    updateRequiredResourcesSummary(
                        resourceInputs
                    );

                }
            );

        }
    );


    /* =====================================
       NUMĂR CARACTERE DETALII
    ===================================== */

    incidentDetails.addEventListener(
        "input",
        function () {

            incidentDetailsCount.textContent =
                `${this.value.length} / 1000`;

        }
    );


    /* =====================================
       SALVARE INCIDENT
    ===================================== */

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const title =
                incidentName
                    .value
                    .trim();

            const selectedIncidentTypes =
                collectSelectedIncidentTypes(
                    incidentTypeCheckboxes
                );

            const priority =
                incidentPriority.value;

            const details =
                incidentDetails
                    .value
                    .trim();

            const requiredResources =
                collectRequiredResources(
                    resourceInputs
                );

            if (!title) {

                alert(
                    "Introdu numele evenimentului."
                );

                incidentName.focus();

                return;

            }

            if (
                selectedIncidentTypes.length === 0
            ) {

                alert(
                    "Selectează cel puțin un tip de incident."
                );

                incidentTypeToggle.focus();

                return;

            }

            if (
                requiredResources.length === 0
            ) {

                alert(
                    "Selectează cel puțin un vehicul necesar."
                );

                const firstResourceInput =
                    resourceInputs[0];

                if (firstResourceInput) {

                    firstResourceInput.focus();

                }

                return;

            }

            const totalRequestedVehicles =
                requiredResources.reduce(
                    function (
                        total,
                        resource
                    ) {

                        return (
                            total
                            +
                            resource.quantity
                        );

                    },
                    0
                );

            if (
                totalRequestedVehicles > 30
            ) {

                alert(
                    "Un incident nu poate solicita mai mult de 30 de vehicule în total."
                );

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

                const primaryVehicleType =
                    requiredResources[0]
                        .vehicle_type;

                const result =
                    await window.createIncident({
                        title:
                            title,

                        incident_type:
                            selectedIncidentTypes[0],

                        incident_types:
                            selectedIncidentTypes,

                        required_vehicle_type:
                            primaryVehicleType,

                        required_resources:
                            requiredResources,

                        priority:
                            priority,

                        details:
                            details
                    });

                const incident =
                    result.incident;

                if (
                    !incident
                    ||
                    !incident.id
                ) {

                    throw new Error(
                        "Serverul nu a returnat incidentul creat."
                    );

                }

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

                recommendedVehicles =
                    [];

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

                resetIncidentTypeSelection(
                    incidentTypeCheckboxes
                );

                resetIncidentResourceInputs(
                    resourceInputs
                );

                incidentDetailsCount.textContent =
                    "0 / 1000";

                updateRequiredResourcesSummary(
                    resourceInputs
                );

                if (formStatus) {

                    formStatus.textContent =
                        "Selectează locația";

                }

                startIncidentLocationSelection(
                    incident
                );

            }

            catch (error) {

                console.error(
                    "Eroare la salvarea incidentului:",
                    error
                );

                alert(
                    error.message
                    ||
                    "Incidentul nu a putut fi salvat."
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


    /* =====================================
       RESETARE FORMULAR
    ===================================== */

    form.addEventListener(
        "reset",
        function () {

            window.setTimeout(
                function () {

                    resetIncidentTypeSelection(
                        incidentTypeCheckboxes
                    );

                    resetIncidentResourceInputs(
                        resourceInputs
                    );

                    incidentDetailsCount.textContent =
                        "0 / 1000";

                    updateRequiredResourcesSummary(
                        resourceInputs
                    );

                    if (formStatus) {

                        formStatus.textContent =
                            "Doar schiță";

                    }

                },
                0
            );

        }
    );

    updateIncidentTypeSelection(
        incidentTypeCheckboxes
    );

    updateRequiredResourcesSummary(
        resourceInputs
    );

}


/* =====================================
   COLECTARE TIPURI INCIDENT
===================================== */

function collectSelectedIncidentTypes(
    checkboxes
) {

    return checkboxes
        .filter(
            function (checkbox) {

                return checkbox.checked;

            }
        )
        .map(
            function (checkbox) {

                return String(
                    checkbox.value
                    ||
                    ""
                )
                    .trim()
                    .toLowerCase();

            }
        )
        .filter(Boolean);

}


/* =====================================
   ACTUALIZARE AFIȘARE TIPURI
===================================== */

function updateIncidentTypeSelection(
    checkboxes
) {

    const toggleText =
        document.getElementById(
            "incident-type-toggle-text"
        );

    const selectedContainer =
        document.getElementById(
            "selected-incident-types"
        );

    const selected =
        checkboxes.filter(
            function (checkbox) {

                return checkbox.checked;

            }
        );

    if (toggleText) {

        if (
            selected.length === 0
        ) {

            toggleText.textContent =
                "Selectează unul sau mai multe tipuri";

        }

        else if (
            selected.length === 1
        ) {

            toggleText.textContent =
                selected[0].dataset.label
                ||
                selected[0].value;

        }

        else {

            toggleText.textContent =
                `${selected.length} tipuri selectate`;

        }

    }

    if (!selectedContainer) {

        return;

    }

    if (
        selected.length === 0
    ) {

        selectedContainer.innerHTML =
            "";

        return;

    }

    selectedContainer.innerHTML =
        selected.map(
            function (checkbox) {

                const label =
                    checkbox.dataset.label
                    ||
                    checkbox.value;

                return `
                    <span class="selected-incident-type">
                        ${escapeHtml(
                            label
                        )}
                    </span>
                `;

            }
        ).join("");

}


/* =====================================
   RESURSE AUTOMATE DUPĂ TIPURI
===================================== */

function applyResourcesFromIncidentTypes(
    checkboxes,
    resourceInputs
) {

    const selectedVehicleTypes =
        new Set(
            checkboxes
                .filter(
                    function (checkbox) {

                        return checkbox.checked;

                    }
                )
                .map(
                    function (checkbox) {

                        return (
                            checkbox
                                .dataset
                                .vehicleType
                        );

                    }
                )
                .filter(Boolean)
        );

    resourceInputs.forEach(
        function (input) {

            const vehicleType =
                input.dataset.vehicleType;

            if (
                selectedVehicleTypes.has(
                    vehicleType
                )
            ) {

                const currentQuantity =
                    Number.parseInt(
                        input.value,
                        10
                    );

                if (
                    !Number.isInteger(
                        currentQuantity
                    )
                    ||
                    currentQuantity < 1
                ) {

                    input.value =
                        "1";

                }

            }

            else {

                input.value =
                    "0";

            }

        }
    );

}


/* =====================================
   COLECTARE RESURSE
===================================== */

function collectRequiredResources(
    resourceInputs
) {

    const resources = [];

    resourceInputs.forEach(
        function (input) {

            const vehicleType =
                String(
                    input.dataset.vehicleType
                    ||
                    ""
                )
                    .trim()
                    .toLowerCase();

            const quantity =
                Number.parseInt(
                    input.value,
                    10
                );

            if (
                !vehicleType
                ||
                !Number.isInteger(
                    quantity
                )
                ||
                quantity < 1
            ) {

                return;

            }

            resources.push({
                vehicle_type:
                    vehicleType,

                quantity:
                    quantity
            });

        }
    );

    return resources;

}


/* =====================================
   NORMALIZARE CANTITATE
===================================== */

function normalizeResourceQuantity(
    input
) {

    let quantity =
        Number.parseInt(
            input.value,
            10
        );

    if (
        !Number.isInteger(
            quantity
        )
        ||
        quantity < 0
    ) {

        quantity =
            0;

    }

    if (
        quantity > 20
    ) {

        quantity =
            20;

    }

    input.value =
        String(
            quantity
        );

}


/* =====================================
   RESETARE RESURSE
===================================== */

function resetIncidentResourceInputs(
    resourceInputs
) {

    resourceInputs.forEach(
        function (input) {

            input.value =
                "0";

        }
    );

}


/* =====================================
   SUMAR RESURSE
===================================== */

function updateRequiredResourcesSummary(
    resourceInputs
) {

    const summary =
        document.getElementById(
            "required-vehicle"
        );

    if (!summary) {

        return;

    }

    const resources =
        collectRequiredResources(
            resourceInputs
        );

    summary.className =
        "required-vehicle resource-summary";

    if (
        resources.length === 0
    ) {

        summary.textContent =
            "Nu a fost selectat niciun vehicul.";

        summary.classList.add(
            "empty"
        );

        return;

    }

    const labels = {
        police:
            "Poliție",

        ambulance:
            "Ambulanță",

        fire:
            "Pompieri"
    };

    const descriptions =
        resources.map(
            function (resource) {

                return (
                    `${
                        labels[
                            resource.vehicle_type
                        ]
                        ||
                        resource.vehicle_type
                    }: ${resource.quantity}`
                );

            }
        );

    summary.textContent =
        `Resurse selectate: ${descriptions.join(" • ")}`;

    if (
        resources.length === 1
    ) {

        summary.classList.add(
            resources[0]
                .vehicle_type
        );

    }

    else {

        summary.classList.add(
            "multiple"
        );

    }

}


/* =====================================
   RESETARE TIPURI INCIDENT
===================================== */

function resetIncidentTypeSelection(
    checkboxes
) {

    checkboxes.forEach(
        function (checkbox) {

            checkbox.checked =
                false;

        }
    );

    updateIncidentTypeSelection(
        checkboxes
    );

    closeIncidentTypeSelector();

}


/* =====================================
   ÎNCHIDERE SELECTOR
===================================== */

function closeIncidentTypeSelector() {

    const options =
        document.getElementById(
            "incident-type-options"
        );

    const toggle =
        document.getElementById(
            "incident-type-toggle"
        );

    if (options) {

        options.hidden =
            true;

    }

    if (toggle) {

        toggle.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}