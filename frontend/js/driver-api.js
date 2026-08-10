/* =====================================
   API DASHBOARD ȘOFER
===================================== */

window.driverApi = {

    async getDashboard() {

        const response = await fetch(
            "/api/driver/dashboard",
            {
                method:
                    "GET",

                headers:
                    window
                        .getAuthorizationHeaders()
            }
        );

        const data =
            await readDriverApiResponse(
                response
            );

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Datele șoferului nu au putut fi încărcate."
            );

        }

        return data;

    },


    /* =====================================
       RUTA MISIUNII
    ===================================== */

    async getMissionRoute(
        incidentId
    ) {

        if (!incidentId) {

            throw new Error(
                "Incidentul activ nu are un identificator valid."
            );

        }

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
            await readDriverApiResponse(
                response
            );

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Ruta misiunii nu a putut fi calculată."
            );

        }

        return data;

    },


    /* =====================================
       TRIMITERE CERERE DE ÎNTĂRIRI
    ===================================== */

    async createReinforcementRequest(
        message = ""
    ) {

        const normalizedMessage =
            String(
                message
                ||
                ""
            ).trim();

        if (
            normalizedMessage.length >
            1000
        ) {

            throw new Error(
                (
                    "Mesajul cererii de întăriri "
                    + "nu poate depăși 1000 de caractere."
                )
            );

        }

        const response = await fetch(
            "/api/driver/reinforcement-requests",
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
                            normalizedMessage
                            ||
                            null
                    })
            }
        );

        const data =
            await readDriverApiResponse(
                response
            );

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Cererea de întăriri nu a putut fi trimisă."
            );

        }

        return data;

    },


    /* =====================================
       ULTIMA CERERE DE ÎNTĂRIRI
    ===================================== */

    async getLatestReinforcementRequest() {

        const response = await fetch(
            "/api/driver/reinforcement-requests/latest",
            {
                method:
                    "GET",

                headers:
                    window
                        .getAuthorizationHeaders()
            }
        );

        const data =
            await readDriverApiResponse(
                response
            );

        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Cererea de întăriri nu a putut fi încărcată."
            );

        }

        return data;

    },

/* =====================================
   ISTORIC CERERI DE ÎNTĂRIRI
===================================== */

async getReinforcementRequestHistory() {

    const response = await fetch(
        "/api/driver/reinforcement-requests/history",
        {
            method:
                "GET",

            headers:
                window
                    .getAuthorizationHeaders()
        }
    );

    const data =
        await readDriverApiResponse(
            response
        );

    if (!response.ok) {

        throw new Error(
            data.message
            ||
            "Istoricul cererilor de întăriri nu a putut fi încărcat."
        );

    }

    return data;
}
};

/* =====================================
   CITIRE RĂSPUNS
===================================== */

async function readDriverApiResponse(
    response
) {

    try {

        return await response.json();

    }

    catch {

        throw new Error(
            "Serverul a returnat un răspuns invalid."
        );

    }

}