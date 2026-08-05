/* =====================================
   CONFIGURARE AUTENTIFICARE
===================================== */

const AUTH_TOKEN_STORAGE_KEY =
    "gps_access_token";


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

                body: JSON.stringify({
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
                data.message ||
                "Autentificarea nu a reușit."
            );

        }

        if (!data.access_token) {

            throw new Error(
                "Serverul nu a returnat tokenul de autentificare."
            );

        }

        window.setAccessToken(
            data.access_token
        );

        return data;

    },


    async logout() {

        const accessToken =
            window.getAccessToken();

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
                    data.message ||
                    "Deconectarea nu a reușit."
                );

            }

            return data;

        }

        finally {

            if (accessToken) {

                window.clearAccessToken();

            }

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

            return data;

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
                "/"
            );

            return null;

        }

        const user =
            authentication.user;

        if (
            allowedRoles.length > 0
            &&
            !allowedRoles.includes(
                user.role
            )
        ) {

            redirectUserByRole(
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
                "/"
            );

            return;

        }

        if (
            user.role === "administrator"
            ||
            user.role === "dispatcher"
        ) {

            window.location.replace(
                "/dispatcher.html"
            );

            return;

        }

        if (
            user.role === "driver"
        ) {

            window.location.replace(
                "/driver.html"
            );

            return;

        }

        window.location.replace(
            "/"
        );

    };


/* =====================================
   NUME ROL
===================================== */

window.getRoleDisplayName =
    function (
        role
    ) {

        const names = {
            administrator:
                "Administrator",

            dispatcher:
                "Dispecer",

            driver:
                "Șofer"
        };

        return (
            names[role]
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