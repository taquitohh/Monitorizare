/* =====================================
   GET VEHICLES
===================================== */

window.getVehicles =
    async function () {

        const response = await fetch(
            "/api/vehicles",
            {
                method:
                    "GET",

                headers:
                    window
                        .getAuthorizationHeaders()
            }
        );

        const data =
            await readJsonResponse(
                response,
                "API-ul vehiculelor a returnat un răspuns invalid."
            );

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Vehiculele nu au putut fi încărcate."
            );

        }

        return data;

    };


/* =====================================
   CREATE INCIDENT
===================================== */

window.createIncident =
    async function (
        incidentData
    ) {

        const response = await fetch(
            "/api/incidents",
            {
                method:
                    "POST",

                headers:
                    window
                        .getAuthorizationHeaders({
                            "Content-Type":
                                "application/json"
                        }),

                body: JSON.stringify(
                    incidentData
                )
            }
        );

        const data =
            await readJsonResponse(
                response,
                "API-ul incidentelor a returnat un răspuns invalid."
            );

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Incidentul nu a putut fi salvat."
            );

        }

        return data;

    };


/* =====================================
   UPDATE INCIDENT LOCATION
===================================== */

window.updateIncidentLocation =
    async function (
        incidentId,
        location
    ) {

        const response = await fetch(
            `/api/incidents/${incidentId}/location`,
            {
                method:
                    "PATCH",

                headers:
                    window
                        .getAuthorizationHeaders({
                            "Content-Type":
                                "application/json"
                        }),

                body: JSON.stringify({
                    latitude:
                        location.latitude,

                    longitude:
                        location.longitude
                })
            }
        );

        const data =
            await readJsonResponse(
                response,
                "API-ul locației a returnat un răspuns invalid."
            );

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Locația incidentului nu a putut fi salvată."
            );

        }

        return data;

    };


/* =====================================
   GET RECOMMENDED VEHICLE
===================================== */

window.getRecommendedVehicle =
    async function (
        incidentId
    ) {

        const response = await fetch(
            `/api/incidents/${incidentId}/recommended-vehicle`,
            {
                method:
                    "GET",

                headers:
                    window
                        .getAuthorizationHeaders()
            }
        );

        const data =
            await readJsonResponse(
                response,
                "API-ul recomandării a returnat un răspuns invalid."
            );

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Nu a putut fi găsit un vehicul recomandat."
            );

        }

        return data;

    };


/* =====================================
   ASSIGN VEHICLE
===================================== */

window.assignVehicleToIncident =
    async function (
        incidentId,
        vehicleIds
    ) {

        const normalizedVehicleIds =
            Array.isArray(
                vehicleIds
            )
                ? vehicleIds
                : [
                    vehicleIds
                ];

        const response = await fetch(
            `/api/incidents/${incidentId}/assign`,
            {
                method:
                    "PATCH",

                headers:
                    window
                        .getAuthorizationHeaders({
                            "Content-Type":
                                "application/json"
                        }),

                body: JSON.stringify({
                    vehicle_ids:
                        normalizedVehicleIds
                })
            }
        );

        const data =
            await readJsonResponse(
                response,
                "API-ul asignării a returnat un răspuns invalid."
            );

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Vehiculele nu au putut fi asignate."
            );

        }

        return data;

    };

/* =====================================
   GET INCIDENT ROUTE
===================================== */

window.getIncidentRoute =
    async function (
        incidentId
    ) {

        const response = await fetch(
            `/api/incidents/${incidentId}/route`,
            {
                method:
                    "GET",

                headers:
                    window
                        .getAuthorizationHeaders()
            }
        );

        const data =
            await readJsonResponse(
                response,
                "API-ul traseului a returnat un răspuns invalid."
            );

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Traseul nu a putut fi calculat."
            );

        }

        return data;

    };


/* =====================================
   GET INCIDENTS
===================================== */

window.getIncidents =
    async function () {

        const response = await fetch(
            "/api/incidents",
            {
                method:
                    "GET",

                headers:
                    window
                        .getAuthorizationHeaders()
            }
        );

        const data =
            await readJsonResponse(
                response,
                "API-ul incidentelor a returnat un răspuns invalid."
            );

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Incidentele nu au putut fi încărcate."
            );

        }

        return data;

    };


/* =====================================
   READ JSON RESPONSE
===================================== */

async function readJsonResponse(
    response,
    errorMessage
) {

    try {

        return await response.json();

    }

    catch {

        throw new Error(
            errorMessage
        );

    }

}

/* =====================================
   CERERI DE ÎNTĂRIRI
===================================== */

window.getReinforcementRequests =
    async function () {

        const response = await fetch(
            "/api/reinforcement-requests",
            {
                method:
                    "GET",

                headers:
                    window
                        .getAuthorizationHeaders()
            }
        );

        let data;

        try {

            data =
                await response.json();

        }

        catch {

            throw new Error(
                "Serverul a returnat un răspuns invalid."
            );

        }

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Cererile de întăriri nu au putut fi încărcate."
            );

        }

        return (
            Array.isArray(
                data.requests
            )
                ?
                data.requests
                :
                []
        );

    };

    /* =====================================
   ACCEPTARE CERERE DE ÎNTĂRIRI
===================================== */

window.acceptReinforcementRequest =
    async function (
        requestId,
        resources,
        message = ""
    ) {

        const normalizedRequestId =
            Number(
                requestId
            );

        if (
            !Number.isInteger(
                normalizedRequestId
            )
            ||
            normalizedRequestId < 1
        ) {

            throw new Error(
                "Cererea selectată nu are un identificator valid."
            );

        }

        const normalizedResources = {
            police:
                Number(
                    resources?.police
                    ||
                    0
                ),

            ambulance:
                Number(
                    resources?.ambulance
                    ||
                    0
                ),

            fire:
                Number(
                    resources?.fire
                    ||
                    0
                )
        };

        const response = await fetch(
            (
                `/api/reinforcement-requests/`
                +
                `${normalizedRequestId}/accept`
            ),
            {
                method:
                    "POST",

                headers:
                    window
                        .getAuthorizationHeaders({
                            "Content-Type":
                                "application/json"
                        }),

                body:
                    JSON.stringify({
                        resources:
                            normalizedResources,

                        message:
                            String(
                                message
                                ||
                                ""
                            ).trim()
                            ||
                            null
                    })
            }
        );

        let data;

        try {

            data =
                await response.json();

        }

        catch {

            throw new Error(
                "Serverul a returnat un răspuns invalid."
            );

        }

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Cererea de întăriri nu a putut fi acceptată."
            );

        }

        return data;

    };


/* =====================================
   RESPINGERE CERERE DE ÎNTĂRIRI
===================================== */

window.rejectReinforcementRequest =
    async function (
        requestId,
        message = ""
    ) {

        const normalizedRequestId =
            Number(
                requestId
            );

        if (
            !Number.isInteger(
                normalizedRequestId
            )
            ||
            normalizedRequestId < 1
        ) {

            throw new Error(
                "Cererea selectată nu are un identificator valid."
            );

        }

        const response = await fetch(
            (
                `/api/reinforcement-requests/`
                +
                `${normalizedRequestId}/reject`
            ),
            {
                method:
                    "POST",

                headers:
                    window
                        .getAuthorizationHeaders({
                            "Content-Type":
                                "application/json"
                        }),

                body:
                    JSON.stringify({
                        message:
                            String(
                                message
                                ||
                                ""
                            ).trim()
                            ||
                            null
                    })
            }
        );

        let data;

        try {

            data =
                await response.json();

        }

        catch {

            throw new Error(
                "Serverul a returnat un răspuns invalid."
            );

        }

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Cererea de întăriri nu a putut fi respinsă."
            );

        }

        return data;

    };