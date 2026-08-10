/* =====================================
   PORNIREA APLICAȚIEI
===================================== */

window.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            const currentUser =
                await window
                    .requireAuthenticatedUser([
                        "administrator",
                        "dispatcher"
                    ]);

            if (!currentUser) {

                return;

            }

            displayCurrentUser(
                currentUser
            );

            initializeAdminNavigation(
                currentUser
            );

            initializeLogoutButton();

            initializeMap();

            initializeIncidentMapSelection();

            initializeVehicleFilters();

            initializeIncidentFilters();

            initializeIncidentForm();

            initializeRecommendationPanel();

            initializeSidebarSwitch();

            initializeRefreshButton();

            if (
                typeof initializeReinforcementRequestsUi ===
                "function"
            ) {

                initializeReinforcementRequestsUi();

            }

            await loadVehicles();

            await loadIncidents();

            if (
                typeof loadReinforcementRequests ===
                "function"
            ) {

                await loadReinforcementRequests();

            }

            startAutomaticRefresh();

        }

        catch (error) {

            console.error(
                "Inițializarea aplicației a eșuat:",
                error
            );

        }

    }
);


/* =====================================
   AFIȘARE UTILIZATOR CURENT
===================================== */

function displayCurrentUser(
    user
) {

    const nameElement =
        document.getElementById(
            "current-user-name"
        );

    const roleElement =
        document.getElementById(
            "current-user-role"
        );

    if (nameElement) {

        nameElement.textContent =
            user.display_name
            ||
            user.username;

    }

    if (roleElement) {

        roleElement.textContent =
            getRoleDisplayName(
                user.role
            );

    }

}

/* =====================================
   NAVIGARE ADMINISTRATOR
===================================== */

function initializeAdminNavigation(
    user
) {

    const navigation =
        document.getElementById(
            "dispatcher-admin-navigation"
        );

    if (!navigation) {

        return;

    }


    const isAdministrator =
        (
            user
            &&
            user.role ===
                "administrator"
        );


    navigation.hidden =
        !isAdministrator;

}

/* =====================================
   BUTON DECONECTARE
===================================== */

function initializeLogoutButton() {

    const logoutButton =
        document.getElementById(
            "logout-button"
        );

    if (!logoutButton) {

        return;

    }

    logoutButton.addEventListener(
        "click",
        async function () {

            logoutButton.disabled =
                true;

            logoutButton.textContent =
                "Se deconectează...";

            try {

                await window
                    .authApi
                    .logout();

                window.location.replace(
                    "/index.html"
                );

            }

            catch (error) {

                console.error(
                    "Deconectarea a eșuat:",
                    error
                );

                alert(
                    error.message
                );

                logoutButton.disabled =
                    false;

                logoutButton.textContent =
                    "Deconectare";

            }

        }
    );

}