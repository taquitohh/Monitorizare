/* =====================================
   STARE DASHBOARD ȘOFER
===================================== */

let driverCurrentUser = null;

let driverVehicle = null;

let driverMission = null;

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

        driverSameTypeVehicles =
            Array.isArray(
                dashboard.same_type_vehicles
            )
                ? dashboard.same_type_vehicles
                : [];

        displayDriverUser(
            driverCurrentUser
        );

        applyDriverTheme(
            driverVehicle?.vehicle_type
        );

        displayDriverOperationalSummary();

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
    `;

}


/* =====================================
   RUTĂ MISIUNE
===================================== */

async function updateDriverMissionRoute() {

    if (
        !driverMission ||
        !driverMission.id
    ) {

        driverRouteData =
            null;

        driverRouteIncidentId =
            null;

        clearDriverRoute();

        return;

    }

    try {

        const routeData =
            await window.driverApi
                .getMissionRoute(
                    driverMission.id
                );

        driverRouteData =
            routeData;

        driverRouteIncidentId =
            driverMission.id;

        displayDriverRoute(
            routeData
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
                    "Misiunea este activă, dar ruta nu a putut "
                    + "fi calculată: "
                    + error.message
                );

        }

        updateDriverRouteDistance();

    }

}


function displayDriverRoute(
    routeData
) {

    if (!driverMap) {

        return;

    }

    const routeCoordinates =
        normalizeDriverRouteCoordinates(
            routeData?.coordinates
        );

    if (
        routeCoordinates.length <
        2
    ) {

        throw new Error(
            "Ruta nu conține suficiente coordonate valide."
        );

    }

    clearDriverRoute();

    driverRouteLayer =
        L.polyline(
            routeCoordinates,
            {
                color:
                    getDriverMarkerColor(
                        driverVehicle?.vehicle_type
                    ),

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

    const startCoordinate =
        routeCoordinates[0];

    const endCoordinate =
        routeCoordinates[
            routeCoordinates.length - 1
        ];

    driverRouteStartMarker =
        L.circleMarker(
            startCoordinate,
            {
                radius:
                    8,

                color:
                    "#ffffff",

                weight:
                    3,

                fillColor:
                    getDriverMarkerColor(
                        driverVehicle?.vehicle_type
                    ),

                fillOpacity:
                    1
            }
        ).addTo(
            driverMap
        );

    driverRouteStartMarker.bindPopup(`
        <strong>
            Poziția vehiculului
        </strong>
        <br>
        ${escapeDriverHtml(
            driverVehicle?.vehicle_code ||
            routeData.vehicle_code ||
            "-"
        )}
    `);

    driverRouteEndMarker =
        L.circleMarker(
            endCoordinate,
            {
                radius:
                    10,

                color:
                    "#ffffff",

                weight:
                    3,

                fillColor:
                    "#7c3aed",

                fillOpacity:
                    1
            }
        ).addTo(
            driverMap
        );

    driverRouteEndMarker.bindPopup(`
        <strong>
            Destinația incidentului
        </strong>
        <br>
        ${escapeDriverHtml(
            driverMission?.incident_code ||
            routeData.incident_code ||
            "-"
        )}
        <br>
        ${escapeDriverHtml(
            driverMission?.title ||
            "Incident activ"
        )}
    `);

    if (
        !driverInitialMapPositionSet ||
        Number(driverRouteIncidentId) !==
        Number(driverMission?.id)
    ) {

        focusDriverRoute();

    }

    else if (
        driverRouteLayer &&
        driverRouteLayer.getBounds()
            .isValid()
    ) {

        const currentZoom =
            driverMap.getZoom();

        if (currentZoom < 11) {

            focusDriverRoute();

        }

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
        !driverMap ||
        !driverRouteLayer
    ) {

        return;

    }

    const routeBounds =
        driverRouteLayer.getBounds();

    if (!routeBounds.isValid()) {

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

    const allVisibleVehicles =
        [];

    if (driverVehicle) {

        allVisibleVehicles.push({
            ...driverVehicle,

            isOwnVehicle:
                true
        });

    }

    driverSameTypeVehicles.forEach(
        function (vehicle) {

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

                if (filterValue === "all") {

                    return true;

                }

                return (
                    vehicle.status ===
                    filterValue
                );

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
                ? "Misiune activă"
                : "Monitorizare activă";

    }

    if (mapMessage) {

        if (
            driverMission &&
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
        !driverInitialMapPositionSet &&
        driverVehicle &&
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


function updateDriverMissionMarker() {

    if (!driverMap) {

        return;

    }

    if (driverMissionMarker) {

        driverMap.removeLayer(
            driverMissionMarker
        );

        driverMissionMarker =
            null;

    }

    if (
        !driverMission ||
        !driverMissionHasLocation(
            driverMission
        )
    ) {

        return;

    }

    driverMissionMarker =
        L.circleMarker(
            [
                Number(
                    driverMission.latitude
                ),

                Number(
                    driverMission.longitude
                )
            ],
            {
                radius:
                    12,

                color:
                    "#ffffff",

                weight:
                    3,

                fillColor:
                    "#7c3aed",

                fillOpacity:
                    1
            }
        );

    driverMissionMarker.bindPopup(`
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
    `);

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