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