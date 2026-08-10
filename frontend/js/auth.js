/* =====================================
   CONFIGURARE AUTENTIFICARE
===================================== */

const AUTH_TOKEN_STORAGE_KEY =
    "gps_access_token";

const LOGIN_PAGE_URL =
    "/index.html";

const ADMIN_PAGE_URL =
    "/admin.html";

const DISPATCHER_PAGE_URL =
    "/dispatcher.html";

const DRIVER_PAGE_URL =
    "/driver.html";


/* =====================================
   TOKEN TAB CURENT
===================================== */

window.getAccessToken =
function () {

    return sessionStorage.getItem(
        AUTH_TOKEN_STORAGE_KEY
    );

};


window.setAccessToken =
function (
    accessToken
) {

    if (!accessToken) {

        sessionStorage.removeItem(
            AUTH_TOKEN_STORAGE_KEY
        );

        return;

    }

    sessionStorage.setItem(
        AUTH_TOKEN_STORAGE_KEY,
        accessToken
    );

};


window.clearAccessToken =
function () {

    sessionStorage.removeItem(
        AUTH_TOKEN_STORAGE_KEY
    );

};


/* =====================================
   HEADER AUTORIZARE
===================================== */

window.getAuthorizationHeaders =
function (
    additionalHeaders = {}
) {

    const headers = {
        ...additionalHeaders
    };


    const accessToken =
        window.getAccessToken();


    if (accessToken) {

        headers.Authorization =
            `Bearer ${accessToken}`;

    }


    return headers;

};


/* =====================================
   API AUTENTIFICARE
===================================== */

window.authApi = {

    async login(
        username,
        password
    ) {

        const response = await fetch(
            "/api/auth/login",
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        username:
                            username,

                        password:
                            password
                    })
            }
        );


        const data =
            await readAuthResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Autentificarea nu a reușit."
            );

        }


        if (!data.access_token) {

            throw new Error(
                "Serverul nu a returnat tokenul de autentificare."
            );

        }


        if (!data.user) {

            throw new Error(
                "Serverul nu a returnat utilizatorul autentificat."
            );

        }


        window.setAccessToken(
            data.access_token
        );


        return data;

    },


    async logout() {

        try {

            const response = await fetch(
                "/api/auth/logout",
                {
                    method:
                        "POST",

                    headers:
                        window
                            .getAuthorizationHeaders()
                }
            );


            const data =
                await readAuthResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message
                    ||
                    "Deconectarea nu a reușit."
                );

            }


            return data;

        }

        finally {

            window.clearAccessToken();

        }

    },


    async getCurrentUser() {

        const accessToken =
            window.getAccessToken();


        if (!accessToken) {

            return {
                authenticated:
                    false,

                user:
                    null
            };

        }


        try {

            const response = await fetch(
                "/api/auth/me",
                {
                    method:
                        "GET",

                    headers:
                        window
                            .getAuthorizationHeaders()
                }
            );


            const data =
                await readAuthResponse(
                    response
                );


            if (!response.ok) {

                window.clearAccessToken();


                return {
                    authenticated:
                        false,

                    user:
                        null
                };

            }


            return {
                authenticated:
                    Boolean(
                        data.authenticated
                        ??
                        data.user
                    ),

                user:
                    data.user
                    ||
                    null
            };

        }

        catch (error) {

            console.error(
                "Sesiunea nu a putut fi verificată:",
                error
            );


            return {
                authenticated:
                    false,

                user:
                    null
            };

        }

    }

};


/* =====================================
   VERIFICARE ACCES PAGINĂ
===================================== */

window.requireAuthenticatedUser =
async function (
    allowedRoles = []
) {

    const authentication =
        await window.authApi
            .getCurrentUser();


    if (
        !authentication.authenticated
        ||
        !authentication.user
    ) {

        window.location.replace(
            LOGIN_PAGE_URL
        );

        return null;

    }


    const user =
        authentication.user;


    const normalizedRole =
        String(
            user.role
            ||
            ""
        ).trim().toLowerCase();


    user.role =
        normalizedRole;


    if (
        allowedRoles.length > 0
        &&
        !allowedRoles.includes(
            normalizedRole
        )
    ) {

        window.redirectUserByRole(
            user
        );

        return null;

    }


    return user;

};


/* =====================================
   REDIRECȚIONARE DUPĂ ROL
===================================== */

window.redirectUserByRole =
function (
    user
) {

    if (!user) {

        window.location.replace(
            LOGIN_PAGE_URL
        );

        return;

    }


    const role =
        String(
            user.role
            ||
            ""
        )
            .trim()
            .toLowerCase();


    console.log(
        "Redirect utilizator:",
        {
            username:
                user.username,

            role:
                role
        }
    );


    switch (role) {

        case "administrator":

            window.location.replace(
                ADMIN_PAGE_URL
            );

            return;


        case "dispatcher":

            window.location.replace(
                DISPATCHER_PAGE_URL
            );

            return;


        case "driver":

            window.location.replace(
                DRIVER_PAGE_URL
            );

            return;


        default:

            console.error(
                "Rol necunoscut:",
                role
            );

            window.location.replace(
                LOGIN_PAGE_URL
            );

    }

};


/* =====================================
   REDIRECȚIONARE LA LOGIN
===================================== */

window.redirectToLogin =
function () {

    window.clearAccessToken();

    window.location.replace(
        LOGIN_PAGE_URL
    );

};


/* =====================================
   NUME ROL
===================================== */

window.getRoleDisplayName =
function (
    role
) {

    const normalizedRole =
        String(
            role
            ||
            ""
        )
            .trim()
            .toLowerCase();


    const names = {

        administrator:
            "Administrator",

        dispatcher:
            "Dispecer",

        driver:
            "Șofer"

    };


    return (
        names[
            normalizedRole
        ]
        ||
        "Utilizator"
    );

};


/* =====================================
   CITIRE JSON
===================================== */

async function readAuthResponse(
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