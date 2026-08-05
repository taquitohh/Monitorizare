let map;

let vehicleMarkers = {};

let incidentLocationMarker = null;

let pendingIncidentLocation = null;

let incidentRouteLayer = null;

let routeStartMarker = null;

let routeEndMarker = null;


// =========================
// VEHICLE ICONS
// =========================

// =========================
// VEHICLE ICONS
// =========================

function createVehicleIcon(
    vehicleType,
    emoji
) {

    return L.divIcon({

        className:
            "vehicle-marker-wrapper",

        html: `
            <div class="
                vehicle-map-marker
                vehicle-map-marker-${vehicleType}
            ">
                <span class="vehicle-map-marker-icon">
                    ${emoji}
                </span>
            </div>
        `,

        iconSize: [
            46,
            52
        ],

        iconAnchor: [
            23,
            52
        ],

        popupAnchor: [
            0,
            -46
        ]

    });

}


const icons = {

    police:
        createVehicleIcon(
            "police",
            "🚓"
        ),

    ambulance:
        createVehicleIcon(
            "ambulance",
            "🚑"
        ),

    fire:
        createVehicleIcon(
            "fire",
            "🚒"
        )

};


// =========================
// INCIDENT ICON
// =========================

const incidentIcon = L.divIcon({

    className:
        "incident-marker-wrapper",

    html: `
        <div class="incident-marker">
            <span>!</span>
        </div>
    `,

    iconSize: [42, 42],

    iconAnchor: [21, 42],

    popupAnchor: [0, -38]

});


// =========================
// ROUTE START ICON
// =========================

const routeStartIcon = L.divIcon({

    className:
        "route-start-marker-wrapper",

    html: `
        <div class="route-start-marker">
            A
        </div>
    `,

    iconSize: [32, 32],

    iconAnchor: [16, 16],

    popupAnchor: [0, -18]

});


// =========================
// ROUTE END ICON
// =========================

const routeEndIcon = L.divIcon({

    className:
        "route-end-marker-wrapper",

    html: `
        <div class="route-end-marker">
            B
        </div>
    `,

    iconSize: [32, 32],

    iconAnchor: [16, 16],

    popupAnchor: [0, -18]

});


// =========================
// INITIALIZE MAP
// =========================

function initializeMap() {

    map = L.map(
        "map"
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
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);

}


// =========================
// INITIALIZE INCIDENT CLICK
// =========================

function initializeIncidentMapSelection() {

    map.on(
        "click",
        function (event) {

            if (
                !incidentLocationSelectionActive ||
                !activeIncidentId ||
                incidentLocationSaving
            ) {

                return;

            }

            pendingIncidentLocation = {

                latitude:
                    event.latlng.lat,

                longitude:
                    event.latlng.lng

            };

            showPendingIncidentLocation(
                pendingIncidentLocation
            );

        }
    );

}


// =========================
// VEHICLE POPUP CONTENT
// =========================

function getVehiclePopupContent(
    vehicle,
    latitude,
    longitude
) {

    return `
        <div class="vehicle-map-popup">

            <strong>
                ${vehicle.displayName}
            </strong>

            <br><br>

            <strong>Tip:</strong>
            ${getReadableStatus(vehicle.vehicle_type)}

            <br>

            <strong>Stare:</strong>
            ${getReadableStatus(vehicle.status)}

            <br>

            <strong>Viteză:</strong>
            ${vehicle.speed ?? "-"} km/h

            <br>

            <strong>Latitudine:</strong>
            ${latitude.toFixed(6)}

            <br>

            <strong>Longitudine:</strong>
            ${longitude.toFixed(6)}

        </div>
    `;

}


// =========================
// CREATE OR UPDATE MARKER
// =========================

function updateVehicleMarker(
    vehicle
) {

    const vehicleId =
        vehicle.vehicle_code;

    const latitude =
        parseFloat(
            vehicle.latitude
        );

    const longitude =
        parseFloat(
            vehicle.longitude
        );

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        const invalidMarker =
            vehicleMarkers[
                vehicleId
            ];

        if (
            invalidMarker &&
            map.hasLayer(
                invalidMarker
            )
        ) {

            map.removeLayer(
                invalidMarker
            );

        }

        return null;
    }

    const position = [
        latitude,
        longitude
    ];

    const vehicleIcon =
        icons[
            vehicle.vehicle_type
        ] ||
        icons.police;

    const popupContent =
        getVehiclePopupContent(
            vehicle,
            latitude,
            longitude
        );

    let marker =
        vehicleMarkers[
            vehicleId
        ];

    /*
     * Markerul este creat o singură dată.
     * La actualizări îi schimbăm doar
     * poziția, iconița și popup-ul.
     */
    if (!marker) {

        marker =
            L.marker(
                position,
                {
                    icon:
                        vehicleIcon
                }
            );

        marker.bindPopup(
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

        vehicleMarkers[
            vehicleId
        ] = marker;

    }

    else {

        marker.setLatLng(
            position
        );

        marker.setIcon(
            vehicleIcon
        );

        if (marker.getPopup()) {

            marker.setPopupContent(
                popupContent
            );

        }

        else {

            marker.bindPopup(
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

        }

    }

    return marker;

}


// =========================
// UPDATE VISIBLE MARKERS
// =========================

function updateVisibleMarkers(
    vehicleList
) {

    /*
     * În timpul selectării locației
     * incidentului ascundem vehiculele.
     */
    if (
        incidentLocationSelectionActive
    ) {

        removeVehicleMarkersFromMap();

        return;

    }

    const visibleVehicleIds =
        new Set(
            vehicleList.map(
                function (vehicle) {

                    return (
                        vehicle.vehicle_code
                    );

                }
            )
        );

    /*
     * Ascundem marker-ele care nu mai
     * sunt incluse în filtrarea curentă.
     */
    Object.keys(
        vehicleMarkers
    ).forEach(
        function (vehicleId) {

            const marker =
                vehicleMarkers[
                    vehicleId
                ];

            if (
                !visibleVehicleIds.has(
                    vehicleId
                )
            ) {

                if (
                    map.hasLayer(
                        marker
                    )
                ) {

                    map.removeLayer(
                        marker
                    );

                }

            }

        }
    );

    /*
     * Creăm sau actualizăm marker-ele
     * vehiculelor vizibile.
     */
    vehicleList.forEach(
        function (vehicle) {

            const marker =
                updateVehicleMarker(
                    vehicle
                );

            if (!marker) {

                return;

            }

            if (
                !map.hasLayer(
                    marker
                )
            ) {

                marker.addTo(
                    map
                );

            }

        }
    );

    /*
     * Nu deschidem popup-uri automat aici.
     * Funcția rulează la fiecare secundă.
     */

}


// =========================
// REMOVE VEHICLE MARKERS
// =========================

function removeVehicleMarkersFromMap() {

    Object.values(
        vehicleMarkers
    ).forEach(
        function (marker) {

            if (
                map.hasLayer(
                    marker
                )
            ) {

                map.removeLayer(
                    marker
                );

            }

        }
    );

}


// =========================
// FOCUS VEHICLE
// =========================

function focusVehicle(
    vehicle
) {

    const latitude =
        parseFloat(
            vehicle.latitude
        );

    const longitude =
        parseFloat(
            vehicle.longitude
        );

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        return;

    }

    const marker =
        updateVehicleMarker(
            vehicle
        );

    if (!marker) {

        return;

    }

    if (
        !map.hasLayer(
            marker
        )
    ) {

        marker.addTo(
            map
        );

    }

    map.setView(
        [
            latitude,
            longitude
        ],
        16
    );

    marker.openPopup();

}


// =========================
// START INCIDENT SELECTION
// =========================

function startIncidentLocationSelection(
    incident
) {

    activeIncidentId =
        incident.id;

    activeIncidentCode =
        incident.incident_code;

    activeIncidentLocation =
        null;

    pendingIncidentLocation =
        null;

    incidentLocationSelectionActive =
        true;

    recommendationModeActive =
        false;

    recommendedVehicle =
        null;

    recommendedVehicleDistance =
        null;

    selectedVehicleId =
        null;

    hideRecommendationPanel();

    clearIncidentRoute();

    removeVehicleMarkersFromMap();

    removeIncidentMarker();

    const mapElement =
        document.getElementById(
            "map"
        );

    const message =
        document.getElementById(
            "map-selection-message"
        );

    if (mapElement) {

        mapElement.classList.add(
            "incident-selection-active"
        );

    }

    if (message) {

        message.classList.add(
            "show"
        );

        message.textContent =
            `Selectează locația pentru ${incident.incident_code}`;

    }

    map.closePopup();

    map.setView(
        [
            44.4268,
            26.1025
        ],
        13
    );

}


// =========================
// PENDING INCIDENT LOCATION
// =========================

function showPendingIncidentLocation(
    location
) {

    removeIncidentMarker();

    incidentLocationMarker =
        L.marker(
            [
                location.latitude,
                location.longitude
            ],
            {
                icon:
                    incidentIcon,

                zIndexOffset:
                    2000
            }
        ).addTo(map);

    incidentLocationMarker
        .bindPopup(
            `
                <div class="incident-confirmation">

                    <strong>
                        Confirmă locația incidentului
                    </strong>

                    <div class="incident-coordinates">

                        Latitudine:
                        ${location.latitude.toFixed(6)}

                        <br>

                        Longitudine:
                        ${location.longitude.toFixed(6)}

                    </div>

                    <p>
                        Dorești să folosești această locație?
                    </p>

                    <div class="incident-confirmation-actions">

                        <button
                            type="button"
                            class="incident-confirm-yes"
                            onclick="confirmIncidentLocation()"
                        >
                            Da
                        </button>

                        <button
                            type="button"
                            class="incident-confirm-no"
                            onclick="rejectIncidentLocation()"
                        >
                            Nu
                        </button>

                    </div>

                </div>
            `,
            {
                closeOnClick:
                    false,

                closeButton:
                    false,

                autoClose:
                    false
            }
        )
        .openPopup();

}


// =========================
// CONFIRM INCIDENT LOCATION
// =========================

window.confirmIncidentLocation =
async function () {

    if (
        !pendingIncidentLocation ||
        !activeIncidentId ||
        incidentLocationSaving
    ) {

        return;

    }

    setIncidentLocationSavingState(
        true
    );

    try {

        const result =
            await window.updateIncidentLocation(
                activeIncidentId,
                pendingIncidentLocation
            );

        const incident =
            result.incident;

        activeIncidentLocation = {

            latitude:
                parseFloat(
                    incident.latitude
                ),

            longitude:
                parseFloat(
                    incident.longitude
                )

        };

        pendingIncidentLocation =
            null;

        incidentLocationSelectionActive =
            false;

        finishIncidentLocationSelection(
            incident
        );

        await loadRecommendedVehicle(
            incident.id
        );

    }

    catch (error) {

        console.error(
            "Incident location error:",
            error
        );

        alert(
            error.message
        );

        incidentLocationSelectionActive =
            true;

    }

    finally {

        setIncidentLocationSavingState(
            false
        );

    }

};


// =========================
// REJECT INCIDENT LOCATION
// =========================

window.rejectIncidentLocation =
function () {

    if (incidentLocationSaving) {

        return;

    }

    pendingIncidentLocation =
        null;

    removeIncidentMarker();

    const message =
        document.getElementById(
            "map-selection-message"
        );

    if (message) {

        message.classList.add(
            "show"
        );

        message.textContent =
            "Locația nu a fost confirmată. Selectează alt punct.";

    }

};


// =========================
// REMOVE INCIDENT MARKER
// =========================

function removeIncidentMarker() {

    if (
        incidentLocationMarker &&
        map.hasLayer(
            incidentLocationMarker
        )
    ) {

        map.removeLayer(
            incidentLocationMarker
        );

    }

    incidentLocationMarker =
        null;

}


// =========================
// FINISH LOCATION SELECTION
// =========================

function finishIncidentLocationSelection(
    incident
) {

    const mapElement =
        document.getElementById(
            "map"
        );

    const message =
        document.getElementById(
            "map-selection-message"
        );

    const formStatus =
        document.querySelector(
            ".incident-form-status"
        );

    if (mapElement) {

        mapElement.classList.remove(
            "incident-selection-active"
        );

    }

    if (message) {

        message.classList.remove(
            "show"
        );

        message.textContent =
            "";

    }

    if (formStatus) {

        formStatus.textContent =
            "Location saved";

    }

    if (incidentLocationMarker) {

        /*
         * Eliminăm complet vechiul popup
         * care conținea confirmarea și
         * butoanele Da / Nu.
         */
        incidentLocationMarker
            .closePopup();

        incidentLocationMarker
            .unbindPopup();

        /*
         * Adăugăm un popup nou care
         * conține doar detaliile salvate.
         */
        incidentLocationMarker
            .bindPopup(
                `
                    <div class="incident-saved-popup">

                        <strong>
                            ${incident.incident_code}
                        </strong>

                        <br><br>

                        <strong>
                            Incident location saved
                        </strong>

                        <br><br>

                        <strong>Status:</strong>
                        ${incident.status}

                        <br>

                        <strong>Latitude:</strong>
                        ${parseFloat(
                            incident.latitude
                        ).toFixed(6)}

                        <br>

                        <strong>Longitude:</strong>
                        ${parseFloat(
                            incident.longitude
                        ).toFixed(6)}

                    </div>
                `,
                {
                    closeButton:
                        true,

                    closeOnClick:
                        false,

                    autoClose:
                        false
                }
            )
            .openPopup();

    }

}


// =========================
// LOCATION SAVING STATE
// =========================

function setIncidentLocationSavingState(
    saving
) {

    incidentLocationSaving =
        saving;

    const message =
        document.getElementById(
            "map-selection-message"
        );

    if (!message) {

        return;

    }

    if (saving) {

        message.classList.add(
            "show"
        );

        message.textContent =
            "Se salvează locația incidentului...";

    }

}


// =========================
// SHOW SAVED INCIDENT
// =========================

function displayIncidentLocationMarker(
    incident
) {

    if (!incident) {

        return;

    }

    const latitude =
        Number(
            incident.latitude
        );

    const longitude =
        Number(
            incident.longitude
        );

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        throw new Error(
            "Incidentul nu are coordonate valide."
        );

    }

    clearIncidentRoute();

    removeIncidentMarker();

    incidentLocationMarker =
        L.marker(
            [
                latitude,
                longitude
            ],
            {
                icon:
                    incidentIcon,

                zIndexOffset:
                    2500
            }
        ).addTo(map);

    const readableStatus =
        typeof getReadableStatus ===
        "function"
            ?
            getReadableStatus(
                incident.status
            )
            :
            incident.status;

    const readableType =
        typeof getReadableStatus ===
        "function"
            ?
            getReadableStatus(
                incident.incident_type
            )
            :
            incident.incident_type;

    const readablePriority =
        typeof getReadableStatus ===
        "function"
            ?
            getReadableStatus(
                incident.priority
            )
            :
            incident.priority;

    const safeText =
        function (value) {

            if (
                typeof escapeHtml ===
                "function"
            ) {

                return escapeHtml(
                    value ?? "-"
                );

            }

            return String(
                value ?? "-"
            );

        };

    incidentLocationMarker.bindPopup(
        `
            <div class="incident-saved-popup">

                <strong>
                    ${safeText(
                        incident.incident_code
                    )}
                </strong>

                <br><br>

                <strong>Title:</strong>
                ${safeText(
                    incident.title
                )}

                <br>

                <strong>Status:</strong>
                ${safeText(
                    readableStatus
                )}

                <br>

                <strong>Type:</strong>
                ${safeText(
                    readableType
                )}

                <br>

                <strong>Priority:</strong>
                ${safeText(
                    readablePriority
                )}

                <br><br>

                <strong>Latitude:</strong>
                ${latitude.toFixed(6)}

                <br>

                <strong>Longitude:</strong>
                ${longitude.toFixed(6)}

            </div>
        `,
        {
            closeButton:
                true,

            autoClose:
                false,

            closeOnClick:
                false
        }
    );

    map.setView(
        [
            latitude,
            longitude
        ],
        16
    );

    incidentLocationMarker.openPopup();

}

// =========================
// DISPLAY INCIDENT ROUTE
// =========================

function displayIncidentRoute(
    routeData
) {

    clearIncidentRoute();

    if (
        !routeData ||
        !Array.isArray(
            routeData.coordinates
        ) ||
        routeData.coordinates.length < 2
    ) {

        throw new Error(
            "The route does not contain valid coordinates."
        );

    }

    const routeCoordinates =
        routeData.coordinates
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
                            coordinate.latitude
                        ),
                        Number(
                            coordinate.longitude
                        )
                    ];

                }
            )
            .filter(
                function (coordinate) {

                    return (
                        Number.isFinite(
                            coordinate[0]
                        )
                        &&
                        Number.isFinite(
                            coordinate[1]
                        )
                    );

                }
            );

    if (
        routeCoordinates.length < 2
    ) {

        throw new Error(
            "The route coordinates are invalid."
        );

    }

    /*
     * Traseul real calculat de NetworkX.
     */
    incidentRouteLayer =
        L.polyline(
            routeCoordinates,
            {
                color:
                    "#7d3c98",

                weight:
                    6,

                opacity:
                    0.9,

                lineJoin:
                    "round",

                lineCap:
                    "round"
            }
        ).addTo(map);

    const startCoordinate =
        routeCoordinates[0];

    const endCoordinate =
        routeCoordinates[
            routeCoordinates.length - 1
        ];

    /*
     * Marker A — poziția vehiculului.
     */
    routeStartMarker =
        L.marker(
            startCoordinate,
            {
                icon:
                    routeStartIcon,

                zIndexOffset:
                    2500
            }
        ).addTo(map);

    routeStartMarker.bindPopup(
        `
            <div class="route-point-popup">

                <strong>
                    Route start
                </strong>

                <br>

                Vehicle:
                ${
                    routeData.vehicle_code
                    ||
                    recommendedVehicle?.vehicle_code
                    ||
                    "-"
                }

                <br>

                Latitude:
                ${startCoordinate[0].toFixed(6)}

                <br>

                Longitude:
                ${startCoordinate[1].toFixed(6)}

            </div>
        `,
        {
            closeButton:
                true,

            autoClose:
                false,

            closeOnClick:
                false
        }
    );

    /*
     * Marker B — locația incidentului.
     */
    routeEndMarker =
        L.marker(
            endCoordinate,
            {
                icon:
                    routeEndIcon,

                zIndexOffset:
                    2600
            }
        ).addTo(map);

    routeEndMarker.bindPopup(
        `
            <div class="route-point-popup">

                <strong>
                    Incident destination
                </strong>

                <br>

                Incident:
                ${
                    routeData.incident_code
                    ||
                    activeIncidentCode
                    ||
                    "-"
                }

                <br>

                Latitude:
                ${endCoordinate[0].toFixed(6)}

                <br>

                Longitude:
                ${endCoordinate[1].toFixed(6)}

            </div>
        `,
        {
            closeButton:
                true,

            autoClose:
                false,

            closeOnClick:
                false
        }
    );

    /*
     * Actualizăm popup-ul markerului
     * incidentului existent.
     */
    if (incidentLocationMarker) {

        incidentLocationMarker
            .setLatLng(
                endCoordinate
            );

    }

    /*
     * Harta face zoom astfel încât întreg
     * traseul să fie vizibil.
     */
    const routeBounds =
        incidentRouteLayer
            .getBounds();

    if (
        routeBounds.isValid()
    ) {

        map.fitBounds(
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

}


// =========================
// CLEAR INCIDENT ROUTE
// =========================

function clearIncidentRoute() {

    if (
        incidentRouteLayer &&
        map.hasLayer(
            incidentRouteLayer
        )
    ) {

        map.removeLayer(
            incidentRouteLayer
        );

    }

    if (
        routeStartMarker &&
        map.hasLayer(
            routeStartMarker
        )
    ) {

        map.removeLayer(
            routeStartMarker
        );

    }

    if (
        routeEndMarker &&
        map.hasLayer(
            routeEndMarker
        )
    ) {

        map.removeLayer(
            routeEndMarker
        );

    }

    incidentRouteLayer =
        null;

    routeStartMarker =
        null;

    routeEndMarker =
        null;

}


// =========================
// LOAD AND DISPLAY ROUTE
// =========================

async function loadAndDisplayIncidentRoute(
    incidentId
) {

    if (!incidentId) {

        throw new Error(
            "Incident id is missing."
        );

    }

    const message =
        document.getElementById(
            "map-selection-message"
        );

    if (message) {

        message.classList.add(
            "show"
        );

        message.textContent =
            "Se calculează traseul către incident...";

    }

    try {

        const routeData =
            await window.getIncidentRoute(
                incidentId
            );

        displayIncidentRoute(
            routeData
        );

        if (message) {

            const distanceText =
                Number.isFinite(
                    Number(
                        routeData.distance_km
                    )
                )
                    ?
                    ` — ${Number(
                        routeData.distance_km
                    ).toFixed(2)} km`
                    :
                    "";

            message.textContent =
                `Traseul a fost calculat${distanceText}`;

            window.setTimeout(
                function () {

                    message.classList.remove(
                        "show"
                    );

                    message.textContent =
                        "";

                },
                2500
            );

        }

        return routeData;

    }

    catch (error) {

        clearIncidentRoute();

        if (message) {

            message.classList.add(
                "show"
            );

            message.textContent =
                "Traseul nu a putut fi calculat.";

        }

        throw error;

    }

}