// ==============================
// GET VEHICLES
// ==============================

window.getVehicles = async function () {

    const response = await fetch(
        "/api/vehicles"
    );

    const data = await readJsonResponse(
        response,
        "The vehicles API returned an invalid response."
    );

    if (!response.ok) {

        throw new Error(
            data.message ||
            "Vehicles could not be loaded."
        );

    }

    return data;

};


// ==============================
// CREATE INCIDENT
// ==============================

window.createIncident = async function (
    incidentData
) {

    const response = await fetch(
        "/api/incidents",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify(
                incidentData
            )
        }
    );

    const data = await readJsonResponse(
        response,
        "The incident API returned an invalid response."
    );

    if (!response.ok) {

        throw new Error(
            data.message ||
            "The incident could not be saved."
        );

    }

    return data;

};


// ==============================
// UPDATE INCIDENT LOCATION
// ==============================

window.updateIncidentLocation = async function (
    incidentId,
    location
) {

    const response = await fetch(
        `/api/incidents/${incidentId}/location`,
        {
            method: "PATCH",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                latitude:
                    location.latitude,

                longitude:
                    location.longitude
            })
        }
    );

    const data = await readJsonResponse(
        response,
        "The location API returned an invalid response."
    );

    if (!response.ok) {

        throw new Error(
            data.message ||
            "The incident location could not be saved."
        );

    }

    return data;

};


// ==============================
// GET RECOMMENDED VEHICLE
// ==============================

window.getRecommendedVehicle = async function (
    incidentId
) {

    const response = await fetch(
        `/api/incidents/${incidentId}/recommended-vehicle`
    );

    const data = await readJsonResponse(
        response,
        "The recommendation API returned an invalid response."
    );

    if (!response.ok) {

        throw new Error(
            data.message ||
            "A recommended vehicle could not be found."
        );

    }

    return data;

};


// ==============================
// ASSIGN VEHICLE
// ==============================

window.assignVehicleToIncident = async function (
    incidentId,
    vehicleId
) {

    const response = await fetch(
        `/api/incidents/${incidentId}/assign`,
        {
            method: "PATCH",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                vehicle_id:
                    vehicleId
            })
        }
    );

    const data = await readJsonResponse(
        response,
        "The assignment API returned an invalid response."
    );

    if (!response.ok) {

        throw new Error(
            data.message ||
            "The vehicle could not be assigned."
        );

    }

    return data;

};


// ==============================
// GET INCIDENT ROUTE
// ==============================

window.getIncidentRoute = async function (
    incidentId
) {

    const response = await fetch(
        `/api/incidents/${incidentId}/route`
    );

    const data = await readJsonResponse(
        response,
        "The route API returned an invalid response."
    );

    if (!response.ok) {

        throw new Error(
            data.message ||
            "The route could not be calculated."
        );

    }

    return data;

};


// ==============================
// GET INCIDENTS
// ==============================

window.getIncidents = async function () {

    const response = await fetch(
        "/api/incidents"
    );

    const data = await readJsonResponse(
        response,
        "The incidents API returned an invalid response."
    );

    if (!response.ok) {

        throw new Error(
            data.message ||
            "Incidents could not be loaded."
        );

    }

    return data;

};


// ==============================
// READ JSON RESPONSE
// ==============================

async function readJsonResponse(
    response,
    errorMessage
) {

    try {

        return await response.json();

    }

    catch (error) {

        throw new Error(
            errorMessage
        );

    }

}