/* =====================================
   API ADMINISTRATOR
===================================== */

window.adminApi = {

    /* =====================================
       DASHBOARD
    ===================================== */

    async getDashboard() {

        return await adminRequest(
            "/api/admin/dashboard",
            {
                method:
                    "GET"
            }
        );

    },


    /* =====================================
       UTILIZATORI
    ===================================== */

    async getUsers() {

        return await adminRequest(
            "/api/admin/users",
            {
                method:
                    "GET"
            }
        );

    },


    async createUser(
        payload
    ) {

        return await adminRequest(
            "/api/admin/users",
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        payload
                    )
            }
        );

    },


    async setUserActiveState(
        userId,
        isActive
    ) {

        if (!userId) {

            throw new Error(
                "Utilizatorul nu are un identificator valid."
            );

        }

        return await adminRequest(
            (
                "/api/admin/users/"
                + encodeURIComponent(
                    userId
                )
                + "/active"
            ),
            {
                method:
                    "PATCH",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        is_active:
                            Boolean(
                                isActive
                            )
                    })
            }
        );

    },


    async resetUserPassword(
        userId,
        password
    ) {

        if (!userId) {

            throw new Error(
                "Utilizatorul nu are un identificator valid."
            );

        }

        const normalizedPassword =
            String(
                password
                ||
                ""
            );

        if (
            normalizedPassword.length
            <
            8
        ) {

            throw new Error(
                (
                    "Parola trebuie să conțină "
                    + "cel puțin 8 caractere."
                )
            );

        }

        return await adminRequest(
            (
                "/api/admin/users/"
                + encodeURIComponent(
                    userId
                )
                + "/password"
            ),
            {
                method:
                    "PATCH",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        password:
                            normalizedPassword
                    })
            }
        );

    },


    /* =====================================
       VEHICULE
    ===================================== */

    async getVehicles() {

        return await adminRequest(
            "/api/admin/vehicles",
            {
                method:
                    "GET"
            }
        );

    },


    /* =====================================
       TABELE BAZĂ DE DATE
    ===================================== */

    async getDatabaseTables() {

        return await adminRequest(
            "/api/admin/database/tables",
            {
                method:
                    "GET"
            }
        );

    },


    async getDatabaseTableStructure(
        tableName
    ) {

        const normalizedTableName =
            normalizeAdminIdentifier(
                tableName,
                "Numele tabelului nu este valid."
            );

        return await adminRequest(
            (
                "/api/admin/database/tables/"
                + encodeURIComponent(
                    normalizedTableName
                )
                + "/structure"
            ),
            {
                method:
                    "GET"
            }
        );

    },


    async getDatabaseTableRows(
        tableName,
        {
            page = 1,
            limit = 100
        } = {}
    ) {

        const normalizedTableName =
            normalizeAdminIdentifier(
                tableName,
                "Numele tabelului nu este valid."
            );


        const normalizedPage =
            Math.max(
                1,
                Number.parseInt(
                    page,
                    10
                )
                ||
                1
            );


        const normalizedLimit =
            Math.max(
                1,
                Math.min(
                    500,
                    Number.parseInt(
                        limit,
                        10
                    )
                    ||
                    100
                )
            );


        const query =
            new URLSearchParams({
                page:
                    String(
                        normalizedPage
                    ),

                limit:
                    String(
                        normalizedLimit
                    )
            });


        return await adminRequest(
            (
                "/api/admin/database/tables/"
                + encodeURIComponent(
                    normalizedTableName
                )
                + "/rows?"
                + query.toString()
            ),
            {
                method:
                    "GET"
            }
        );

    },


    /* =====================================
       CONSOLĂ SQL
    ===================================== */

    async executeSql(
        sql,
        confirm = false
    ) {

        const normalizedSql =
            String(
                sql
                ||
                ""
            ).trim();

        if (!normalizedSql) {

            throw new Error(
                "Interogarea SQL este goală."
            );

        }

        return await adminRequest(
            "/api/admin/database/query",
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        sql:
                            normalizedSql,

                        confirm:
                            Boolean(
                                confirm
                            )
                    })
            },
            {
                allowConfirmationResponse:
                    true
            }
        );

    }

};


/* =====================================
   REQUEST GENERAL ADMIN
===================================== */

async function adminRequest(
    url,
    options = {},
    {
        allowConfirmationResponse = false
    } = {}
) {

    const requestOptions = {
        ...options
    };


    requestOptions.headers = {
        ...window.getAuthorizationHeaders(),
        ...(
            options.headers
            ||
            {}
        )
    };


    let response;


    try {

        response = await fetch(
            url,
            requestOptions
        );

    }

    catch {

        throw new Error(
            (
                "Serverul nu a putut fi contactat. "
                + "Verifică conexiunea și încearcă din nou."
            )
        );

    }


    const data =
        await readAdminApiResponse(
            response
        );


    if (
        allowConfirmationResponse
        &&
        response.status === 409
        &&
        data.status ===
            "confirmation_required"
    ) {

        return data;

    }


    if (!response.ok) {

        const error =
            new Error(
                data.message
                ||
                (
                    "Operația administrativă "
                    + "nu a putut fi efectuată."
                )
            );


        error.status =
            response.status;

        error.data =
            data;


        throw error;

    }


    return data;

}


/* =====================================
   CITIRE RĂSPUNS JSON
===================================== */

async function readAdminApiResponse(
    response
) {

    const contentType =
        String(
            response.headers.get(
                "content-type"
            )
            ||
            ""
        ).toLowerCase();


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        try {

            return await response.json();

        }

        catch {

            throw new Error(
                "Serverul a returnat un răspuns JSON invalid."
            );

        }

    }


    let responseText = "";


    try {

        responseText =
            await response.text();

    }

    catch {

        responseText =
            "";

    }


    throw new Error(
        responseText
            ?
            (
                "Serverul a returnat un răspuns invalid: "
                + responseText.slice(
                    0,
                    200
                )
            )
            :
            "Serverul a returnat un răspuns invalid."
    );

}


/* =====================================
   VALIDARE IDENTIFICATOR DB
===================================== */

function normalizeAdminIdentifier(
    value,
    errorMessage
) {

    const normalizedValue =
        String(
            value
            ||
            ""
        ).trim();


    if (
        !/^[A-Za-z0-9_]+$/.test(
            normalizedValue
        )
    ) {

        throw new Error(
            errorMessage
            ||
            "Identificatorul nu este valid."
        );

    }


    return normalizedValue;

}