let map;

let vehicleMarkers = {};

let incidentLocationMarker = null;

let pendingIncidentLocation = null;

let incidentRouteLayers = [];

let routeStartMarkers = [];

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
// ROUTE COLORS
// =========================

const incidentRouteColors = {
    police:
        "#2563eb",

    ambulance:
        "#dc2626",

    fire:
        "#ea580c"
};


// =========================
// ROUTE SERVICE LABELS
// =========================

const incidentRouteLabels = {
    police:
        "Poliție",

    ambulance:
        "Ambulanță",

    fire:
        "Pompieri"
};


// =========================
// ROUTE START ICON BY TYPE
// =========================

function getRouteStartIcon(
    vehicleType
) {

    const normalizedType =
        String(
            vehicleType
            ||
            ""
        ).toLowerCase();

    const symbols = {
        police:
            "🚓",

        ambulance:
            "🚑",

        fire:
            "🚒"
    };

    const symbol =
        symbols[normalizedType]
        ||
        "●";

    return L.divIcon({
        className:
            "route-vehicle-start-wrapper",

        html: `
            <div
                class="
                    route-vehicle-start
                    route-vehicle-start-${escapeHtml(
                        normalizedType
                    )}
                "
            >
                ${symbol}
            </div>
        `,

        iconSize:
            [
                38,
                38
            ],

        iconAnchor:
            [
                19,
                19
            ],

        popupAnchor:
            [
                0,
                -22
            ]
    });

}

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
// SELECT VEHICLE FROM MAP
// =========================

function selectVehicleFromMap(
    vehicle
) {

    if (
        !vehicle
        ||
        !vehicle.vehicle_code
    ) {

        return;

    }


    const vehicleCode =
        String(
            vehicle.vehicle_code
        ).trim();


    /*
     * Încercăm să folosim datele cele
     * mai recente din lista globală.
     *
     * Este important în tabul Incidente,
     * deoarece vehiculul de pe rută poate
     * avea date mai vechi decât refresh-ul
     * GPS curent.
     */

    const liveVehicle =
        Array.isArray(
            vehicles
        )
            ?
            vehicles.find(
                function (
                    currentVehicle
                ) {

                    return (
                        String(
                            currentVehicle.vehicle_code
                        ).trim()
                        ===
                        vehicleCode
                    );

                }
            )
            :
            null;


    const selectedVehicle =
        liveVehicle
        ||
        vehicle;


    selectedVehicleId =
        vehicleCode;


    /*
     * Completăm panoul
     * "Vehicul selectat".
     */

    if (
        typeof displayVehicleDetails ===
        "function"
    ) {

        displayVehicleDetails(
            selectedVehicle
        );

    }


    /*
     * Ne asigurăm explicit că panoul
     * este vizibil în:
     *
     * - Vehicule
     * - Incidente
     *
     * Nu îl afișăm în Cereri.
     */

    const vehicleDetailsPanel =
        document.getElementById(
            "vehicle-details-panel"
        );


    if (
        vehicleDetailsPanel
        &&
        sidebarMode !==
        "requests"
    ) {

        vehicleDetailsPanel.hidden =
            false;

    }


    /*
     * Dacă suntem în lista Vehicule,
     * actualizăm și cardul selectat.
     *
     * În Incidente NU schimbăm tabul
     * și NU ștergem ruta incidentului.
     */

    if (
        sidebarMode ===
        "vehicles"
        &&
        typeof displayVehicles ===
        "function"
    ) {

        displayVehicles(
            filteredVehicles
        );

    }

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


    /*
     * Păstrăm datele curente ale
     * vehiculului pe marker.
     */

    marker._dispatcherVehicleData =
        vehicle;


    /*
     * Click pe marker:
     * afișăm și Vehicul selectat.
     */

    marker.on(
        "click",
        function () {

            selectVehicleFromMap(
                marker._dispatcherVehicleData
            );

        }
    );
        marker.bindPopup(
            popupContent,
            {
            
                closeButton:
                    true,

                autoClose:
                    true,

                closeOnClick:
                    true,

                autoPan:
                    false
            }
        );

        vehicleMarkers[
            vehicleId
        ] = marker;

    }

    else {
        marker._dispatcherVehicleData =
    vehicle;

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
                        true,

                    closeOnClick:
                        true,

                    autoPan:
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
// CLOSE VEHICLE POPUPS
// =========================

function closeAllVehiclePopups(
    exceptVehicleId = null
) {

    Object.entries(
        vehicleMarkers
    ).forEach(
        function (
            [
                vehicleId,
                marker
            ]
        ) {

            if (
                exceptVehicleId !== null &&
                vehicleId === exceptVehicleId
            ) {

                return;

            }

            if (
                marker &&
                marker.isPopupOpen()
            ) {

                marker.closePopup();

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

    const vehicleId =
        vehicle.vehicle_code;

    /*
     * Închidem popup-ul oricărui vehicul
     * selectat anterior.
     */
    closeAllVehiclePopups(
        vehicleId
    );

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

    /*
     * Oprim orice animație începută pentru
     * vehiculul selectat anterior.
     */
    map.stop();

    /*
     * Centrăm harta exclusiv pe noul vehicul.
     */
    map.setView(
        [
            latitude,
            longitude
        ],
        16,
        {
            animate:
                true
        }
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

        dispatcherWorkspaceMode =
    "incident_location";

if (
    typeof refreshDispatcherWorkspace ===
    "function"
) {

    refreshDispatcherWorkspace();

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


    dispatcherWorkspaceMode =
    "assignment";

if (
    typeof refreshDispatcherWorkspace ===
    "function"
) {

    refreshDispatcherWorkspace();

}

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
// NORMALIZE ROUTE COORDINATES
// =========================

function normalizeIncidentRouteCoordinates(
    coordinates
) {

    if (
        !Array.isArray(
            coordinates
        )
    ) {

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
                    )
                    &&
                    Number.isFinite(
                        coordinate[1]
                    )
                );

            }
        );

}


// =========================
// ROUTE COLOR
// =========================

function getIncidentRouteColor(
    vehicleType
) {

    const normalizedType =
        String(
            vehicleType
            ||
            ""
        ).toLowerCase();

    return (
        incidentRouteColors[
            normalizedType
        ]
        ||
        "#7c3aed"
    );

}


// =========================
// ROUTE LABEL
// =========================

function getIncidentRouteLabel(
    vehicleType
) {

    const normalizedType =
        String(
            vehicleType
            ||
            ""
        ).toLowerCase();

    return (
        incidentRouteLabels[
            normalizedType
        ]
        ||
        getReadableStatus(
            normalizedType
        )
    );

}

// =========================
// DISPLAY ALL INCIDENT ROUTES
// =========================

function displayIncidentRoutes(
    routeData
) {

    clearIncidentRoute();

    if (
        !routeData
        ||
        !Array.isArray(
            routeData.routes
        )
        ||
        routeData.routes.length === 0
    ) {

        throw new Error(
            "Incidentul nu conține rute valide."
        );

    }

    removeVehicleMarkersFromMap();

    const allMapLayers = [];

    const assignedVehicleCodes =
        new Set();

    let destinationCoordinate =
        null;

    routeData.routes.forEach(
        function (
            vehicleRoute
        ) {

            const routeCoordinates =
                normalizeIncidentRouteCoordinates(
                    vehicleRoute.coordinates
                );

            if (
                routeCoordinates.length < 2
            ) {

                return;

            }

            const vehicleType =
                String(
                    vehicleRoute.vehicle_type
                    ||
                    ""
                ).toLowerCase();

            const vehicleCode =
                String(
                    vehicleRoute.vehicle_code
                    ||
                    ""
                ).trim();

            if (!vehicleCode) {

                return;

            }

            assignedVehicleCodes.add(
                vehicleCode
            );

            const routeColor =
                getIncidentRouteColor(
                    vehicleType
                );


            /* =========================
               TRASEUL VEHICULULUI
            ========================= */

            const routeLayer =
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
                    map
                );

            routeLayer.bindPopup(
                `
                    <div class="route-point-popup">

                        <strong>
                            ${escapeHtml(
                                getIncidentRouteLabel(
                                    vehicleType
                                )
                            )}
                        </strong>

                        <br>

                        Vehicul:
                        ${escapeHtml(
                            vehicleCode
                        )}

                        <br>

                        Distanță:
                        ${
                            Number.isFinite(
                                Number(
                                    vehicleRoute.distance_km
                                )
                            )
                                ?
                                `${Number(
                                    vehicleRoute.distance_km
                                ).toFixed(2)} km`
                                :
                                "-"
                        }

                    </div>
                `
            );

            incidentRouteLayers.push(
                routeLayer
            );

            allMapLayers.push(
                routeLayer
            );


            /* =========================
               MARKERUL REAL AL VEHICULULUI
            ========================= */

            const backendLatitude =
                Number(
                    vehicleRoute.vehicle_latitude
                );

            const backendLongitude =
                Number(
                    vehicleRoute.vehicle_longitude
                );

            const markerLatitude =
                Number.isFinite(
                    backendLatitude
                )
                    ?
                    backendLatitude
                    :
                    routeCoordinates[0][0];

            const markerLongitude =
                Number.isFinite(
                    backendLongitude
                )
                    ?
                    backendLongitude
                    :
                    routeCoordinates[0][1];

            const vehicleForMarker = {
                id:
                    vehicleRoute.vehicle_id,

                vehicle_code:
                    vehicleCode,

                displayName:
                    getVehicleDisplayName(
                        vehicleCode
                    ),

                vehicle_type:
                    vehicleType,

                status:
                    vehicleRoute.vehicle_status
                    ||
                    "busy",

                speed:
                    vehicleRoute.vehicle_speed
                    ??
                    0,

                latitude:
                    markerLatitude,

                longitude:
                    markerLongitude,

                updated_at:
                    vehicleRoute.position_updated_at
                    ||
                    null
            };

            const vehicleMarker =
                updateVehicleMarker(
                    vehicleForMarker
                );

            if (vehicleMarker) {

                if (
                    !map.hasLayer(
                        vehicleMarker
                    )
                ) {

                    vehicleMarker.addTo(
                        map
                    );

                }

                vehicleMarker.setLatLng(
                    [
                        markerLatitude,
                        markerLongitude
                    ]
                );

                vehicleMarker.setZIndexOffset(
                    3000
                );

                allMapLayers.push(
                    vehicleMarker
                );

            }

            destinationCoordinate =
                routeCoordinates[
                    routeCoordinates.length - 1
                ];

        }
    );


    /* =========================
       ASCUNDEM VEHICULELE NEASIGNATE
    ========================= */

    Object.keys(
        vehicleMarkers
    ).forEach(
        function (
            vehicleCode
        ) {

            if (
                assignedVehicleCodes.has(
                    vehicleCode
                )
            ) {

                return;

            }

            const marker =
                vehicleMarkers[
                    vehicleCode
                ];

            if (
                marker
                &&
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


    if (
        incidentRouteLayers.length === 0
        ||
        !destinationCoordinate
    ) {

        throw new Error(
            "Nicio rută validă nu a putut fi afișată."
        );

    }


    /* =========================
       MARKERUL INCIDENTULUI
    ========================= */

    /*
     * Nu mai folosim markerul B.
     * Păstrăm markerul mov cu semnul exclamării.
     */

    if (
        incidentLocationMarker
        &&
        map.hasLayer(
            incidentLocationMarker
        )
    ) {

        map.removeLayer(
            incidentLocationMarker
        );

    }

    incidentLocationMarker =
        L.marker(
            destinationCoordinate,
            {
                icon:
                    incidentIcon,

                zIndexOffset:
                    3500
            }
        ).addTo(
            map
        );

    incidentLocationMarker.bindPopup(
        `
            <div class="incident-saved-popup">

                <strong>
                    ${escapeHtml(
                        routeData.incident_code
                        ||
                        activeIncidentCode
                        ||
                        "-"
                    )}
                </strong>

                <br><br>

                <strong>
                    Destinația incidentului
                </strong>

                <br>

                Echipaje pe traseu:
                ${incidentRouteLayers.length}

                <br>

                Latitudine:
                ${destinationCoordinate[0].toFixed(6)}

                <br>

                Longitudine:
                ${destinationCoordinate[1].toFixed(6)}

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

    allMapLayers.push(
        incidentLocationMarker
    );


    /* =========================
       ÎNCADRAREA HĂRȚII
    ========================= */

    const routeGroup =
        L.featureGroup(
            allMapLayers
        );

    const routeBounds =
        routeGroup.getBounds();

    if (
        routeBounds.isValid()
    ) {

        map.fitBounds(
            routeBounds,
            {
                padding:
                    [
                        55,
                        55
                    ],

                maxZoom:
                    15
            }
        );

    }

}

// =========================
// SINGLE ROUTE COMPATIBILITY
// =========================

function displayIncidentRoute(
    routeData
) {

    if (
        routeData
        &&
        Array.isArray(
            routeData.routes
        )
    ) {

        displayIncidentRoutes(
            routeData
        );

        return;

    }

    if (
        routeData
        &&
        Array.isArray(
            routeData.coordinates
        )
    ) {

        displayIncidentRoutes({
            incident_code:
                routeData.incident_code,

            routes: [
                routeData
            ]
        });

        return;

    }

    throw new Error(
        "Datele rutei nu sunt valide."
    );

}

// =========================
// CLEAR ALL INCIDENT ROUTES
// =========================

function clearIncidentRoute() {

    incidentRouteLayers.forEach(
        function (
            routeLayer
        ) {

            if (
                routeLayer
                &&
                map.hasLayer(
                    routeLayer
                )
            ) {

                map.removeLayer(
                    routeLayer
                );

            }

        }
    );

    routeStartMarkers.forEach(
        function (
            marker
        ) {

            if (
                marker
                &&
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

    if (
        routeEndMarker
        &&
        map.hasLayer(
            routeEndMarker
        )
    ) {

        map.removeLayer(
            routeEndMarker
        );

    }

    incidentRouteLayers =
        [];

    routeStartMarkers =
        [];

    routeEndMarker =
        null;

}


// =========================
// LOAD AND DISPLAY ALL ROUTES
// =========================

async function loadAndDisplayIncidentRoute(
    incidentId
) {

    if (!incidentId) {

        throw new Error(
            "ID-ul incidentului lipsește."
        );

    }

    const routeData =
        await window.getIncidentRoute(
            incidentId
        );

    displayIncidentRoutes(
        routeData
    );

    return routeData;

}