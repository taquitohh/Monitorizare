document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const existingAuthentication =
            await window.authApi
                .getCurrentUser();

        if (
            existingAuthentication.authenticated
            &&
            existingAuthentication.user
        ) {

            window.redirectUserByRole(
                existingAuthentication.user
            );

            return;

        }

        initializeLoginForm();

        initializePasswordToggle();

    }
);


/* =====================================
   FORMULAR AUTENTIFICARE
===================================== */

function initializeLoginForm() {

    const form =
        document.getElementById(
            "login-form"
        );

    const usernameInput =
        document.getElementById(
            "username"
        );

    const passwordInput =
        document.getElementById(
            "password"
        );

    const loginButton =
        document.getElementById(
            "login-button"
        );

    const message =
        document.getElementById(
            "login-message"
        );

    if (
        !form
        ||
        !usernameInput
        ||
        !passwordInput
        ||
        !loginButton
        ||
        !message
    ) {

        return;

    }

    usernameInput.focus();

    form.addEventListener(
        "submit",
        async function (
            event
        ) {

            event.preventDefault();

            const username =
                usernameInput
                    .value
                    .trim();

            const password =
                passwordInput
                    .value;

            message.textContent =
                "";

            message.classList.remove(
                "success"
            );

            if (!username) {

                message.textContent =
                    "Introdu numele de utilizator.";

                usernameInput.focus();

                return;

            }

            if (!password) {

                message.textContent =
                    "Introdu parola.";

                passwordInput.focus();

                return;

            }

            loginButton.disabled =
                true;

            loginButton.textContent =
                "Se autentifică...";

            try {

                const result =
                    await window.authApi
                        .login(
                            username,
                            password
                        );

                message.textContent =
                    "Autentificarea a reușit.";

                message.classList.add(
                    "success"
                );

                window.redirectUserByRole(
                    result.user
                );

            }

            catch (error) {

                message.textContent =
                    error.message;

                passwordInput.value =
                    "";

                passwordInput.focus();

            }

            finally {

                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "Conectare";

            }

        }
    );

}


/* =====================================
   AFIȘARE PAROLĂ
===================================== */

function initializePasswordToggle() {

    const passwordInput =
        document.getElementById(
            "password"
        );

    const toggleButton =
        document.getElementById(
            "toggle-password-button"
        );

    if (
        !passwordInput
        ||
        !toggleButton
    ) {

        return;

    }

    toggleButton.addEventListener(
        "click",
        function () {

            const passwordIsVisible =
                passwordInput.type ===
                "text";

            passwordInput.type =
                passwordIsVisible
                    ? "password"
                    : "text";

            toggleButton.textContent =
                passwordIsVisible
                    ? "Afișează"
                    : "Ascunde";

            toggleButton.setAttribute(
                "aria-label",
                passwordIsVisible
                    ? "Afișează parola"
                    : "Ascunde parola"
            );

        }
    );

}