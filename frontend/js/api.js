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
        vehicleId
    ) {

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
                    vehicle_id:
                        vehicleId
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
                "Vehiculul nu a putut fi asignat."
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