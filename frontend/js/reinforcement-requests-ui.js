/* =====================================
   CONFIGURARE CERERI DE ÎNTĂRIRI
===================================== */

const REINFORCEMENT_REQUEST_REFRESH_INTERVAL = 3000;

let reinforcementRequestRefreshTimer = null;
let reinforcementRequestDecisionSaving = false;
let selectedReinforcementRequest = null;


/* =====================================
   ÎNCĂRCARE CERERI
===================================== */

async function loadReinforcementRequests() {

    if (reinforcementRequestsLoading) {
        return;
    }

    reinforcementRequestsLoading = true;

    try {

        const requests =
            await window.getReinforcementRequests();

        const receivedRequests =
            Array.isArray(requests)
                ?
                requests
                :
                [];

        /*
         * IMPORTANT:
         *
         * Fiecare cerere are propriul ID și trebuie
         * păstrată separat.
         *
         * Nu mai grupăm după incident + vehicul + status,
         * deoarece același șofer poate trimite oricâte
         * cereri pentru același incident.
         *
         * Eliminăm doar eventualele duplicate cu ACELAȘI ID.
         */
        const uniqueRequests =
            new Map();

        receivedRequests.forEach(
            function (
                reinforcementRequest
            ) {

                const requestId =
                    Number(
                        reinforcementRequest?.id
                    );

                if (
                    !Number.isFinite(
                        requestId
                    )
                ) {
                    return;
                }

                uniqueRequests.set(
                    requestId,
                    reinforcementRequest
                );

            }
        );

        allReinforcementRequests =
            Array.from(
                uniqueRequests.values()
            );

        /*
         * Cele mai noi cereri apar primele.
         */
        allReinforcementRequests.sort(
            function (
                firstRequest,
                secondRequest
            ) {

                return (
                    Number(
                        secondRequest?.id
                        ||
                        0
                    )
                    -
                    Number(
                        firstRequest?.id
                        ||
                        0
                    )
                );

            }
        );

        /*
         * Dacă avem deschisă o cerere,
         * actualizăm obiectul cu datele noi
         * primite de la server.
         */
        if (
            selectedReinforcementRequestId
        ) {

            selectedReinforcementRequest =
                allReinforcementRequests.find(
                    function (
                        requestItem
                    ) {

                        return (
                            Number(
                                requestItem.id
                            )
                            ===
                            Number(
                                selectedReinforcementRequestId
                            )
                        );

                    }
                )
                ||
                null;

            if (
                selectedReinforcementRequest
            ) {

                renderReinforcementRequestReviewPanel(
                    selectedReinforcementRequest
                );

            }

            else {

                closeReinforcementRequestReviewPanel();

            }

        }

        applyReinforcementRequestFilters();

    }

    catch (error) {

        console.error(
            (
                "Cererile de întăriri "
                + "nu au putut fi încărcate:"
            ),
            error
        );

        displayReinforcementRequestError(
            error.message
        );

    }

    finally {

        reinforcementRequestsLoading =
            false;

    }

}


/* =====================================
   APLICARE FILTRE
===================================== */

function applyReinforcementRequestFilters() {

    filteredReinforcementRequests =
        allReinforcementRequests.filter(
            function (
                reinforcementRequest
            ) {

                const requestStatus =
                    String(
                        reinforcementRequest?.status
                        ||
                        ""
                    ).toLowerCase();

                const requestedVehicleType =
                    String(
                        reinforcementRequest
                            ?.requested_vehicle_type
                        ||
                        reinforcementRequest
                            ?.requested_by_vehicle_type_code
                        ||
                        ""
                    ).toLowerCase();


                /* =====================================
                   FILTRU STARE
                ===================================== */

                let statusMatches =
                    true;

                if (
                    reinforcementRequestFilters.status ===
                    "active"
                ) {

                    statusMatches =
                        (
                            requestStatus ===
                            "pending"
                            ||
                            requestStatus ===
                            "partially_assigned"
                        );

                }

                else if (
                    reinforcementRequestFilters.status ===
                    "archived"
                ) {

                    statusMatches =
                        (
                            requestStatus ===
                            "accepted"
                            ||
                            requestStatus ===
                            "rejected"
                            ||
                            requestStatus ===
                            "completed"
                            ||
                            requestStatus ===
                            "cancelled"
                            ||
                            requestStatus ===
                            "failed"
                        );

                }

                else {

                    statusMatches =
                        true;

                }


                /* =====================================
                   FILTRU TIP VEHICUL
                ===================================== */

                const vehicleTypeMatches =
                    (
                        reinforcementRequestFilters
                            .vehicleType
                        ===
                        "all"
                        ||
                        requestedVehicleType
                        ===
                        reinforcementRequestFilters
                            .vehicleType
                    );


                return (
                    statusMatches
                    &&
                    vehicleTypeMatches
                );

            }
        );

    displayReinforcementRequests();

}


/* =====================================
   AFIȘARE LISTĂ
===================================== */

function displayReinforcementRequests() {

    const requestsList =
        document.getElementById(
            "reinforcement-requests-list"
        );

    if (!requestsList) {
        return;
    }

    requestsList.innerHTML =
        "";

    updateReinforcementRequestCount();

    if (
        filteredReinforcementRequests.length ===
        0
    ) {

        requestsList.innerHTML = `
            <p class="empty-message">
                Nu există cereri de întăriri pentru filtrele selectate.
            </p>
        `;

        return;

    }

    filteredReinforcementRequests.forEach(
        function (
            reinforcementRequest
        ) {

            requestsList.appendChild(
                createReinforcementRequestCard(
                    reinforcementRequest
                )
            );

        }
    );

}


/* =====================================
   CREARE CARD COMPACT
===================================== */

function createReinforcementRequestCard(
    reinforcementRequest
) {

    const card =
        document.createElement(
            "article"
        );

    const requestId =
        Number(
            reinforcementRequest?.id
        );

    const requestStatus =
        String(
            reinforcementRequest?.status
            ||
            ""
        ).toLowerCase();

    const incidentCode =
        reinforcementRequest?.incident_code
        ||
        "-";

    const incidentTitle =
        reinforcementRequest?.incident_title
        ||
        "Incident fără denumire";

    const vehicleCode =
        reinforcementRequest
            ?.requested_by_vehicle_code
        ||
        "-";

    const vehicleType =
        String(
            reinforcementRequest
                ?.requested_vehicle_type
            ||
            reinforcementRequest
                ?.requested_by_vehicle_type_code
            ||
            ""
        ).toLowerCase();

    const incidentPriority =
        getReadableStatus(
            reinforcementRequest
                ?.incident_priority
        );

    const createdAt =
        formatIncidentDate(
            reinforcementRequest
                ?.created_at
        );

    card.className =
        (
            "reinforcement-request-card "
            +
            `status-${requestStatus}`
        );

    card.dataset.requestId =
        String(
            requestId
        );

    if (
        Number(
            selectedReinforcementRequestId
        )
        ===
        requestId
    ) {

        card.classList.add(
            "selected"
        );

    }

    card.innerHTML = `
        <div class="reinforcement-request-card-header">

            <div class="reinforcement-request-card-title">

                <span class="reinforcement-request-label">
                    Cerere de întăriri #${escapeHtml(
                        requestId
                    )}
                </span>

                <h3>
                    ${escapeHtml(
                        incidentCode
                    )}
                </h3>

            </div>

            <span
                class="
                    reinforcement-request-status
                    ${escapeHtml(
                        requestStatus
                    )}
                "
            >
                ${escapeHtml(
                    getReinforcementRequestStatusLabel(
                        requestStatus
                    )
                )}
            </span>

        </div>

        <p class="reinforcement-request-incident-title">
            ${escapeHtml(
                incidentTitle
            )}
        </p>

        <div class="reinforcement-request-compact-details">

            <div class="reinforcement-request-compact-row">

                <span>
                    Vehicul solicitant
                </span>

                <strong>
                    ${escapeHtml(
                        vehicleCode
                    )}
                </strong>

            </div>

            <div class="reinforcement-request-compact-row">

                <span>
                    Tip
                </span>

                <strong>
                    ${escapeHtml(
                        getReinforcementVehicleTypeLabel(
                            vehicleType
                        )
                    )}
                </strong>

            </div>

            <div class="reinforcement-request-compact-row">

                <span>
                    Prioritate
                </span>

                <strong>
                    ${escapeHtml(
                        incidentPriority
                    )}
                </strong>

            </div>

        </div>

        <div class="reinforcement-request-card-footer">

            <span title="${escapeHtml(createdAt)}">
                ${escapeHtml(createdAt)}
            </span>

            <button
                type="button"
                class="
                    reinforcement-request-review-button
                    secondary-button
                "
            >
                ${
                    requestStatus ===
                    "pending"
                        ?
                        "Analizează"
                        :
                        "Vezi detalii"
                }
            </button>

        </div>
    `;

    card.addEventListener(
        "click",
        function (
            event
        ) {

            if (
                event.target.closest(
                    "button"
                )
            ) {

                return;

            }

            selectReinforcementRequest(
                reinforcementRequest,
                false
            );

        }
    );

    const reviewButton =
        card.querySelector(
            ".reinforcement-request-review-button"
        );

    if (reviewButton) {

        reviewButton.addEventListener(
            "click",
            function () {

                selectReinforcementRequest(
                    reinforcementRequest,
                    true
                );

            }
        );

    }

    return card;

}


/* =====================================
   SELECTARE CERERE
===================================== */

function selectReinforcementRequest(
    reinforcementRequest,
    openReviewPanel = true
) {

    if (
        !reinforcementRequest?.id
    ) {
        return;
    }

    selectedReinforcementRequestId =
        reinforcementRequest.id;

    selectedReinforcementRequest =
        reinforcementRequest;

    document
        .querySelectorAll(
            ".reinforcement-request-card"
        )
        .forEach(
            function (
                card
            ) {

                card.classList.toggle(
                    "selected",
                    Number(
                        card.dataset.requestId
                    )
                    ===
                    Number(
                        reinforcementRequest.id
                    )
                );

            }
        );

    focusReinforcementRequestIncident(
        reinforcementRequest
    );

    if (
        openReviewPanel
    ) {

        showReinforcementRequestReviewPanel(
            reinforcementRequest
        );

    }

}


/* =====================================
   CENTRARE INCIDENT PE HARTĂ
===================================== */

function focusReinforcementRequestIncident(
    reinforcementRequest
) {

    const latitude =
        Number(
            reinforcementRequest
                ?.incident_latitude
        );

    const longitude =
        Number(
            reinforcementRequest
                ?.incident_longitude
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

        return;

    }

    activeIncidentId =
        reinforcementRequest
            .incident_id;

    activeIncidentCode =
        reinforcementRequest
            .incident_code;

    activeIncidentLocation = {
        latitude:
            latitude,

        longitude:
            longitude
    };

    if (
        typeof clearIncidentRoute ===
        "function"
    ) {

        clearIncidentRoute();

    }

    if (
        typeof updateVisibleMarkers ===
        "function"
    ) {

        updateVisibleMarkers(
            []
        );

    }

    if (
        typeof resetVehicleDetails ===
        "function"
    ) {

        resetVehicleDetails();

    }

    if (
        typeof displayIncidentLocationMarker ===
        "function"
    ) {

        displayIncidentLocationMarker({
            id:
                reinforcementRequest
                    .incident_id,

            incident_code:
                reinforcementRequest
                    .incident_code,

            title:
                reinforcementRequest
                    .incident_title,

            latitude:
                latitude,

            longitude:
                longitude,

            priority:
                reinforcementRequest
                    .incident_priority,

            status:
                reinforcementRequest
                    .incident_status
        });

    }

}


/* =====================================
   PANOU ANALIZĂ
===================================== */

function showReinforcementRequestReviewPanel(
    reinforcementRequest
) {

    selectedReinforcementRequest =
        reinforcementRequest;

    selectedReinforcementRequestId =
        reinforcementRequest.id;

    const reviewPanel =
        document.getElementById(
            "reinforcement-request-review-panel"
        );

    const vehiclePanel =
        document.getElementById(
            "vehicle-details-panel"
        );

    if (!reviewPanel) {
        return;
    }

    if (vehiclePanel) {

        vehiclePanel.hidden =
            true;

    }

    reviewPanel.hidden =
        false;

    renderReinforcementRequestReviewPanel(
        reinforcementRequest
    );

    reviewPanel.scrollIntoView({
        behavior:
            "smooth",

        block:
            "start"
    });

}


/* =====================================
   RANDARE PANOU ANALIZĂ
===================================== */

function renderReinforcementRequestReviewPanel(
    reinforcementRequest
) {

    const title =
        document.getElementById(
            "reinforcement-review-panel-title"
        );

    const summary =
        document.getElementById(
            "reinforcement-review-panel-summary"
        );

    const messageInput =
        document.getElementById(
            "reinforcement-review-message"
        );

    const acceptButton =
        document.getElementById(
            "reinforcement-review-accept-button"
        );

    const rejectButton =
        document.getElementById(
            "reinforcement-review-reject-button"
        );

    const feedback =
        document.getElementById(
            "reinforcement-review-feedback"
        );

    if (!summary) {
        return;
    }

    const requestStatus =
        String(
            reinforcementRequest?.status
            ||
            ""
        ).toLowerCase();

    const requestedMessage =
        String(
            reinforcementRequest
                ?.requested_message
            ||
            ""
        ).trim();

    const dispatcherMessage =
        String(
            reinforcementRequest
                ?.dispatcher_message
            ||
            ""
        ).trim();

    if (title) {

        title.textContent =
            (
                "Analiză cerere #"
                +
                (
                    reinforcementRequest?.id
                    ||
                    "-"
                )
                +
                " – "
                +
                (
                    reinforcementRequest
                        ?.incident_code
                    ||
                    "Incident"
                )
            );

    }

    summary.innerHTML = `
        <div class="reinforcement-review-summary-grid">

            <div class="reinforcement-review-summary-item">
                <span>
                    Incident
                </span>

                <strong>
                    ${escapeHtml(
                        reinforcementRequest
                            ?.incident_title
                        ||
                        "-"
                    )}
                </strong>
            </div>

            <div class="reinforcement-review-summary-item">
                <span>
                    Vehicul solicitant
                </span>

                <strong>
                    ${escapeHtml(
                        reinforcementRequest
                            ?.requested_by_vehicle_code
                        ||
                        "-"
                    )}
                </strong>
            </div>

            <div class="reinforcement-review-summary-item">
                <span>
                    Prioritate
                </span>

                <strong>
                    ${escapeHtml(
                        getReadableStatus(
                            reinforcementRequest
                                ?.incident_priority
                        )
                    )}
                </strong>
            </div>

            <div class="reinforcement-review-summary-item">
                <span>
                    Stare cerere
                </span>

                <strong>
                    ${escapeHtml(
                        getReinforcementRequestStatusLabel(
                            requestStatus
                        )
                    )}
                </strong>
            </div>

        </div>

        <div class="reinforcement-review-driver-message">

            <span>
                Mesajul șoferului
            </span>

            <p>
                ${escapeHtml(
                    requestedMessage
                    ||
                    "Șoferul nu a adăugat un mesaj."
                )}
            </p>

        </div>

        ${
            dispatcherMessage
                ?
                `
                    <div class="reinforcement-review-existing-message">

                        <span>
                            Mesajul dispecerului
                        </span>

                        <p>
                            ${escapeHtml(
                                dispatcherMessage
                            )}
                        </p>

                    </div>
                `
                :
                ""
        }

        ${getReinforcementRequestResourcesHtml(
            reinforcementRequest
        )}
    `;

    setReviewPanelQuantities(
        reinforcementRequest
    );

    if (messageInput) {

        messageInput.value =
            dispatcherMessage;

        messageInput.disabled =
            requestStatus !==
            "pending";

    }

    const canReview =
        requestStatus ===
        "pending";

    if (acceptButton) {

        acceptButton.hidden =
            !canReview;

        acceptButton.disabled =
            false;

        acceptButton.textContent =
            "Acceptă cererea";

    }

    if (rejectButton) {

        rejectButton.hidden =
            !canReview;

        rejectButton.disabled =
            false;

        rejectButton.textContent =
            "Respinge cererea";

    }

    setReviewPanelControlsDisabled(
        !canReview
    );

    if (feedback) {

        feedback.hidden =
            true;

        feedback.textContent =
            "";

    }

}


/* =====================================
   ÎNCHIDERE PANOU
===================================== */

function closeReinforcementRequestReviewPanel() {

    const reviewPanel =
        document.getElementById(
            "reinforcement-request-review-panel"
        );

    const vehiclePanel =
        document.getElementById(
            "vehicle-details-panel"
        );

    if (reviewPanel) {

        reviewPanel.hidden =
            true;

    }

    if (vehiclePanel) {

        vehiclePanel.hidden =
            false;

    }

    selectedReinforcementRequest =
        null;

    selectedReinforcementRequestId =
        null;

    document
        .querySelectorAll(
            ".reinforcement-request-card.selected"
        )
        .forEach(
            function (
                card
            ) {

                card.classList.remove(
                    "selected"
                );

            }
        );

}


/* =====================================
   RESURSE EXISTENTE
===================================== */

function getReinforcementRequestResourcesHtml(
    reinforcementRequest
) {

    const resources =
        Array.isArray(
            reinforcementRequest?.resources
        )
            ?
            reinforcementRequest.resources
            :
            [];

    const visibleResources =
        resources.filter(
            function (
                resource
            ) {

                return (
                    Number(
                        resource?.approved_quantity
                        ||
                        0
                    ) > 0
                    ||
                    Number(
                        resource?.assigned_quantity
                        ||
                        0
                    ) > 0
                );

            }
        );

    if (
        visibleResources.length ===
        0
    ) {

        return "";

    }

    return `
        <div class="reinforcement-review-existing-resources">

            <span>
                Resurse procesate
            </span>

            <div>

                ${
                    visibleResources
                        .map(
                            function (
                                resource
                            ) {

                                return `
                                    <small>

                                        <strong>
                                            ${escapeHtml(
                                                getReinforcementVehicleTypeLabel(
                                                    resource.vehicle_type
                                                )
                                            )}
                                        </strong>

                                        – aprobate
                                        ${Number(
                                            resource.approved_quantity
                                            ||
                                            0
                                        )},

                                        asignate
                                        ${Number(
                                            resource.assigned_quantity
                                            ||
                                            0
                                        )}

                                    </small>
                                `;

                            }
                        )
                        .join("")
                }

            </div>

        </div>
    `;

}


/* =====================================
   SETARE CANTITĂȚI
===================================== */

function setReviewPanelQuantities(
    reinforcementRequest
) {

    const quantities = {
        police:
            0,

        ambulance:
            0,

        fire:
            0
    };

    if (
        Array.isArray(
            reinforcementRequest?.resources
        )
    ) {

        reinforcementRequest.resources.forEach(
            function (
                resource
            ) {

                const vehicleType =
                    String(
                        resource?.vehicle_type
                        ||
                        ""
                    ).toLowerCase();

                if (
                    Object.prototype
                        .hasOwnProperty.call(
                            quantities,
                            vehicleType
                        )
                ) {

                    quantities[vehicleType] =
                        Number(
                            resource
                                .approved_quantity
                            ||
                            0
                        );

                }

            }
        );

    }

    Object.entries(
        quantities
    ).forEach(
        function (
            [
                vehicleType,
                quantity
            ]
        ) {

            const input =
                document.getElementById(
                    `reinforcement-review-${vehicleType}`
                );

            if (input) {

                input.value =
                    String(
                        quantity
                    );

            }

        }
    );

}


/* =====================================
   CITIRE CANTITĂȚI
===================================== */

function getReviewPanelResources() {

    const resources = {
        police:
            0,

        ambulance:
            0,

        fire:
            0
    };

    Object.keys(
        resources
    ).forEach(
        function (
            vehicleType
        ) {

            const input =
                document.getElementById(
                    `reinforcement-review-${vehicleType}`
                );

            let quantity =
                Number.parseInt(
                    input?.value,
                    10
                );

            if (
                !Number.isInteger(
                    quantity
                )
            ) {

                quantity =
                    0;

            }

            quantity =
                Math.max(
                    0,
                    Math.min(
                        20,
                        quantity
                    )
                );

            if (input) {

                input.value =
                    String(
                        quantity
                    );

            }

            resources[vehicleType] =
                quantity;

        }
    );

    return resources;

}


/* =====================================
   ACCEPTARE CERERE
===================================== */

async function submitReviewPanelAcceptance() {

    if (
        reinforcementRequestDecisionSaving
        ||
        !selectedReinforcementRequest
    ) {

        return;

    }

    const resources =
        getReviewPanelResources();

    const totalApproved =
        Object.values(
            resources
        ).reduce(
            function (
                total,
                quantity
            ) {

                return (
                    total
                    +
                    Number(
                        quantity
                    )
                );

            },
            0
        );

    if (
        totalApproved <
        1
    ) {

        displayReviewPanelFeedback(
            "Selectează cel puțin un vehicul pentru a accepta cererea.",
            "error"
        );

        return;

    }

    const messageInput =
        document.getElementById(
            "reinforcement-review-message"
        );

    const dispatcherMessage =
        String(
            messageInput?.value
            ||
            ""
        ).trim();

    if (
        dispatcherMessage.length >
        1000
    ) {

        displayReviewPanelFeedback(
            "Mesajul dispecerului nu poate depăși 1000 de caractere.",
            "error"
        );

        return;

    }

    const confirmed =
        window.confirm(
            (
                `Confirmi trimiterea a ${totalApproved} `
                +
                (
                    totalApproved === 1
                        ?
                        "vehicul"
                        :
                        "vehicule"
                )
                +
                "?"
            )
        );

    if (!confirmed) {
        return;
    }

    reinforcementRequestDecisionSaving =
        true;

    setReviewPanelSaving(
        true,
        "Se asignează vehiculele..."
    );

    try {

        const response =
            await window
                .acceptReinforcementRequest(
                    selectedReinforcementRequest.id,
                    resources,
                    dispatcherMessage
                );

        displayReviewPanelFeedback(
            response.message
            ||
            "Cererea a fost acceptată.",
            "success"
        );

        await Promise.all([
            loadVehicles(),
            loadIncidents(),
            loadReinforcementRequests()
        ]);

        /*
         * După acceptare închidem automat panoul.
         */
        closeReinforcementRequestReviewPanel();

    }

    catch (error) {

        console.error(
            "Cererea nu a putut fi acceptată:",
            error
        );

        displayReviewPanelFeedback(
            error.message,
            "error"
        );

    }

    finally {

        reinforcementRequestDecisionSaving =
            false;

        setReviewPanelSaving(
            false
        );

    }

}


/* =====================================
   RESPINGERE CERERE
===================================== */

async function submitReviewPanelRejection() {

    if (
        reinforcementRequestDecisionSaving
        ||
        !selectedReinforcementRequest
    ) {

        return;

    }

    const messageInput =
        document.getElementById(
            "reinforcement-review-message"
        );

    const dispatcherMessage =
        String(
            messageInput?.value
            ||
            ""
        ).trim();

    if (
        dispatcherMessage.length >
        1000
    ) {

        displayReviewPanelFeedback(
            "Mesajul dispecerului nu poate depăși 1000 de caractere.",
            "error"
        );

        return;

    }

    if (
        !window.confirm(
            "Confirmi respingerea cererii de întăriri?"
        )
    ) {

        return;

    }

    reinforcementRequestDecisionSaving =
        true;

    setReviewPanelSaving(
        true,
        "Se salvează decizia..."
    );

    try {

        const response =
            await window
                .rejectReinforcementRequest(
                    selectedReinforcementRequest.id,
                    dispatcherMessage
                );

        displayReviewPanelFeedback(
            response.message
            ||
            "Cererea a fost respinsă.",
            "success"
        );

        await loadReinforcementRequests();

        /*
         * Și după respingere închidem automat panoul.
         */
        closeReinforcementRequestReviewPanel();

    }

    catch (error) {

        console.error(
            "Cererea nu a putut fi respinsă:",
            error
        );

        displayReviewPanelFeedback(
            error.message,
            "error"
        );

    }

    finally {

        reinforcementRequestDecisionSaving =
            false;

        setReviewPanelSaving(
            false
        );

    }

}


/* =====================================
   STARE SALVARE
===================================== */

function setReviewPanelSaving(
    saving,
    message = ""
) {

    const acceptButton =
        document.getElementById(
            "reinforcement-review-accept-button"
        );

    const rejectButton =
        document.getElementById(
            "reinforcement-review-reject-button"
        );

    setReviewPanelControlsDisabled(
        saving
    );

    if (
        acceptButton
        &&
        !acceptButton.hidden
    ) {

        acceptButton.disabled =
            saving;

        acceptButton.textContent =
            saving
                ?
                (
                    message
                    ||
                    "Se salvează..."
                )
                :
                "Acceptă cererea";

    }

    if (
        rejectButton
        &&
        !rejectButton.hidden
    ) {

        rejectButton.disabled =
            saving;

        rejectButton.textContent =
            saving
                ?
                "Așteaptă..."
                :
                "Respinge cererea";

    }

}


/* =====================================
   ACTIVARE / DEZACTIVARE CONTROALE
===================================== */

function setReviewPanelControlsDisabled(
    disabled
) {

    document
        .querySelectorAll(
            (
                "#reinforcement-request-review-panel input, "
                +
                "#reinforcement-request-review-panel textarea, "
                +
                "#reinforcement-request-review-panel "
                +
                ".reinforcement-quantity-button"
            )
        )
        .forEach(
            function (
                control
            ) {

                control.disabled =
                    Boolean(
                        disabled
                    );

            }
        );

}


/* =====================================
   FEEDBACK
===================================== */

function displayReviewPanelFeedback(
    message,
    type
) {

    const feedback =
        document.getElementById(
            "reinforcement-review-feedback"
        );

    if (!feedback) {
        return;
    }

    feedback.hidden =
        false;

    feedback.className =
        (
            "reinforcement-request-review-feedback "
            +
            (
                type === "success"
                    ?
                    "success"
                    :
                    "error"
            )
        );

    feedback.textContent =
        (
            message
            ||
            "Operațiunea nu a putut fi finalizată."
        );

}


/* =====================================
   CONTROALE CANTITATE
===================================== */

function initializeReviewPanelQuantityControls() {

    const reviewPanel =
        document.getElementById(
            "reinforcement-request-review-panel"
        );

    if (!reviewPanel) {
        return;
    }

    reviewPanel
        .querySelectorAll(
            ".reinforcement-quantity-button"
        )
        .forEach(
            function (
                button
            ) {

                button.addEventListener(
                    "click",
                    function () {

                        const input =
                            document.getElementById(
                                button.dataset.target
                            );

                        if (
                            !input
                            ||
                            input.disabled
                        ) {

                            return;

                        }

                        let value =
                            Number.parseInt(
                                input.value,
                                10
                            );

                        if (
                            !Number.isInteger(
                                value
                            )
                        ) {

                            value =
                                0;

                        }

                        value +=
                            button.dataset.action ===
                            "increase"
                                ?
                                1
                                :
                                -1;

                        input.value =
                            String(
                                Math.max(
                                    0,
                                    Math.min(
                                        20,
                                        value
                                    )
                                )
                            );

                    }
                );

            }
        );

}


/* =====================================
   EROARE
===================================== */

function displayReinforcementRequestError(
    message
) {

    const requestsList =
        document.getElementById(
            "reinforcement-requests-list"
        );

    if (!requestsList) {
        return;
    }

    requestsList.innerHTML = `
        <p class="empty-message error">
            ${escapeHtml(
                message
                ||
                "Cererile de întăriri nu au putut fi încărcate."
            )}
        </p>
    `;

}


/* =====================================
   NUMĂR CERERI
===================================== */

function updateReinforcementRequestCount() {

    if (
        sidebarMode !==
        "requests"
    ) {

        return;

    }

    const countElement =
        document.getElementById(
            "vehicle-count"
        );

    if (countElement) {

        countElement.textContent =
            String(
                filteredReinforcementRequests.length
            );

    }

}


/* =====================================
   ETICHETE STATUS
===================================== */

function getReinforcementRequestStatusLabel(
    status
) {

    const labels = {
        pending:
            "În așteptare",

        partially_assigned:
            "Parțial aprobată",

        accepted:
            "Acceptată",

        rejected:
            "Respinsă",

        completed:
            "Finalizată",

        cancelled:
            "Anulată",

        failed:
            "Eșuată"
    };

    return (
        labels[
            String(
                status
                ||
                ""
            ).toLowerCase()
        ]
        ||
        "Necunoscută"
    );

}


/* =====================================
   ETICHETE TIP VEHICUL
===================================== */

function getReinforcementVehicleTypeLabel(
    vehicleType
) {

    const labels = {
        police:
            "Poliție",

        ambulance:
            "Ambulanță",

        fire:
            "Pompieri"
    };

    return (
        labels[
            String(
                vehicleType
                ||
                ""
            ).toLowerCase()
        ]
        ||
        "Necunoscut"
    );

}


/* =====================================
   FILTRE
===================================== */

function initializeReinforcementRequestFilters() {

    const statusFilter =
        document.getElementById(
            "reinforcement-request-status-filter"
        );

    const vehicleTypeFilter =
        document.getElementById(
            "reinforcement-request-type-filter"
        );

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            function () {

                reinforcementRequestFilters.status =
                    this.value;

                applyReinforcementRequestFilters();

            }
        );

    }

    if (vehicleTypeFilter) {

        vehicleTypeFilter.addEventListener(
            "change",
            function () {

                reinforcementRequestFilters.vehicleType =
                    this.value;

                applyReinforcementRequestFilters();

            }
        );

    }

}


/* =====================================
   RESET FILTRE
===================================== */

function resetReinforcementRequestFilters() {

    reinforcementRequestFilters.status =
        "all";

    reinforcementRequestFilters.vehicleType =
        "all";

    const statusFilter =
        document.getElementById(
            "reinforcement-request-status-filter"
        );

    const vehicleTypeFilter =
        document.getElementById(
            "reinforcement-request-type-filter"
        );

    if (statusFilter) {

        statusFilter.value =
            "all";

    }

    if (vehicleTypeFilter) {

        vehicleTypeFilter.value =
            "all";

    }

    applyReinforcementRequestFilters();

}


/* =====================================
   REFRESH AUTOMAT
===================================== */

function startReinforcementRequestRefresh() {

    stopReinforcementRequestRefresh();

    reinforcementRequestRefreshTimer =
        window.setInterval(
            async function () {

                if (
                    sidebarMode ===
                    "requests"
                ) {

                    await loadReinforcementRequests();

                }

            },
            REINFORCEMENT_REQUEST_REFRESH_INTERVAL
        );

}


/* =====================================
   OPRIRE REFRESH AUTOMAT
===================================== */

function stopReinforcementRequestRefresh() {

    if (
        reinforcementRequestRefreshTimer
    ) {

        window.clearInterval(
            reinforcementRequestRefreshTimer
        );

        reinforcementRequestRefreshTimer =
            null;

    }

}


/* =====================================
   INIȚIALIZARE MODUL
===================================== */

function initializeReinforcementRequestsUi() {

    initializeReinforcementRequestFilters();

    initializeReviewPanelQuantityControls();

    const closeButton =
        document.getElementById(
            "reinforcement-review-panel-close"
        );

    const acceptButton =
        document.getElementById(
            "reinforcement-review-accept-button"
        );

    const rejectButton =
        document.getElementById(
            "reinforcement-review-reject-button"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeReinforcementRequestReviewPanel
        );

    }

    if (acceptButton) {

        acceptButton.addEventListener(
            "click",
            submitReviewPanelAcceptance
        );

    }

    if (rejectButton) {

        rejectButton.addEventListener(
            "click",
            submitReviewPanelRejection
        );

    }

    [
        "vehicles-tab",
        "routes-tab"
    ].forEach(
        function (
            tabId
        ) {

            const tab =
                document.getElementById(
                    tabId
                );

            if (tab) {

                tab.addEventListener(
                    "click",
                    closeReinforcementRequestReviewPanel
                );

            }

        }
    );

}