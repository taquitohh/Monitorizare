/* =====================================
   STARE DASHBOARD ȘOFER
===================================== */

let driverCurrentUser = null;

let driverVehicle = null;

let driverMission = null;

let driverSpecialistDetails = null;

let driverSameTypeVehicles = [];

let driverFilteredVehicles = [];

let driverSelectedVehicleId = null;

let driverMap = null;

let driverMarkers = new Map();

let driverMissionMarker = null;

let driverRouteLayer = null;

let driverRouteStartMarker = null;

let driverRouteEndMarker = null;

let driverRouteData = null;

let driverRouteIncidentId = null; 

let driverReinforcementRequest = null;

let driverReinforcementRequests = [];

let driverReinforcementPendingSubmissions = 0;

let driverRefreshRunning = false;

let driverInitialMapPositionSet = false;

const DRIVER_REFRESH_INTERVAL = 3000;


/* =====================================
   PORNIRE
===================================== */

window.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            const currentUser =
                await window
                    .requireAuthenticatedUser([
                        "driver"
                    ]);

            if (!currentUser) {

                return;

            }

            driverCurrentUser =
                currentUser;

            initializeDriverMap();

            initializeDriverControls();

            displayDriverUser(
                currentUser
            );

            await loadDriverDashboard();

            startDriverAutomaticRefresh();

        }

        catch (error) {

            setDriverSystemError(
                error.message
            );

            console.error(
                "Interfața șoferului nu a putut fi inițializată:",
                error
            );

        }

    }
);


/* =====================================
   CONTROALE
===================================== */

function initializeDriverControls() {

    const logoutButton =
        document.getElementById(
            "driver-logout-button"
        );

    const refreshButton =
        document.getElementById(
            "driver-refresh-button"
        );

    const statusFilter =
        document.getElementById(
            "driver-status-filter"
        );
    const reinforcementButton =
    document.getElementById(
        "driver-request-reinforcement-button"
    );

    const reinforcementMessage =
        document.getElementById(
            "driver-reinforcement-message"
        );

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutDriver
        );

    }

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async function () {

                await loadDriverDashboard(
                    true
                );

            }
        );

    }

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            function () {

                applyDriverVehicleFilter(
                    this.value
                );

            }
        );

    }
    if (reinforcementButton) {

        reinforcementButton.addEventListener(
            "click",
            submitDriverReinforcementRequest
        );

    }

    if (reinforcementMessage) {

        reinforcementMessage.addEventListener(
            "input",
            updateDriverReinforcementMessageCount
        );

    }

}


/* =====================================
   ÎNCĂRCARE DASHBOARD
===================================== */

async function loadDriverDashboard(
    manualRefresh = false
) {

    if (driverRefreshRunning) {

        return;

    }

    driverRefreshRunning =
        true;

    const refreshButton =
        document.getElementById(
            "driver-refresh-button"
        );

    if (
        manualRefresh &&
        refreshButton
    ) {

        refreshButton.disabled =
            true;

        refreshButton.textContent =
            "Se actualizează...";

    }

    try {

        const dashboard =
            await window.driverApi
                .getDashboard();

        driverCurrentUser =
            dashboard.user ||
            driverCurrentUser;

        driverVehicle =
            dashboard.vehicle ||
            null;

        driverMission =
            dashboard.mission ||
            null;
        
        driverSpecialistDetails =
            dashboard.specialist_details
            ||
            null;

        driverSameTypeVehicles =
            Array.isArray(
                dashboard.same_type_vehicles
            )
                ? dashboard.same_type_vehicles
                : [];

        await loadDriverReinforcementRequests();

        displayDriverUser(
            driverCurrentUser
        );

        applyDriverTheme(
            driverVehicle?.vehicle_type
        );

        displayDriverOperationalSummary();

        displayDriverReinforcementSection();

        applyDriverVehicleFilter(
            document
                .getElementById(
                    "driver-status-filter"
                )
                ?.value || "all"
        );

        await updateDriverMissionRoute();

        updateDriverMap();

        setDriverSystemOnline();

    }

    catch (error) {

        console.error(
            "Datele șoferului nu au putut fi încărcate:",
            error
        );

        setDriverSystemError(
            error.message
        );

    }

    finally {

        driverRefreshRunning =
            false;

        if (refreshButton) {

            refreshButton.disabled =
                false;

            refreshButton.textContent =
                "Reîmprospătează";

        }

    }

}


/* =====================================
   UTILIZATOR
===================================== */

function displayDriverUser(
    user
) {

    const nameElement =
        document.getElementById(
            "driver-user-name"
        );

    const roleElement =
        document.getElementById(
            "driver-user-role"
        );

    if (nameElement) {

        nameElement.textContent =
            user?.display_name ||
            user?.username ||
            "Șofer";

    }

    if (roleElement) {

        roleElement.textContent =
            "Șofer";

    }

}


/* =====================================
   TEMĂ
===================================== */

function applyDriverTheme(
    vehicleType
) {

    document.body.classList.remove(
        "theme-police",
        "theme-ambulance",
        "theme-fire"
    );

    if (
        vehicleType === "police" ||
        vehicleType === "ambulance" ||
        vehicleType === "fire"
    ) {

        document.body.classList.add(
            `theme-${vehicleType}`
        );

    }

}


/* =====================================
   REZUMAT OPERAȚIONAL
===================================== */

function displayDriverOperationalSummary() {

    const vehicleCodeElement =
        document.getElementById(
            "driver-vehicle-code"
        );

    const vehicleStatusElement =
        document.getElementById(
            "driver-vehicle-status"
        );

    const missionStatusElement =
        document.getElementById(
            "driver-mission-status"
        );

    const summaryContent =
        document.getElementById(
            "driver-summary-content"
        );

    const missionReport =
        document.getElementById(
            "driver-mission-report"
        );

    if (
        !vehicleCodeElement ||
        !vehicleStatusElement ||
        !missionStatusElement ||
        !summaryContent ||
        !missionReport
    ) {

        return;

    }

    if (!driverVehicle) {

        vehicleCodeElement.textContent =
            "Vehicul negăsit";

        vehicleStatusElement.textContent =
            "Indisponibil";

        vehicleStatusElement.className =
            "driver-badge inactive";

        missionStatusElement.textContent =
            "Fără misiune";

        missionStatusElement.className =
            "driver-badge driver-badge-neutral";

        summaryContent.innerHTML = `
            <p class="driver-empty-message">
                Nu a fost găsit vehiculul corespunzător
                acestui cont.
            </p>
        `;

        missionReport.hidden =
            true;

        return;

    }

    vehicleCodeElement.textContent =
        driverVehicle.vehicle_code;

    const vehicleStatus =
            String(
                driverVehicle.status || ""
            ).toLowerCase();

        if (
            vehicleStatus === "busy" ||
            driverMission
        ) {

            vehicleStatusElement.textContent =
                "În misiune";

            vehicleStatusElement.className =
                "driver-badge driver-badge-mission";

        }

        else if (
            vehicleStatus === "active"
        ) {

            vehicleStatusElement.textContent =
                "Disponibil";

            vehicleStatusElement.className =
                "driver-badge";

        }

        else {

            vehicleStatusElement.textContent =
                "Indisponibil";

            vehicleStatusElement.className =
                "driver-badge inactive";

        }

    summaryContent.innerHTML = `
        <div class="driver-summary-item">

            <span>
                Tip vehicul
            </span>

            <strong>
                ${escapeDriverHtml(
                    getDriverVehicleTypeName(
                        driverVehicle.vehicle_type
                    )
                )}
            </strong>

        </div>

        <div class="driver-summary-item">

            <span>
                Viteză
            </span>

            <strong>
                ${formatDriverNumber(
                    driverVehicle.speed,
                    2
                )} km/h
            </strong>

        </div>

        <div class="driver-summary-item">

            <span>
                Latitudine
            </span>

            <strong>
                ${formatDriverNumber(
                    driverVehicle.latitude,
                    6
                )}
            </strong>

        </div>

        <div class="driver-summary-item">

            <span>
                Longitudine
            </span>

            <strong>
                ${formatDriverNumber(
                    driverVehicle.longitude,
                    6
                )}
            </strong>

        </div>

        <div class="driver-summary-item">

            <span>
                Ultima actualizare
            </span>

            <strong>
                ${escapeDriverHtml(
                    formatDriverDate(
                        driverVehicle.updated_at
                    )
                )}
            </strong>

        </div>
    `;

    if (!driverMission) {

        missionStatusElement.textContent =
            "În așteptare";

        missionStatusElement.className =
            "driver-badge driver-badge-neutral";

        missionReport.hidden =
            true;

        missionReport.innerHTML =
            "";

        return;

    }

    missionStatusElement.textContent =
        "Misiune activă";

    missionStatusElement.className =
        "driver-badge driver-badge-mission";

    missionReport.hidden =
        false;

    missionReport.innerHTML = `
        <h3>
            Raport misiune
        </h3>

        <div class="driver-mission-grid">

            <div class="driver-mission-item">

                <span>
                    Cod incident
                </span>

                <strong>
                    ${escapeDriverHtml(
                        driverMission.incident_code
                    )}
                </strong>

            </div>

            <div class="driver-mission-item">

                <span>
                    Eveniment
                </span>

                <strong>
                    ${escapeDriverHtml(
                        driverMission.title
                    )}
                </strong>

            </div>

            <div class="driver-mission-item">

                <span>
                    Prioritate
                </span>

                <strong>
                    ${escapeDriverHtml(
                        getDriverReadableValue(
                            driverMission.priority
                        )
                    )}
                </strong>

            </div>

            <div class="driver-mission-item">

                <span>
                    Stare
                </span>

                <strong>
                    ${escapeDriverHtml(
                        getDriverReadableValue(
                            driverMission.status
                        )
                    )}
                </strong>

            </div>

            <div class="driver-mission-item">

                <span>
                    Distanță traseu
                </span>

                <strong id="driver-route-distance">
                    ${getDriverRouteDistanceText()}
                </strong>

            </div>

            <div class="driver-mission-item">

                <span>
                    Destinație
                </span>

                <strong>
                    ${formatDriverNumber(
                        driverMission.latitude,
                        6
                    )},
                    ${formatDriverNumber(
                        driverMission.longitude,
                        6
                    )}
                </strong>

            </div>

            <div class="
                driver-mission-item
                driver-mission-details
            ">

                <span>
                    Detalii
                </span>

                <strong>
                    ${escapeDriverHtml(
                        driverMission.details ||
                        "Nu au fost furnizate detalii."
                    )}
                </strong>

            </div>

        </div>

        ${buildDriverSpecialistDetailsHtml()}
    `;

}

/* =====================================
   INFORMAȚII SPECIALIZATE MISIUNE
===================================== */

function buildDriverSpecialistDetailsHtml() {

    if (
        !driverMission
        ||
        !driverVehicle
        ||
        !driverSpecialistDetails
    ) {

        return "";

    }


    const vehicleType =
        String(
            driverVehicle.vehicle_type
            ||
            ""
        )
            .trim()
            .toLowerCase();


    const expectedServiceType = {

        police:
            "police",

        ambulance:
            "ambulance",

        fire:
            "firefighters"

    }[
        vehicleType
    ];


    const receivedServiceType =
        String(
            driverSpecialistDetails.service_type
            ||
            ""
        )
            .trim()
            .toLowerCase();


    /*
     * Protecție suplimentară:
     *
     * chiar dacă backend-ul trimite din greșeală
     * alt chestionar, nu îl afișăm șoferului.
     */

    if (
        !expectedServiceType
        ||
        expectedServiceType !==
        receivedServiceType
    ) {

        return "";

    }


    const answers =
        driverSpecialistDetails.answers
        &&
        typeof driverSpecialistDetails.answers ===
            "object"
            ?
            driverSpecialistDetails.answers
            :
            {};


    const questions =
        getDriverSpecialistQuestions(
            receivedServiceType
        );


    const visibleQuestions =
        questions.filter(
            function (
                question
            ) {

                const value =
                    answers[
                        question.code
                    ];

                return (
                    value !== null
                    &&
                    value !== undefined
                    &&
                    String(
                        value
                    ).trim() !==
                    ""
                );

            }
        );


    const serviceInformation =
        getDriverSpecialistServiceInformation(
            receivedServiceType
        );


    const status =
        getDriverSpecialistStatus(
            driverSpecialistDetails.status
        );


    /*
     * Raportul există, dar dispecerul încă
     * nu a introdus informații.
     */

    if (
        visibleQuestions.length ===
        0
    ) {

        return `
            <section class="
                driver-specialist-details
                driver-specialist-details-empty
            ">

                <div class="driver-specialist-header">

                    <div class="driver-specialist-heading">

                        <span class="driver-specialist-icon">
                            ${serviceInformation.icon}
                        </span>

                        <div>

                            <span class="driver-specialist-kicker">
                                INFORMAȚII OPERATIVE
                            </span>

                            <h4>
                                ${escapeDriverHtml(
                                    serviceInformation.title
                                )}
                            </h4>

                        </div>

                    </div>

                    <span class="
                        driver-specialist-status
                        ${escapeDriverHtml(
                            status.className
                        )}
                    ">
                        ${escapeDriverHtml(
                            status.label
                        )}
                    </span>

                </div>

                <p class="driver-specialist-empty-message">
                    Dispeceratul nu a transmis încă
                    informații suplimentare pentru acest serviciu.
                </p>

            </section>
        `;

    }


    const answersHtml =
        visibleQuestions
            .map(
                function (
                    question
                ) {

                    const value =
                        answers[
                            question.code
                        ];

                    return `
                        <div class="driver-specialist-item">

                            <span>
                                ${escapeDriverHtml(
                                    question.label
                                )}
                            </span>

                            <strong>
                                ${escapeDriverHtml(
                                    getDriverSpecialistAnswerValue(
                                        value
                                    )
                                )}
                            </strong>

                        </div>
                    `;

                }
            )
            .join("");


    const updatedAt =
        driverSpecialistDetails.updated_at
            ?
            formatDriverDate(
                driverSpecialistDetails.updated_at
            )
            :
            "-";


    return `
        <section class="driver-specialist-details">

            <div class="driver-specialist-header">

                <div class="driver-specialist-heading">

                    <span class="driver-specialist-icon">
                        ${serviceInformation.icon}
                    </span>

                    <div>

                        <span class="driver-specialist-kicker">
                            INFORMAȚII OPERATIVE
                        </span>

                        <h4>
                            ${escapeDriverHtml(
                                serviceInformation.title
                            )}
                        </h4>

                    </div>

                </div>

                <span class="
                    driver-specialist-status
                    ${escapeDriverHtml(
                        status.className
                    )}
                ">
                    ${escapeDriverHtml(
                        status.label
                    )}
                </span>

            </div>


            <div class="driver-specialist-grid">

                ${answersHtml}

            </div>


            <div class="driver-specialist-footer">

                <span>
                    Actualizat de dispecerat
                </span>

                <strong>
                    ${escapeDriverHtml(
                        updatedAt
                    )}
                </strong>

            </div>

        </section>
    `;

}


/* =====================================
   ÎNTREBĂRI SPECIALIZATE
===================================== */

function getDriverSpecialistQuestions(
    serviceType
) {

    const questions = {

        police: [

            {
                code:
                    "traffic_affected",

                label:
                    "Trafic afectat"
            },

            {
                code:
                    "road_block_required",

                label:
                    "Este necesară blocarea drumului?"
            },

            {
                code:
                    "aggressive_persons",

                label:
                    "Există persoane agresive?"
            },

            {
                code:
                    "weapons_suspected",

                label:
                    "Există arme observate sau suspectate?"
            },

            {
                code:
                    "persons_involved",

                label:
                    "Număr aproximativ de persoane implicate"
            },

            {
                code:
                    "perimeter_required",

                label:
                    "Perimetrul trebuie securizat?"
            },

            {
                code:
                    "suspects_left_area",

                label:
                    "Există suspecți care au părăsit zona?"
            },

            {
                code:
                    "police_notes",

                label:
                    "Observații operative"
            }

        ],


        ambulance: [

            {
                code:
                    "estimated_victims",

                label:
                    "Număr estimat de victime"
            },

            {
                code:
                    "conscious_victims",

                label:
                    "Victime conștiente"
            },

            {
                code:
                    "unconscious_victims",

                label:
                    "Victime inconștiente"
            },

            {
                code:
                    "trapped_victims",

                label:
                    "Victime blocate / încarcerate"
            },

            {
                code:
                    "pediatric_victims",

                label:
                    "Există victime pediatrice?"
            },

            {
                code:
                    "severe_bleeding",

                label:
                    "Există hemoragii severe raportate?"
            },

            {
                code:
                    "extrication_required",

                label:
                    "Este necesară descarcerarea?"
            },

            {
                code:
                    "crew_risk",

                label:
                    "Există risc suplimentar pentru echipaj?"
            },

            {
                code:
                    "medical_notes",

                label:
                    "Observații medicale"
            }

        ],


        firefighters: [

            {
                code:
                    "main_situation",

                label:
                    "Situație principală"
            },

            {
                code:
                    "active_flame",

                label:
                    "Flacără activă?"
            },

            {
                code:
                    "dense_smoke",

                label:
                    "Fum dens?"
            },

            {
                code:
                    "explosion_risk",

                label:
                    "Risc de explozie"
            },

            {
                code:
                    "hazardous_materials",

                label:
                    "Sunt implicate substanțe periculoase?"
            },

            {
                code:
                    "fuel_or_gas",

                label:
                    "Este implicat combustibil sau gaz?"
            },

            {
                code:
                    "trapped_persons",

                label:
                    "Există persoane blocate?"
            },

            {
                code:
                    "evacuation_required",

                label:
                    "Este necesară evacuarea zonei?"
            },

            {
                code:
                    "firefighter_notes",

                label:
                    "Observații operative"
            }

        ]

    };


    return (
        questions[
            serviceType
        ]
        ||
        []
    );

}


/* =====================================
   INFORMAȚII SERVICIU
===================================== */

function getDriverSpecialistServiceInformation(
    serviceType
) {

    const services = {

        police: {
            title:
                "Informații pentru Poliție",

            icon:
                "🚓"
        },

        ambulance: {
            title:
                "Informații medicale",

            icon:
                "🚑"
        },

        firefighters: {
            title:
                "Informații pentru Pompieri",

            icon:
                "🚒"
        }

    };


    return (
        services[
            serviceType
        ]
        ||
        {
            title:
                "Informații operative",

            icon:
                "ℹ️"
        }
    );

}


/* =====================================
   STATUS CHESTIONAR
===================================== */

function getDriverSpecialistStatus(
    status
) {

    const normalizedStatus =
        String(
            status
            ||
            ""
        )
            .trim()
            .toLowerCase();


    const statuses = {

        pending: {
            label:
                "În așteptare",

            className:
                "pending"
        },

        in_progress: {
            label:
                "Actualizare în curs",

            className:
                "in-progress"
        },

        confirmed: {
            label:
                "Confirmat",

            className:
                "confirmed"
        }

    };


    return (
        statuses[
            normalizedStatus
        ]
        ||
        {
            label:
                "Informații operative",

            className:
                "neutral"
        }
    );

}


/* =====================================
   VALOARE RĂSPUNS
===================================== */

function getDriverSpecialistAnswerValue(
    value
) {

    if (
        value === null
        ||
        value === undefined
    ) {

        return "-";

    }


    const normalized =
        String(
            value
        ).trim();


    if (!normalized) {

        return "-";

    }


    return normalized;

}

/* =====================================
   RUTĂ MISIUNE
===================================== */

async function updateDriverMissionRoute() {

    if (
        !driverMission
        ||
        !driverMission.id
        ||
        !driverVehicle
    ) {

        driverRouteData =
            null;

        driverRouteIncidentId =
            null;

        clearDriverRoute();

        return;

    }

    try {

        const routeResponse =
            await window.driverApi
                .getMissionRoute(
                    driverMission.id
                );

        /*
         * Endpoint-ul dispecerului întoarce acum
         * toate rutele incidentului.
         *
         * Pentru șofer alegem exclusiv ruta
         * vehiculului conectat.
         */
        let ownRoute =
            null;

        if (
            Array.isArray(
                routeResponse?.routes
            )
        ) {

            ownRoute =
                routeResponse.routes.find(
                    function (route) {

                        const sameId =
                            Number(
                                route.vehicle_id
                            )
                            ===
                            Number(
                                driverVehicle.id
                            );

                        const sameCode =
                            String(
                                route.vehicle_code
                                ||
                                ""
                            )
                            ===
                            String(
                                driverVehicle.vehicle_code
                                ||
                                ""
                            );

                        return (
                            sameId
                            ||
                            sameCode
                        );

                    }
                )
                ||
                null;

        }

        /*
         * Compatibilitate cu răspunsul vechi,
         * care conținea o singură rută.
         */
        if (
            !ownRoute
            &&
            Array.isArray(
                routeResponse?.coordinates
            )
        ) {

            const responseVehicleId =
                Number(
                    routeResponse.vehicle_id
                );

            const responseVehicleCode =
                String(
                    routeResponse.vehicle_code
                    ||
                    ""
                );

            const routeBelongsToCurrentDriver =
                (
                    responseVehicleId ===
                    Number(
                        driverVehicle.id
                    )
                )
                ||
                (
                    responseVehicleCode ===
                    String(
                        driverVehicle.vehicle_code
                    )
                );

            if (
                routeBelongsToCurrentDriver
                ||
                !Array.isArray(
                    routeResponse.routes
                )
            ) {

                ownRoute = {
                    ...routeResponse
                };

            }

        }

        if (!ownRoute) {

            throw new Error(
                (
                    "Serverul nu a returnat ruta "
                    + "vehiculului conectat."
                )
            );

        }

        /*
         * Adăugăm informațiile incidentului
         * de la rădăcina răspunsului.
         */
        driverRouteData = {
            ...ownRoute,

            incident_id:
                routeResponse.incident_id
                ??
                driverMission.id,

            incident_code:
                routeResponse.incident_code
                ??
                driverMission.incident_code,

            incident_latitude:
                routeResponse.incident_latitude
                ??
                driverMission.latitude,

            incident_longitude:
                routeResponse.incident_longitude
                ??
                driverMission.longitude
        };

        driverRouteIncidentId =
            driverMission.id;

        displayDriverRoute(
            driverRouteData
        );

        updateDriverRouteDistance();

    }

    catch (error) {

        console.error(
            "Ruta misiunii nu a putut fi încărcată:",
            error
        );

        driverRouteData =
            null;

        driverRouteIncidentId =
            driverMission.id;

        clearDriverRoute();

        const mapMessage =
            document.getElementById(
                "driver-map-message"
            );

        if (mapMessage) {

            mapMessage.textContent =
                (
                    "Misiunea este activă, dar ruta "
                    + "nu a putut fi calculată: "
                    + error.message
                );

        }

        updateDriverRouteDistance();

    }

}


function displayDriverRoute(
    routeData
) {

    if (
        !driverMap
        ||
        !driverVehicle
    ) {

        return;

    }

    const routeCoordinates =
        normalizeDriverRouteCoordinates(
            routeData?.coordinates
        );

    if (
        routeCoordinates.length < 2
    ) {

        throw new Error(
            "Ruta nu conține suficiente coordonate valide."
        );

    }

    clearDriverRoute();

    const routeColor =
        getDriverMarkerColor(
            driverVehicle.vehicle_type
        );

    driverRouteLayer =
        L.polyline(
            routeCoordinates,
            {
                color:
                    routeColor,

                weight:
                    6,

                opacity:
                    0.9,

                lineJoin:
                    "round",

                lineCap:
                    "round"
            }
        ).addTo(
            driverMap
        );

    driverRouteLayer.bindPopup(
        `
            <strong>
                Ruta misiunii
            </strong>

            <br>

            Vehicul:
            ${escapeDriverHtml(
                driverVehicle.vehicle_code
            )}

            <br>

            Distanță:
            ${escapeDriverHtml(
                getDriverRouteDistanceText()
            )}
        `
    );

    const endCoordinate =
        routeCoordinates[
            routeCoordinates.length - 1
        ];

    /*
     * Nu mai creăm un marker separat la început.
     * Markerul mare cu eticheta TU reprezintă
     * deja poziția vehiculului.
     */
    driverRouteStartMarker =
        null;

    /*
     * Nu mai creăm nici al doilea cerc mov.
     * updateDriverMissionMarker() gestionează
     * singur markerul incidentului.
     */
    driverRouteEndMarker =
        null;

    const ownMarker =
        driverMarkers.get(
            String(
                driverVehicle.id
            )
        );

    if (ownMarker) {

        ownMarker.setLatLng([
            Number(
                driverVehicle.latitude
            ),
            Number(
                driverVehicle.longitude
            )
        ]);

        ownMarker.setZIndexOffset(
            4000
        );

        if (
            !driverMap.hasLayer(
                ownMarker
            )
        ) {

            ownMarker.addTo(
                driverMap
            );

        }

    }

    /*
     * Actualizăm poziția markerului incidentului
     * dacă acesta există deja.
     */
    if (
        driverMissionMarker
        &&
        driverMap.hasLayer(
            driverMissionMarker
        )
    ) {

        driverMissionMarker.setLatLng(
            endCoordinate
        );

    }

    driverInitialMapPositionSet =
        true;

}


function normalizeDriverRouteCoordinates(
    coordinates
) {

    if (!Array.isArray(coordinates)) {

        return [];

    }

    return coordinates
        .map(
            function (coordinate) {

                if (
                    Array.isArray(
                        coordinate
                    )
                ) {

                    return [
                        Number(
                            coordinate[0]
                        ),

                        Number(
                            coordinate[1]
                        )
                    ];

                }

                return [
                    Number(
                        coordinate?.latitude
                    ),

                    Number(
                        coordinate?.longitude
                    )
                ];

            }
        )
        .filter(
            function (coordinate) {

                return (
                    Number.isFinite(
                        coordinate[0]
                    ) &&
                    Number.isFinite(
                        coordinate[1]
                    )
                );

            }
        );

}


function focusDriverRoute() {

    if (
        !driverMap
        ||
        !driverRouteLayer
    ) {

        return;

    }

    const layers = [
        driverRouteLayer
    ];

    const ownMarker =
        driverVehicle
            ?
            driverMarkers.get(
                String(
                    driverVehicle.id
                )
            )
            :
            null;

    if (
        ownMarker
        &&
        driverMap.hasLayer(
            ownMarker
        )
    ) {

        layers.push(
            ownMarker
        );

    }

    if (
        driverMissionMarker
        &&
        driverMap.hasLayer(
            driverMissionMarker
        )
    ) {

        layers.push(
            driverMissionMarker
        );

    }

    const group =
        L.featureGroup(
            layers
        );

    const routeBounds =
        group.getBounds();

    if (
        !routeBounds.isValid()
    ) {

        return;

    }

    driverMap.fitBounds(
        routeBounds,
        {
            padding:
                [
                    45,
                    45
                ],

            maxZoom:
                16
        }
    );

}


function clearDriverRoute() {

    if (!driverMap) {

        driverRouteLayer =
            null;

        driverRouteStartMarker =
            null;

        driverRouteEndMarker =
            null;

        return;

    }

    if (
        driverRouteLayer &&
        driverMap.hasLayer(
            driverRouteLayer
        )
    ) {

        driverMap.removeLayer(
            driverRouteLayer
        );

    }

    if (
        driverRouteStartMarker &&
        driverMap.hasLayer(
            driverRouteStartMarker
        )
    ) {

        driverMap.removeLayer(
            driverRouteStartMarker
        );

    }

    if (
        driverRouteEndMarker &&
        driverMap.hasLayer(
            driverRouteEndMarker
        )
    ) {

        driverMap.removeLayer(
            driverRouteEndMarker
        );

    }

    driverRouteLayer =
        null;

    driverRouteStartMarker =
        null;

    driverRouteEndMarker =
        null;

}


function updateDriverRouteDistance() {

    const distanceElement =
        document.getElementById(
            "driver-route-distance"
        );

    if (distanceElement) {

        distanceElement.textContent =
            getDriverRouteDistanceText();

    }

}


function getDriverRouteDistanceText() {

    const distance =
        Number(
            driverRouteData?.distance_km
        );

    if (Number.isFinite(distance)) {

        return (
            `${distance.toFixed(2)} km`
        );

    }

    const coordinates =
        normalizeDriverRouteCoordinates(
            driverRouteData?.coordinates
        );

    if (coordinates.length < 2) {

        return "Se calculează...";

    }

    let totalDistance =
        0;

    for (
        let index = 1;
        index < coordinates.length;
        index += 1
    ) {

        totalDistance +=
            calculateDriverDistance(
                coordinates[index - 1][0],
                coordinates[index - 1][1],
                coordinates[index][0],
                coordinates[index][1]
            );

    }

    return (
        `${totalDistance.toFixed(2)} km`
    );

}


/* =====================================
   FILTRARE VEHICULE
===================================== */

function applyDriverVehicleFilter(
    filterValue
) {

    const normalizedFilter =
        String(
            filterValue
            ||
            "all"
        ).toLowerCase();

    const allVisibleVehicles =
        [];

    /*
     * Vehiculul conectat este introdus primul
     * și este marcat separat.
     */
    if (driverVehicle) {

        allVisibleVehicles.push({
            ...driverVehicle,

            isOwnVehicle:
                true
        });

    }

    /*
     * Adăugăm toate celelalte vehicule
     * din aceeași categorie.
     */
    driverSameTypeVehicles.forEach(
        function (vehicle) {

            if (
                driverVehicle
                &&
                Number(vehicle.id) ===
                Number(driverVehicle.id)
            ) {

                return;

            }

            allVisibleVehicles.push({
                ...vehicle,

                isOwnVehicle:
                    false
            });

        }
    );

    driverFilteredVehicles =
        allVisibleVehicles.filter(
            function (vehicle) {

                const vehicleStatus =
                    String(
                        vehicle.status
                        ||
                        ""
                    ).toLowerCase();

                /*
                 * Vehiculul conectat rămâne permanent
                 * vizibil cât timp are o misiune activă,
                 * indiferent de filtrul selectat.
                 */
                const isActiveMissionVehicle =
                    Boolean(
                        driverMission
                    )
                    &&
                    Boolean(
                        vehicle.isOwnVehicle
                    );

                if (
                    isActiveMissionVehicle
                ) {

                    return true;

                }

                if (
                    normalizedFilter ===
                    "all"
                ) {

                    return true;

                }

                if (
                    normalizedFilter ===
                    "active"
                ) {

                    return (
                        vehicleStatus ===
                        "active"
                    );

                }

                if (
                    normalizedFilter ===
                    "busy"
                ) {

                    return (
                        vehicleStatus ===
                        "busy"
                    );

                }

                /*
                 * Indisponibile:
                 * - inactive
                 * - busy
                 *
                 * Vehiculele în misiune nu pot fi
                 * asignate altui incident.
                 */
                if (
                    normalizedFilter ===
                    "inactive"
                ) {

                    return (
                        vehicleStatus ===
                        "inactive"
                        ||
                        vehicleStatus ===
                        "busy"
                    );

                }

                return true;

            }
        );

    displayDriverVehicleList();

    updateDriverVehicleCount();

    updateDriverMarkers();

}

/* =====================================
   LISTĂ VEHICULE
===================================== */

function displayDriverVehicleList() {

    const list =
        document.getElementById(
            "driver-vehicles-list"
        );

    if (!list) {

        return;

    }

    list.innerHTML =
        "";

    if (
        driverFilteredVehicles.length ===
        0
    ) {

        list.innerHTML = `
            <p class="driver-empty-message">
                Nu există vehicule care să corespundă
                filtrului selectat.
            </p>
        `;

        return;

    }

    driverFilteredVehicles.forEach(
        function (vehicle) {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "driver-vehicle-card";

            if (vehicle.isOwnVehicle) {

                card.classList.add(
                    "own-vehicle"
                );

            }

            if (
                Number(vehicle.id) ===
                Number(driverSelectedVehicleId)
            ) {

                card.classList.add(
                    "selected"
                );

            }

           const normalizedStatus =
                String(
                    vehicle.status || ""
                ).toLowerCase();

            let statusClass =
                "inactive";

            let statusText =
                "Indisponibil";

            if (
                normalizedStatus === "active"
            ) {

                statusClass =
                    "active";

                statusText =
                    "Disponibil";

            }

            else if (
                normalizedStatus === "busy"
            ) {

                statusClass =
                    "busy";

                statusText =
                    "În misiune";

            }

            card.innerHTML = `
                <div class="driver-vehicle-card-header">

                    <span class="driver-vehicle-code">
                        ${escapeDriverHtml(
                            vehicle.vehicle_code
                        )}
                    </span>

                    <span class="
                        driver-vehicle-state
                        ${statusClass}
                    ">
                        ${statusText}
                    </span>

                </div>

                <div class="driver-vehicle-card-details">

                    ${
                        vehicle.isOwnVehicle
                            ? "<strong>Vehiculul tău</strong><br>"
                            : ""
                    }

                    Viteză:
                    ${formatDriverNumber(
                        vehicle.speed,
                        2
                    )} km/h

                </div>
            `;

            card.addEventListener(
                "click",
                function () {

                    driverSelectedVehicleId =
                        vehicle.id;

                    displayDriverVehicleList();

                    focusDriverVehicle(
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


function updateDriverVehicleCount() {

    const countElement =
        document.getElementById(
            "driver-vehicle-count"
        );

    if (countElement) {

        countElement.textContent =
            driverFilteredVehicles.length;

    }

}


/* =====================================
   HARTĂ
===================================== */

function initializeDriverMap() {

    if (driverMap) {

        return;

    }

    driverMap = L.map(
        "driver-map"
    ).setView(
        [
            44.4268,
            26.1025
        ],
        13
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom:
                19,

            attribution:
                "&copy; OpenStreetMap"
        }
    ).addTo(
        driverMap
    );

}


function updateDriverMap() {

    updateDriverMarkers();

    updateDriverMissionMarker();

    const mapStatus =
        document.getElementById(
            "driver-map-status"
        );

    const mapMessage =
        document.getElementById(
            "driver-map-message"
        );

    if (mapStatus) {

        mapStatus.textContent =
            driverMission
                ?
                "Misiune activă"
                :
                "Monitorizare activă";

    }

    if (mapMessage) {

        if (
            driverMission
            &&
            driverRouteLayer
        ) {

            mapMessage.textContent =
                "Ruta către incident este afișată pe hartă.";

        }

        else if (driverMission) {

            mapMessage.textContent =
                "Incidentul activ este afișat pe hartă.";

        }

        else {

            mapMessage.textContent =
                (
                    "Nu există o misiune activă. "
                    + "Sunt afișate vehiculele disponibile."
                );

        }

    }

    if (
        driverMission
        &&
        driverRouteLayer
    ) {

        focusDriverRoute();

        driverInitialMapPositionSet =
            true;

        return;

    }

    if (
        !driverInitialMapPositionSet
        &&
        driverVehicle
        &&
        driverVehicleHasLocation(
            driverVehicle
        )
    ) {

        driverMap.setView(
            [
                Number(
                    driverVehicle.latitude
                ),

                Number(
                    driverVehicle.longitude
                )
            ],
            14
        );

        driverInitialMapPositionSet =
            true;

    }

}


function updateDriverMarkers() {

    if (!driverMap) {

        return;

    }

    const visibleIds =
        new Set();

    driverFilteredVehicles.forEach(
        function (vehicle) {

            if (
                !driverVehicleHasLocation(
                    vehicle
                )
            ) {

                return;

            }

            const markerId =
                String(
                    vehicle.id
                );

            visibleIds.add(
                markerId
            );

            const popupContent = `
                <strong>
                    ${escapeDriverHtml(
                        vehicle.vehicle_code
                    )}
                </strong>
                <br>
                Tip:
                ${escapeDriverHtml(
                    getDriverVehicleTypeName(
                        vehicle.vehicle_type
                    )
                )}
                <br>
                Stare:
                    ${escapeDriverHtml(
                        getDriverVehicleStatusName(
                            vehicle.status
                        )
                    )}
                <br>
                Viteză:
                ${formatDriverNumber(
                    vehicle.speed,
                    2
                )} km/h
            `;

            const vehicleIcon =
                createDriverVehicleIcon(
                    vehicle.vehicle_type,
                    vehicle.isOwnVehicle
                );

            if (
                driverMarkers.has(
                    markerId
                )
            ) {

                const marker =
                    driverMarkers.get(
                        markerId
                    );

                marker.setLatLng([
                    Number(
                        vehicle.latitude
                    ),

                    Number(
                        vehicle.longitude
                    )
                ]);

                marker.setIcon(
                    vehicleIcon
                );

                marker.setPopupContent(
                    popupContent
                );

            }

            else {

                const marker =
                    L.marker(
                        [
                            Number(
                                vehicle.latitude
                            ),

                            Number(
                                vehicle.longitude
                            )
                        ],
                        {
                            icon:
                                vehicleIcon,

                            zIndexOffset:
                                vehicle.isOwnVehicle
                                    ? 2000
                                    : 1000
                        }
                    );

                marker.bindPopup(
                    popupContent
                );

                marker.addTo(
                    driverMap
                );

                driverMarkers.set(
                    markerId,
                    marker
                );

            }

        }
    );

    driverMarkers.forEach(
        function (
            marker,
            markerId
        ) {

            if (
                !visibleIds.has(
                    markerId
                )
            ) {

                driverMap.removeLayer(
                    marker
                );

                driverMarkers.delete(
                    markerId
                );

            }

        }
    );

}

function createDriverVehicleIcon(
    vehicleType,
    isOwnVehicle
) {

    const emoji =
        getDriverVehicleEmoji(
            vehicleType
        );

    const ownVehicleClass =
        isOwnVehicle
            ? "driver-map-marker-own"
            : "";

    const ownVehicleLabel =
        isOwnVehicle
            ? `
                <span class="driver-map-marker-label">
                    TU
                </span>
            `
            : "";

    return L.divIcon({

        className:
            "driver-vehicle-marker-wrapper",

        html: `
            <div class="
                driver-vehicle-map-marker
                driver-vehicle-map-marker-${vehicleType}
                ${ownVehicleClass}
            ">

                <span class="driver-vehicle-map-marker-icon">
                    ${emoji}
                </span>

                ${ownVehicleLabel}

            </div>
        `,

        iconSize:
            isOwnVehicle
                ? [
                    62,
                    72
                ]
                : [
                    46,
                    52
                ],

        iconAnchor:
            isOwnVehicle
                ? [
                    31,
                    72
                ]
                : [
                    23,
                    52
                ],

        popupAnchor:
            isOwnVehicle
                ? [
                    0,
                    -66
                ]
                : [
                    0,
                    -46
                ]

    });

}


function getDriverVehicleEmoji(
    vehicleType
) {

    const emojis = {
        police:
            "🚓",

        ambulance:
            "🚑",

        fire:
            "🚒"
    };

    return (
        emojis[vehicleType]
        ||
        "🚗"
    );

}

/* =====================================
   ICONIȚĂ INCIDENT ȘOFER
===================================== */

function createDriverIncidentIcon() {

    return L.divIcon({
        className:
            "driver-incident-marker-wrapper",

        html: `
            <div class="driver-incident-marker">

                <span>
                    !
                </span>

            </div>
        `,

        iconSize:
            [
                46,
                54
            ],

        iconAnchor:
            [
                23,
                54
            ],

        popupAnchor:
            [
                0,
                -48
            ]
    });

}

function updateDriverMissionMarker() {

    if (!driverMap) {

        return;

    }

    if (
        !driverMission
        ||
        !driverMissionHasLocation(
            driverMission
        )
    ) {

        if (
            driverMissionMarker
            &&
            driverMap.hasLayer(
                driverMissionMarker
            )
        ) {

            driverMap.removeLayer(
                driverMissionMarker
            );

        }

        driverMissionMarker =
            null;

        return;

    }

    const position = [
        Number(
            driverMission.latitude
        ),

        Number(
            driverMission.longitude
        )
    ];

    const popupContent = `
        <div class="driver-incident-popup">

            <strong>
                Incident activ
            </strong>

            <br>

            ${escapeDriverHtml(
                driverMission.incident_code
            )}

            <br>

            ${escapeDriverHtml(
                driverMission.title
            )}

        </div>
    `;

    /*
     * Actualizăm markerul existent fără
     * să îl distrugem la fiecare refresh.
     */
    if (driverMissionMarker) {

        driverMissionMarker.setLatLng(
            position
        );

        driverMissionMarker.setIcon(
            createDriverIncidentIcon()
        );

        driverMissionMarker.setPopupContent(
            popupContent
        );

        driverMissionMarker.setZIndexOffset(
            4500
        );

        if (
            !driverMap.hasLayer(
                driverMissionMarker
            )
        ) {

            driverMissionMarker.addTo(
                driverMap
            );

        }

        return;

    }

    driverMissionMarker =
        L.marker(
            position,
            {
                icon:
                    createDriverIncidentIcon(),

                zIndexOffset:
                    4500
            }
        );

    driverMissionMarker.bindPopup(
        popupContent,
        {
            closeButton:
                true,

            autoClose:
                false,

            closeOnClick:
                false
        }
    );

    driverMissionMarker.addTo(
        driverMap
    );

}


function focusDriverVehicle(
    vehicle
) {

    if (
        !driverMap ||
        !driverVehicleHasLocation(
            vehicle
        )
    ) {

        return;

    }

    driverMap.setView(
        [
            Number(
                vehicle.latitude
            ),

            Number(
                vehicle.longitude
            )
        ],
        16
    );

    const marker =
        driverMarkers.get(
            String(
                vehicle.id
            )
        );

    if (marker) {

        marker.openPopup();

    }

}


/* =====================================
   ACTUALIZARE AUTOMATĂ
===================================== */

function startDriverAutomaticRefresh() {

    window.setInterval(
        async function () {

            await loadDriverDashboard();

        },
        DRIVER_REFRESH_INTERVAL
    );

}


/* =====================================
   DECONECTARE
===================================== */

async function logoutDriver() {

    const logoutButton =
        document.getElementById(
            "driver-logout-button"
        );

    if (logoutButton) {

        logoutButton.disabled =
            true;

        logoutButton.textContent =
            "Se deconectează...";

    }

    try {

        await window.authApi.logout();

        window.location.replace(
            "/"
        );

    }

    catch (error) {

        alert(
            error.message
        );

        if (logoutButton) {

            logoutButton.disabled =
                false;

            logoutButton.textContent =
                "Deconectare";

        }

    }

}


/* =====================================
   STARE SISTEM
===================================== */

function setDriverSystemOnline() {

    const dot =
        document.getElementById(
            "driver-system-dot"
        );

    const text =
        document.getElementById(
            "driver-system-text"
        );

    if (dot) {

        dot.classList.remove(
            "error"
        );

    }

    if (text) {

        text.textContent =
            "Sistem activ";

    }

}


function setDriverSystemError(
    errorMessage
) {

    const dot =
        document.getElementById(
            "driver-system-dot"
        );

    const text =
        document.getElementById(
            "driver-system-text"
        );

    const mapMessage =
        document.getElementById(
            "driver-map-message"
        );

    if (dot) {

        dot.classList.add(
            "error"
        );

    }

    if (text) {

        text.textContent =
            "Conexiune indisponibilă";

    }

    if (mapMessage) {

        mapMessage.textContent =
            errorMessage ||
            "Datele nu au putut fi încărcate.";

    }

}


/* =====================================
   FUNCȚII AJUTĂTOARE
===================================== */

function driverVehicleHasLocation(
    vehicle
) {

    return (
        vehicle &&
        Number.isFinite(
            Number(
                vehicle.latitude
            )
        ) &&
        Number.isFinite(
            Number(
                vehicle.longitude
            )
        )
    );

}


function driverMissionHasLocation(
    mission
) {

    return (
        mission &&
        Number.isFinite(
            Number(
                mission.latitude
            )
        ) &&
        Number.isFinite(
            Number(
                mission.longitude
            )
        )
    );

}


function getDriverMarkerColor(
    vehicleType
) {

    const colors = {
        police:
            "#2563eb",

        ambulance:
            "#dc2626",

        fire:
            "#ea580c"
    };

    return (
        colors[vehicleType] ||
        "#6b7280"
    );

}

function getDriverVehicleStatusName(
    vehicleStatus
) {

    const statuses = {
        active:
            "Disponibil",

        busy:
            "În misiune",

        inactive:
            "Indisponibil"
    };

    const normalizedStatus =
        String(
            vehicleStatus || ""
        ).toLowerCase();

    return (
        statuses[normalizedStatus]
        ||
        "Indisponibil"
    );

}

function getDriverVehicleTypeName(
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
        names[vehicleType] ||
        "Necunoscut"
    );

}


function getDriverReadableValue(
    value
) {

    const translations = {
        low:
            "Scăzută",

        medium:
            "Medie",

        high:
            "Ridicată",

        critical:
            "Critică",

        assigned:
            "Asignată",

        in_progress:
            "În desfășurare"
    };

    const normalized =
        String(
            value || ""
        ).toLowerCase();

    return (
        translations[normalized] ||
        normalized
            .replaceAll(
                "_",
                " "
            )
            .replaceAll(
                "-",
                " "
            )
            .replace(
                /\b\w/g,
                function (letter) {

                    return letter
                        .toUpperCase();

                }
            )
    );

}


function formatDriverNumber(
    value,
    decimals
) {

    const number =
        Number(
            value
        );

    if (
        !Number.isFinite(
            number
        )
    ) {

        return "-";

    }

    return number.toFixed(
        decimals
    );

}


function formatDriverDate(
    value
) {

    if (!value) {

        return "-";

    }

    const date =
        new Date(
            value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );

    }

    return date.toLocaleString(
        "ro-RO"
    );

}


function calculateDriverDistance(
    latitude1,
    longitude1,
    latitude2,
    longitude2
) {

    const earthRadiusKm =
        6371;

    const latitudeDifference =
        degreesToDriverRadians(
            latitude2 -
            latitude1
        );

    const longitudeDifference =
        degreesToDriverRadians(
            longitude2 -
            longitude1
        );

    const firstLatitude =
        degreesToDriverRadians(
            latitude1
        );

    const secondLatitude =
        degreesToDriverRadians(
            latitude2
        );

    const value =
        Math.sin(
            latitudeDifference / 2
        ) ** 2
        +
        Math.cos(
            firstLatitude
        )
        *
        Math.cos(
            secondLatitude
        )
        *
        Math.sin(
            longitudeDifference / 2
        ) ** 2;

    const angle =
        2
        *
        Math.atan2(
            Math.sqrt(
                value
            ),

            Math.sqrt(
                1 - value
            )
        );

    return (
        earthRadiusKm *
        angle
    );

}


function degreesToDriverRadians(
    degrees
) {

    return (
        degrees *
        Math.PI /
        180
    );

}


function escapeDriverHtml(
    value
) {

    const element =
        document.createElement(
            "div"
        );

    element.textContent =
        value === null ||
        value === undefined
            ? ""
            : String(
                value
            );

    return element.innerHTML;

}

/* =====================================
   ÎNCĂRCARE CERERI ÎNTĂRIRI
===================================== */

async function loadDriverReinforcementRequests() {

    if (!driverMission) {

        driverReinforcementRequest =
            null;

        driverReinforcementRequests =
            [];

        return;

    }

    try {

        const response =
            await window.driverApi
                .getReinforcementRequestHistory();

        const requests =
            Array.isArray(
                response?.requests
            )
                ?
                response.requests
                :
                [];

        /*
         * Păstrăm doar cererile misiunii
         * active în momentul acesta.
         */
        driverReinforcementRequests =
            requests.filter(
                function (
                    reinforcementRequest
                ) {

                    return (
                        Number(
                            reinforcementRequest
                                .incident_id
                        )
                        ===
                        Number(
                            driverMission.id
                        )
                    );

                }
            );

        /*
         * Endpoint-ul le trimite deja DESC,
         * dar păstrăm explicit ordinea.
         */
        driverReinforcementRequests.sort(
            function (
                requestA,
                requestB
            ) {

                return (
                    Number(
                        requestB.id
                    )
                    -
                    Number(
                        requestA.id
                    )
                );

            }
        );

        /*
         * Păstrăm și variabila veche pentru
         * compatibilitatea cu UI-ul existent.
         *
         * Prima cerere este cea mai nouă.
         */
        driverReinforcementRequest =
            driverReinforcementRequests[0]
            ||
            null;

    }

    catch (error) {

        console.error(
            (
                "Istoricul cererilor de întăriri "
                + "nu a putut fi încărcat:"
            ),
            error
        );

        /*
         * Dacă endpoint-ul de istoric are
         * temporar o problemă, încercăm
         * endpoint-ul vechi /latest.
         */
        try {

            const fallbackResponse =
                await window.driverApi
                    .getLatestReinforcementRequest();

            const latestRequest =
                fallbackResponse?.request
                ||
                null;

            if (
                latestRequest
                &&
                Number(
                    latestRequest.incident_id
                )
                ===
                Number(
                    driverMission.id
                )
            ) {

                driverReinforcementRequest =
                    latestRequest;

                driverReinforcementRequests =
                    [
                        latestRequest
                    ];

            }

            else {

                driverReinforcementRequest =
                    null;

                driverReinforcementRequests =
                    [];

            }

        }

        catch (
            fallbackError
        ) {

            console.error(
                (
                    "Nici ultima cerere de întăriri "
                    + "nu a putut fi încărcată:"
                ),
                fallbackError
            );

            driverReinforcementRequest =
                null;

            driverReinforcementRequests =
                [];

        }

    }

}


/* =====================================
   COMPATIBILITATE ÎNCĂRCARE ULTIMA CERERE
===================================== */

async function loadDriverReinforcementRequest() {

    await loadDriverReinforcementRequests();

}

/* =====================================
   AFIȘARE ISTORIC CERERI ÎNTĂRIRI
===================================== */
function displayDriverReinforcementHistory() {

    const historyContainer =
        document.getElementById(
            "driver-reinforcement-history"
        );

    if (!historyContainer) {

        return;

    }

    if (
        !Array.isArray(
            driverReinforcementRequests
        )
        ||
        driverReinforcementRequests.length === 0
    ) {

        historyContainer.hidden =
            true;

        historyContainer.innerHTML =
            "";

        return;

    }

    historyContainer.hidden =
        false;

    const historyHtml =
        driverReinforcementRequests
            .map(
                function (
                    reinforcementRequest,
                    index
                ) {

                    return (
                        createDriverReinforcementHistoryItem(
                            reinforcementRequest,
                            index
                        )
                    );

                }
            )
            .join("");

    historyContainer.innerHTML = `
        <div class="driver-reinforcement-history-heading">

            <strong>
                Cereri trimise
            </strong>

            <span>
                ${driverReinforcementRequests.length}
            </span>

        </div>

        <div class="driver-reinforcement-history-list">
            ${historyHtml}
        </div>
    `;

}

function createDriverReinforcementHistoryItem(
    reinforcementRequest,
    index
) {

    const requestStatus =
        String(
            reinforcementRequest?.status
            ||
            ""
        ).toLowerCase();

    const requestId =
        reinforcementRequest?.id
        ||
        (
            index + 1
        );

    const statusInformation =
        getDriverReinforcementHistoryStatus(
            requestStatus
        );

    

    const dispatcherMessage =
        String(
            reinforcementRequest
                ?.dispatcher_message
            ||
            ""
        ).trim();

    const createdAt =
        reinforcementRequest?.created_at
            ?
            formatDriverDate(
                reinforcementRequest.created_at
            )
            :
            "-";

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

    const resourcesHtml =
        visibleResources
            .map(
                function (
                    resource
                ) {

                    const vehicleType =
                        String(
                            resource?.vehicle_type
                            ||
                            ""
                        ).toLowerCase();

                    return `
                        <div class="driver-reinforcement-history-resource">

                            <span class="driver-reinforcement-history-resource-icon">
                                ${getDriverVehicleEmoji(
                                    vehicleType
                                )}
                            </span>

                            <div>

                                <strong>
                                    ${escapeDriverHtml(
                                        getDriverVehicleTypeName(
                                            vehicleType
                                        )
                                    )}
                                </strong>

                                <span>
                                    Aprobate:
                                    ${Number(
                                        resource?.approved_quantity
                                        ||
                                        0
                                    )}

                                    ·

                                    Asignate:
                                    ${Number(
                                        resource?.assigned_quantity
                                        ||
                                        0
                                    )}
                                </span>

                            </div>

                        </div>
                    `;

                }
            )
            .join("");

    return `
        <article class="
            driver-reinforcement-history-card
            ${escapeDriverHtml(
                statusInformation.className
            )}
        ">

            <div class="driver-reinforcement-history-card-header">

                <div>

                    <strong>
                        Cererea #${escapeDriverHtml(
                            requestId
                        )}
                    </strong>

                    <span>
                        ${escapeDriverHtml(
                            createdAt
                        )}
                    </span>

                </div>

                <span class="
                    driver-reinforcement-history-status
                    ${escapeDriverHtml(
                        statusInformation.className
                    )}
                ">
                    ${escapeDriverHtml(
                        statusInformation.label
                    )}
                </span>

            </div>

            <div class="driver-reinforcement-history-state">

                <span class="
                    driver-reinforcement-history-state-icon
                    ${escapeDriverHtml(
                        statusInformation.className
                    )}
                ">
                    ${statusInformation.icon}
                </span>

                <div>

                    <strong>
                        ${escapeDriverHtml(
                            statusInformation.title
                        )}
                    </strong>

                    <p>
                        ${escapeDriverHtml(
                            statusInformation.message
                        )}
                    </p>

                </div>

            </div>

            ${
    dispatcherMessage
        ?
        `
            <div class="
                driver-reinforcement-history-message
                dispatcher
            ">

                <span>
                    Mesajul dispecerului
                </span>

                <p>
                    ${escapeDriverHtml(
                        dispatcherMessage
                    )}
                </p>

            </div>
        `
        :
        ""
}

          

            ${
                resourcesHtml
                    ?
                    `
                        <div class="driver-reinforcement-history-resources">
                            ${resourcesHtml}
                        </div>
                    `
                    :
                    ""
            }

        </article>
    `;

}


function getDriverReinforcementHistoryStatus(
    status
) {

    const statuses = {

        pending: {
            label:
                "În așteptare",

            title:
                "Cerere în așteptare",

            message:
                "Cererea așteaptă o decizie din partea dispeceratului.",

            icon:
                "…",

            className:
                "pending"
        },

        partially_assigned: {
            label:
                "Parțial aprobată",

            title:
                "Cerere aprobată parțial",

            message:
                "O parte dintre echipajele aprobate au fost trimise.",

            icon:
                "✓",

            className:
                "accepted"
        },

        accepted: {
            label:
                "Acceptată",

            title:
                "Cerere acceptată",

            message:
                "Echipajele aprobate au fost trimise și sunt pe drum.",

            icon:
                "✓",

            className:
                "accepted"
        },

        rejected: {
            label:
                "Respinsă",

            title:
                "Cerere respinsă",

            message:
                "Dispeceratul nu a aprobat trimiterea echipajelor.",

            icon:
                "×",

            className:
                "rejected"
        },

        failed: {
            label:
                "Eșuată",

            title:
                "Cererea nu a putut fi procesată",

            message:
                "Nu au fost disponibile resursele solicitate.",

            icon:
                "!",

            className:
                "rejected"
        },

        cancelled: {
            label:
                "Anulată",

            title:
                "Cerere anulată",

            message:
                "Cererea a fost anulată.",

            icon:
                "−",

            className:
                "neutral"
        },

        completed: {
            label:
                "Finalizată",

            title:
                "Cerere finalizată",

            message:
                "Procesarea cererii a fost finalizată.",

            icon:
                "✓",

            className:
                "completed"
        }

    };

    return (
        statuses[
            String(
                status
                ||
                ""
            ).toLowerCase()
        ]
        ||
        {
            label:
                "În procesare",

            title:
                "Cerere în procesare",

            message:
                "Cererea este procesată.",

            icon:
                "…",

            className:
                "pending"
        }
    );

}

/* =====================================
   AFIȘARE SECȚIUNE ÎNTĂRIRI
===================================== */

function displayDriverReinforcementSection() {

    const section =
        document.getElementById(
            "driver-reinforcement-section"
        );

    const requestForm =
        document.getElementById(
            "driver-reinforcement-request-form"
        );

    const statusBadge =
        document.getElementById(
            "driver-reinforcement-status-badge"
        );

    const requestButton =
        document.getElementById(
            "driver-request-reinforcement-button"
        );

    const historyContainer =
        document.getElementById(
            "driver-reinforcement-history"
        );

    if (
        !section
        ||
        !requestForm
        ||
        !statusBadge
    ) {

        return;

    }


    /* =====================================
       FĂRĂ MISIUNE
    ===================================== */

    section.hidden =
        !driverMission;

    if (!driverMission) {

        requestForm.hidden =
            false;

        if (historyContainer) {

            historyContainer.hidden =
                true;

            historyContainer.innerHTML =
                "";

        }

        return;

    }


    /* =====================================
       MISIUNE ACTIVĂ
    ===================================== */

    requestForm.hidden =
        false;

    if (requestButton) {

        requestButton.disabled =
            false;

        requestButton.textContent =
            "Solicită întăriri";

    }


    /* =====================================
       CERERI ÎN CURS DE TRIMITERE
    ===================================== */

    if (
        driverReinforcementPendingSubmissions >
        0
    ) {

        statusBadge.textContent =
            (
                driverReinforcementPendingSubmissions === 1
                    ?
                    "Se trimite 1 cerere"
                    :
                    (
                        "Se trimit "
                        + driverReinforcementPendingSubmissions
                        + " cereri"
                    )
            );

        statusBadge.className =
            (
                "driver-reinforcement-status-badge "
                + "pending"
            );

    }

    else {

        statusBadge.textContent =
            "Disponibil";

        statusBadge.className =
            (
                "driver-reinforcement-status-badge "
                + "neutral"
            );

    }


    /* =====================================
       TOATE CERERILE
    ===================================== */

    displayDriverReinforcementHistory();

}


/* =====================================
   MESAJ DISPECER
===================================== */

function displayDriverReinforcementDispatcherMessage(
    reinforcementRequest,
    container,
    textElement
) {

    const dispatcherMessage =
        String(
            reinforcementRequest
                ?.dispatcher_message
            ||
            ""
        ).trim();

    if (!dispatcherMessage) {

        container.hidden =
            true;

        textElement.textContent =
            "-";

        return;

    }

    container.hidden =
        false;

    textElement.textContent =
        dispatcherMessage;

}


/* =====================================
   RESURSE APROBATE
===================================== */

function displayDriverReinforcementResources(
    reinforcementRequest,
    container
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
            function (resource) {

                return (
                    Number(
                        resource.approved_quantity
                    ) > 0
                    ||
                    Number(
                        resource.assigned_quantity
                    ) > 0
                );

            }
        );

    if (
        visibleResources.length ===
        0
    ) {

        container.hidden =
            true;

        container.innerHTML =
            "";

        return;

    }

    container.hidden =
        false;

    container.innerHTML =
        visibleResources
            .map(
                function (resource) {

                    const vehicleType =
                        String(
                            resource.vehicle_type
                            ||
                            ""
                        ).toLowerCase();

                    const typeNames = {
                        police:
                            "Poliție",

                        ambulance:
                            "Ambulanță",

                        fire:
                            "Pompieri"
                    };

                    const emojis = {
                        police:
                            "🚓",

                        ambulance:
                            "🚑",

                        fire:
                            "🚒"
                    };

                    return `
                        <div class="driver-reinforcement-resource">

                            <span>
                                ${
                                    emojis[vehicleType]
                                    ||
                                    "🚗"
                                }
                            </span>

                            <div>

                                <strong>
                                    ${
                                        typeNames[vehicleType]
                                        ||
                                        "Vehicul"
                                    }
                                </strong>

                                <small>
                                    Aprobate:
                                    ${
                                        Number(
                                            resource
                                                .approved_quantity
                                        )
                                    }
                                    · Asignate:
                                    ${
                                        Number(
                                            resource
                                                .assigned_quantity
                                        )
                                    }
                                </small>

                            </div>

                        </div>
                    `;

                }
            )
            .join("");

}


/* =====================================
   TRIMITERE CERERE
===================================== */

async function submitDriverReinforcementRequest() {

    if (!driverMission) {

        alert(
            (
                "Întăririle pot fi solicitate "
                + "doar în timpul unei misiuni active."
            )
        );

        return;

    }

    const messageInput =
        document.getElementById(
            "driver-reinforcement-message"
        );

    const requestedMessage =
        String(
            messageInput?.value
            ||
            ""
        ).trim();

    if (
        requestedMessage.length >
        1000
    ) {

        alert(
            (
                "Mesajul cererii de întăriri "
                + "nu poate depăși 1000 de caractere."
            )
        );

        return;

    }

    /*
     * Fiecare solicitare este independentă.
     * Nu blocăm formularul în timp ce o cerere
     * anterioară este încă trimisă.
     */
    driverReinforcementPendingSubmissions +=
        1;

    /*
     * Salvăm mesajul în requestedMessage și golim
     * imediat câmpul, astfel încât șoferul să poată
     * scrie următoarea cerere fără să aștepte.
     */
    if (messageInput) {

        messageInput.value =
            "";

    }

    updateDriverReinforcementMessageCount();

    displayDriverReinforcementSection();

    try {

        await window.driverApi
            .createReinforcementRequest(
                requestedMessage
            );

        /*
         * Citim din nou ultima cerere de pe server.
         * Nu folosim direct răspunsul POST pentru că,
         * atunci când există mai multe cereri simultane,
         * răspunsurile pot ajunge într-o ordine diferită.
         */
        await loadDriverReinforcementRequest();

    }

    catch (error) {

        console.error(
            "Cererea de întăriri nu a putut fi trimisă:",
            error
        );

        alert(
            error.message
        );

    }

    finally {

        driverReinforcementPendingSubmissions =
            Math.max(
                0,
                driverReinforcementPendingSubmissions - 1
            );

        /*
         * Sincronizare finală după terminarea
         * acestei solicitări.
         */
        try {

            await loadDriverReinforcementRequest();

        }

        catch (error) {

            console.error(
                "Starea cererilor nu a putut fi actualizată:",
                error
            );

        }

        displayDriverReinforcementSection();

    }

}

/* =====================================
   CONTOR MESAJ
===================================== */

function updateDriverReinforcementMessageCount() {

    const messageInput =
        document.getElementById(
            "driver-reinforcement-message"
        );

    const messageCount =
        document.getElementById(
            "driver-reinforcement-message-count"
        );

    if (
        !messageInput
        ||
        !messageCount
    ) {

        return;

    }

    messageCount.textContent =
        `${messageInput.value.length} / 1000`;

}