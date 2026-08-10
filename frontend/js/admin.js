/* =====================================
   STARE ADMIN
===================================== */

let adminCurrentUser =
    null;

let adminUsers =
    [];

let adminVehicles =
    [];

let adminDatabaseTables =
    [];

let adminSelectedTable =
    null;

let adminDatabasePage =
    1;

let adminDatabaseLimit =
    100;

let adminPasswordResetUserId =
    null;


/* =====================================
   START
===================================== */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            await initializeAdminPage();

        }

        catch (error) {

            showAdminGlobalMessage(
                error.message
                ||
                "Pagina de administrare nu a putut fi încărcată.",
                "error"
            );

        }

    }
);


/* =====================================
   INITIALIZARE
===================================== */

async function initializeAdminPage() {

    bindAdminNavigation();

    bindAdminDashboardActions();

    bindAdminUserActions();

    bindAdminVehicleActions();

    bindAdminDatabaseActions();

    bindAdminSqlActions();

    bindAdminPasswordModal();

    bindAdminLogout();


    await verifyAdminSession();


    await Promise.all([
        loadAdminDashboard(),
        loadAdminUsers(),
        loadAdminVehicles(),
        loadAdminDatabaseTables()
    ]);

}


/* =====================================
   VERIFICARE SESIUNE
===================================== */

async function verifyAdminSession() {

    if (
        !window.authApi
        ||
        typeof window.authApi.getCurrentUser !==
            "function"
    ) {

        throw new Error(
            "Serviciul de autentificare nu este disponibil."
        );

    }

    const authentication =
        await window.authApi
            .getCurrentUser();

    if (
        !authentication.authenticated
        ||
        !authentication.user
    ) {

        window.location.replace(
            "index.html"
        );

        return null;

    }

    const user =
        authentication.user;

    if (
        user.role !==
        "administrator"
    ) {

        window.redirectUserByRole(
            user
        );

        return null;

    }

    adminCurrentUser =
        user;

    const currentUserName =
        document.getElementById(
            "admin-current-user-name"
        );

    if (currentUserName) {

        currentUserName.textContent =
            (
                user.display_name
                ||
                user.username
                ||
                "Administrator"
            );

    }

    return user;

}

/* =====================================
   NAVIGARE SECȚIUNI
===================================== */

function bindAdminNavigation() {

    const navigationButtons =
        document.querySelectorAll(
            "[data-admin-section]"
        );


    navigationButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const sectionName =
                        button.dataset
                            .adminSection;


                    showAdminSection(
                        sectionName
                    );

                }
            );

        }
    );

}


function showAdminSection(
    sectionName
) {

    const sections =
        document.querySelectorAll(
            ".admin-section"
        );

    const navigationButtons =
        document.querySelectorAll(
            "[data-admin-section]"
        );


    sections.forEach(
        function (section) {

            section.hidden =
                true;

            section.classList.remove(
                "active"
            );

        }
    );


    navigationButtons.forEach(
        function (button) {

            button.classList.remove(
                "active"
            );

        }
    );


    const selectedSection =
        document.getElementById(
            (
                "admin-section-"
                +
                sectionName
            )
        );


    const selectedButton =
        document.querySelector(
            (
                "[data-admin-section=\""
                +
                sectionName
                +
                "\"]"
            )
        );


    if (selectedSection) {

        selectedSection.hidden =
            false;

        selectedSection.classList.add(
            "active"
        );

    }


    if (selectedButton) {

        selectedButton.classList.add(
            "active"
        );

    }

}


/* =====================================
   DASHBOARD
===================================== */

function bindAdminDashboardActions() {

    const refreshButton =
        document.getElementById(
            "admin-refresh-dashboard-button"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadAdminDashboard
        );

    }

}


async function loadAdminDashboard() {

    const data =
        await window.adminApi
            .getDashboard();


    const statistics =
        data.statistics
        ||
        {};


    const users =
        statistics.users
        ||
        {};


    const vehicles =
        statistics.vehicles
        ||
        {};


    const incidents =
        statistics.incidents
        ||
        {};


    const requests =
        statistics
            .reinforcement_requests
        ||
        {};


    setAdminText(
        "admin-stat-total-users",
        users.total_users
    );


    setAdminText(
        "admin-stat-users-details",
        (
            (users.active_users || 0)
            +
            " active"
        )
    );


    setAdminText(
        "admin-stat-total-vehicles",
        vehicles.total_vehicles
    );


    setAdminText(
        "admin-stat-vehicles-details",
        (
            (vehicles.busy_vehicles || 0)
            +
            " în misiune"
        )
    );


    setAdminText(
        "admin-stat-active-incidents",
        incidents.active_incidents
    );


    setAdminText(
        "admin-stat-incidents-details",
        (
            (incidents.resolved_incidents || 0)
            +
            " rezolvate"
        )
    );


    setAdminText(
        "admin-stat-active-requests",
        requests.active_requests
    );


    setAdminText(
        "admin-stat-requests-details",
        (
            (requests.pending_requests || 0)
            +
            " în așteptare"
        )
    );


    setAdminText(
        "admin-summary-administrators",
        users.administrators
    );


    setAdminText(
        "admin-summary-dispatchers",
        users.dispatchers
    );


    setAdminText(
        "admin-summary-drivers",
        users.drivers
    );


    setAdminText(
        "admin-summary-active-users",
        users.active_users
    );


    setAdminText(
        "admin-summary-police",
        vehicles.police_vehicles
    );


    setAdminText(
        "admin-summary-ambulance",
        vehicles.ambulance_vehicles
    );


    setAdminText(
        "admin-summary-fire",
        vehicles.fire_vehicles
    );


    setAdminText(
        "admin-summary-busy-vehicles",
        vehicles.busy_vehicles
    );

}


/* =====================================
   UTILIZATORI
===================================== */

function bindAdminUserActions() {

    const openButton =
        document.getElementById(
            "admin-open-create-user-button"
        );


    const closeButton =
        document.getElementById(
            "admin-close-create-user-button"
        );


    const cancelButton =
        document.getElementById(
            "admin-cancel-create-user-button"
        );


    const refreshButton =
        document.getElementById(
            "admin-refresh-users-button"
        );


    const roleSelect =
        document.getElementById(
            "admin-create-user-role"
        );


    const form =
        document.getElementById(
            "admin-create-user-form"
        );


    if (openButton) {

        openButton.addEventListener(
            "click",
            openAdminCreateUserPanel
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeAdminCreateUserPanel
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeAdminCreateUserPanel
        );

    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadAdminUsers
        );

    }


    if (roleSelect) {

        roleSelect.addEventListener(
            "change",
            updateAdminCreateUserFields
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            handleAdminCreateUser
        );

    }


    updateAdminCreateUserFields();

}


function openAdminCreateUserPanel() {

    const panel =
        document.getElementById(
            "admin-create-user-panel"
        );


    if (panel) {

        panel.hidden =
            false;

    }

}


function closeAdminCreateUserPanel() {

    const panel =
        document.getElementById(
            "admin-create-user-panel"
        );


    const form =
        document.getElementById(
            "admin-create-user-form"
        );


    if (form) {

        form.reset();

    }


    if (panel) {

        panel.hidden =
            true;

    }


    hideAdminInlineMessage(
        "admin-create-user-result"
    );


    updateAdminCreateUserFields();

}


function updateAdminCreateUserFields() {

    const roleSelect =
        document.getElementById(
            "admin-create-user-role"
        );


    const usernameField =
        document.getElementById(
            "admin-create-user-username-field"
        );


    const vehicleTypeField =
        document.getElementById(
            "admin-create-user-vehicle-type-field"
        );


    const vehicleNameField =
        document.getElementById(
            "admin-create-user-vehicle-name-field"
        );


    if (
        !roleSelect
        ||
        !usernameField
        ||
        !vehicleTypeField
        ||
        !vehicleNameField
    ) {

        return;

    }


    const isDriver =
        (
            roleSelect.value ===
            "driver"
        );


    usernameField.hidden =
        isDriver;


    vehicleTypeField.hidden =
        !isDriver;


    vehicleNameField.hidden =
        !isDriver;

}


async function handleAdminCreateUser(
    event
) {

    event.preventDefault();


    const role =
        document.getElementById(
            "admin-create-user-role"
        )?.value;


    const displayName =
        document.getElementById(
            "admin-create-user-display-name"
        )?.value.trim();


    const password =
        document.getElementById(
            "admin-create-user-password"
        )?.value;


    const username =
        document.getElementById(
            "admin-create-user-username"
        )?.value.trim();


    const vehicleType =
        document.getElementById(
            "admin-create-user-vehicle-type"
        )?.value;


    const vehicleName =
        document.getElementById(
            "admin-create-user-vehicle-name"
        )?.value.trim();


    const payload = {
        role:
            role,

        display_name:
            displayName,

        password:
            password
    };


    if (
        role ===
        "driver"
    ) {

        payload.vehicle_type =
            vehicleType;

        payload.vehicle_name =
            vehicleName;

    }

    else {

        payload.username =
            username;

    }


    try {

        const result =
            await window.adminApi
                .createUser(
                    payload
                );


        let message =
            result.message
            ||
            "Utilizatorul a fost creat.";


        if (
            result.user
            &&
            result.user.username
        ) {

            message +=
                (
                    " Username: "
                    +
                    result.user.username
                );

        }


        if (
            result.vehicle
            &&
            result.vehicle.vehicle_code
        ) {

            message +=
                (
                    " | Vehicul: "
                    +
                    result.vehicle.vehicle_code
                );

        }


        showAdminInlineMessage(
            "admin-create-user-result",
            message,
            "success"
        );


        await Promise.all([
            loadAdminUsers(),
            loadAdminVehicles(),
            loadAdminDashboard()
        ]);


        const form =
            document.getElementById(
                "admin-create-user-form"
            );


        if (form) {

            form.reset();

        }


        updateAdminCreateUserFields();

    }

    catch (error) {

        showAdminInlineMessage(
            "admin-create-user-result",
            error.message,
            "error"
        );

    }

}


async function loadAdminUsers() {

    const tableBody =
        document.getElementById(
            "admin-users-table-body"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = `
        <tr>
            <td colspan="7">
                Se încarcă...
            </td>
        </tr>
    `;


    try {

        const data =
            await window.adminApi
                .getUsers();


        adminUsers =
            Array.isArray(
                data.users
            )
                ?
                data.users
                :
                [];


        renderAdminUsers();

    }

    catch (error) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    ${escapeAdminHtml(
                        error.message
                    )}
                </td>
            </tr>
        `;

    }

}


function renderAdminUsers() {

    const tableBody =
        document.getElementById(
            "admin-users-table-body"
        );


    if (!tableBody) {

        return;

    }


    if (
        adminUsers.length ===
        0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    Nu există utilizatori.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        adminUsers
            .map(
                function (user) {

                    const isActive =
                        Boolean(
                            user.is_active
                        );


                    return `
                        <tr>

                            <td>
                                ${escapeAdminHtml(
                                    user.id
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${escapeAdminHtml(
                                        user.username
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeAdminHtml(
                                    user.display_name
                                )}
                            </td>

                            <td>
                                ${createAdminRoleBadge(
                                    user.role
                                )}
                            </td>

                            <td>
                                ${
                                    isActive
                                        ?
                                        `
                                            <span class="admin-badge active">
                                                Activ
                                            </span>
                                        `
                                        :
                                        `
                                            <span class="admin-badge inactive">
                                                Inactiv
                                            </span>
                                        `
                                }
                            </td>

                            <td>
                                ${escapeAdminHtml(
                                    formatAdminDate(
                                        user.created_at
                                    )
                                )}
                            </td>

                            <td>

                                <div class="admin-table-actions">

                                    <button
                                        type="button"
                                        class="
                                            admin-table-action-button
                                            ${
                                                isActive
                                                    ?
                                                    "danger"
                                                    :
                                                    "success"
                                            }
                                        "
                                        onclick="
                                            toggleAdminUserActive(
                                                ${Number(user.id)},
                                                ${isActive ? "false" : "true"}
                                            )
                                        "
                                    >
                                        ${
                                            isActive
                                                ?
                                                "Dezactivează"
                                                :
                                                "Activează"
                                        }
                                    </button>

                                    <button
                                        type="button"
                                        class="admin-table-action-button"
                                        onclick="
                                            openAdminPasswordModal(
                                                ${Number(user.id)}
                                            )
                                        "
                                    >
                                        Parolă
                                    </button>

                                </div>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


async function toggleAdminUserActive(
    userId,
    newState
) {

    const user =
        adminUsers.find(
            function (item) {

                return (
                    Number(
                        item.id
                    )
                    ===
                    Number(
                        userId
                    )
                );

            }
        );


    if (!user) {

        return;

    }


    const action =
        newState
            ?
            "activezi"
            :
            "dezactivezi";


    const confirmed =
        window.confirm(
            (
                "Sigur vrei să "
                +
                action
                +
                " contul "
                +
                user.username
                +
                "?"
            )
        );


    if (!confirmed) {

        return;

    }


    try {

        await window.adminApi
            .setUserActiveState(
                userId,
                newState
            );


        await Promise.all([
            loadAdminUsers(),
            loadAdminDashboard()
        ]);


        showAdminGlobalMessage(
            "Starea contului a fost modificată.",
            "success"
        );

    }

    catch (error) {

        showAdminGlobalMessage(
            error.message,
            "error"
        );

    }

}


/* =====================================
   RESETARE PAROLĂ
===================================== */

function bindAdminPasswordModal() {

    const closeButton =
        document.getElementById(
            "admin-close-password-modal"
        );


    const cancelButton =
        document.getElementById(
            "admin-cancel-password-reset"
        );


    const confirmButton =
        document.getElementById(
            "admin-confirm-password-reset"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeAdminPasswordModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeAdminPasswordModal
        );

    }


    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            handleAdminPasswordReset
        );

    }

}


function openAdminPasswordModal(
    userId
) {

    const user =
        adminUsers.find(
            function (item) {

                return (
                    Number(
                        item.id
                    )
                    ===
                    Number(
                        userId
                    )
                );

            }
        );


    if (!user) {

        return;

    }


    adminPasswordResetUserId =
        userId;


    const modal =
        document.getElementById(
            "admin-password-modal"
        );


    const userLabel =
        document.getElementById(
            "admin-password-modal-user"
        );


    const passwordInput =
        document.getElementById(
            "admin-new-user-password"
        );


    if (userLabel) {

        userLabel.textContent =
            (
                user.username
                +
                " — "
                +
                user.display_name
            );

    }


    if (passwordInput) {

        passwordInput.value =
            "";

    }


    if (modal) {

        modal.hidden =
            false;

    }

}


function closeAdminPasswordModal() {

    const modal =
        document.getElementById(
            "admin-password-modal"
        );


    if (modal) {

        modal.hidden =
            true;

    }


    adminPasswordResetUserId =
        null;

}


async function handleAdminPasswordReset() {

    if (!adminPasswordResetUserId) {

        return;

    }


    const passwordInput =
        document.getElementById(
            "admin-new-user-password"
        );


    const password =
        passwordInput?.value
        ||
        "";


    try {

        await window.adminApi
            .resetUserPassword(
                adminPasswordResetUserId,
                password
            );


        closeAdminPasswordModal();


        showAdminGlobalMessage(
            "Parola utilizatorului a fost schimbată.",
            "success"
        );

    }

    catch (error) {

        showAdminGlobalMessage(
            error.message,
            "error"
        );

    }

}


/* =====================================
   VEHICULE
===================================== */

function bindAdminVehicleActions() {

    const refreshButton =
        document.getElementById(
            "admin-refresh-vehicles-button"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadAdminVehicles
        );

    }

}


async function loadAdminVehicles() {

    const tableBody =
        document.getElementById(
            "admin-vehicles-table-body"
        );


    if (!tableBody) {

        return;

    }


    try {

        const data =
            await window.adminApi
                .getVehicles();


        adminVehicles =
            Array.isArray(
                data.vehicles
            )
                ?
                data.vehicles
                :
                [];


        renderAdminVehicles();

    }

    catch (error) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    ${escapeAdminHtml(
                        error.message
                    )}
                </td>
            </tr>
        `;

    }

}


function renderAdminVehicles() {

    const tableBody =
        document.getElementById(
            "admin-vehicles-table-body"
        );


    if (!tableBody) {

        return;

    }


    if (
        adminVehicles.length ===
        0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    Nu există vehicule.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        adminVehicles
            .map(
                function (vehicle) {

                    return `
                        <tr>

                            <td>
                                ${escapeAdminHtml(
                                    vehicle.id
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${escapeAdminHtml(
                                        vehicle.vehicle_code
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeAdminHtml(
                                    vehicle.name
                                    ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeAdminHtml(
                                    getAdminVehicleTypeName(
                                        vehicle.vehicle_type
                                    )
                                )}
                            </td>

                            <td>
                                ${createAdminVehicleStatusBadge(
                                    vehicle.status
                                )}
                            </td>

                            <td>
                                ${escapeAdminHtml(
                                    vehicle.latitude
                                    ??
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeAdminHtml(
                                    vehicle.longitude
                                    ??
                                    "-"
                                )}
                            </td>

                            <td>
                                ${
                                    vehicle.speed
                                    !==
                                    null
                                    &&
                                    vehicle.speed
                                    !==
                                    undefined
                                        ?
                                        (
                                            escapeAdminHtml(
                                                vehicle.speed
                                            )
                                            +
                                            " km/h"
                                        )
                                        :
                                        "-"
                                }
                            </td>

                            <td>
                                ${escapeAdminHtml(
                                    formatAdminDate(
                                        vehicle.updated_at
                                    )
                                )}
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


/* =====================================
   DATABASE
===================================== */

function bindAdminDatabaseActions() {

    const refreshButton =
        document.getElementById(
            "admin-refresh-database-button"
        );


    const previousButton =
        document.getElementById(
            "admin-database-previous-page"
        );


    const nextButton =
        document.getElementById(
            "admin-database-next-page"
        );


    const tabs =
        document.querySelectorAll(
            "[data-database-tab]"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadAdminDatabaseTables
        );

    }


    if (previousButton) {

        previousButton.addEventListener(
            "click",
            async function () {

                if (
                    adminDatabasePage
                    <=
                    1
                ) {

                    return;

                }


                adminDatabasePage -=
                    1;


                await loadAdminSelectedTableRows();

            }
        );

    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            async function () {

                adminDatabasePage +=
                    1;


                await loadAdminSelectedTableRows();

            }
        );

    }


    tabs.forEach(
        function (tab) {

            tab.addEventListener(
                "click",
                function () {

                    showAdminDatabaseTab(
                        tab.dataset.databaseTab
                    );

                }
            );

        }
    );

}


async function loadAdminDatabaseTables() {

    const tableList =
        document.getElementById(
            "admin-database-table-list"
        );


    if (!tableList) {

        return;

    }


    tableList.innerHTML = `
        <p class="admin-empty-message">
            Se încarcă...
        </p>
    `;


    try {

        const data =
            await window.adminApi
                .getDatabaseTables();


        adminDatabaseTables =
            Array.isArray(
                data.tables
            )
                ?
                data.tables
                :
                [];


        renderAdminDatabaseTables();

    }

    catch (error) {

        tableList.innerHTML = `
            <p class="admin-empty-message">
                ${escapeAdminHtml(
                    error.message
                )}
            </p>
        `;

    }

}


function renderAdminDatabaseTables() {

    const tableList =
        document.getElementById(
            "admin-database-table-list"
        );


    const count =
        document.getElementById(
            "admin-database-table-count"
        );


    if (!tableList) {

        return;

    }


    if (count) {

        count.textContent =
            String(
                adminDatabaseTables.length
            );

    }


    if (
        adminDatabaseTables.length ===
        0
    ) {

        tableList.innerHTML = `
            <p class="admin-empty-message">
                Nu există tabele.
            </p>
        `;

        return;

    }


    tableList.innerHTML =
        adminDatabaseTables
            .map(
                function (table) {

                    const tableName =
                        table.table_name;


                    return `
                        <button
                            type="button"
                            class="
                                admin-database-table-button
                                ${
                                    adminSelectedTable
                                    ===
                                    tableName
                                        ?
                                        "active"
                                        :
                                        ""
                                }
                            "
                            onclick="
                                selectAdminDatabaseTable(
                                    '${escapeAdminJavaScriptString(
                                        tableName
                                    )}'
                                )
                            "
                        >

                            <span>
                                ${escapeAdminHtml(
                                    tableName
                                )}
                            </span>

                            <small>
                                ${escapeAdminHtml(
                                    table.table_rows
                                    ??
                                    0
                                )}
                            </small>

                        </button>
                    `;

                }
            )
            .join("");

}


async function selectAdminDatabaseTable(
    tableName
) {

    adminSelectedTable =
        tableName;

    adminDatabasePage =
        1;


    renderAdminDatabaseTables();


    setAdminText(
        "admin-selected-table-name",
        tableName
    );


    const emptyState =
        document.getElementById(
            "admin-database-empty-state"
        );


    const content =
        document.getElementById(
            "admin-database-table-content"
        );


    if (emptyState) {

        emptyState.hidden =
            true;

    }


    if (content) {

        content.hidden =
            false;

    }


    await Promise.all([
        loadAdminSelectedTableRows(),
        loadAdminSelectedTableStructure()
    ]);

}


async function loadAdminSelectedTableRows() {

    if (!adminSelectedTable) {

        return;

    }


    try {

        const data =
            await window.adminApi
                .getDatabaseTableRows(
                    adminSelectedTable,
                    {
                        page:
                            adminDatabasePage,

                        limit:
                            adminDatabaseLimit
                    }
                );


        renderAdminDatabaseRows(
            data
        );

    }

    catch (error) {

        showAdminGlobalMessage(
            error.message,
            "error"
        );

    }

}


function renderAdminDatabaseRows(
    data
) {

    const head =
        document.getElementById(
            "admin-database-data-head"
        );


    const body =
        document.getElementById(
            "admin-database-data-body"
        );


    const summary =
        document.getElementById(
            "admin-database-row-summary"
        );


    const pageLabel =
        document.getElementById(
            "admin-database-current-page"
        );


    const previousButton =
        document.getElementById(
            "admin-database-previous-page"
        );


    const nextButton =
        document.getElementById(
            "admin-database-next-page"
        );


    const rows =
        Array.isArray(
            data.rows
        )
            ?
            data.rows
            :
            [];


    const columns =
        rows.length > 0
            ?
            Object.keys(
                rows[0]
            )
            :
            [];


    if (summary) {

        summary.textContent =
            (
                "Total: "
                +
                Number(
                    data.total
                    ||
                    0
                )
                +
                " rânduri"
            );

    }


    if (pageLabel) {

        pageLabel.textContent =
            (
                "Pagina "
                +
                Number(
                    data.page
                    ||
                    1
                )
            );

    }


    if (previousButton) {

        previousButton.disabled =
            (
                Number(
                    data.page
                    ||
                    1
                )
                <=
                1
            );

    }


    if (nextButton) {

        nextButton.disabled =
            (
                (
                    Number(
                        data.page
                        ||
                        1
                    )
                    *
                    Number(
                        data.limit
                        ||
                        adminDatabaseLimit
                    )
                )
                >=
                Number(
                    data.total
                    ||
                    0
                )
            );

    }


    if (
        !head
        ||
        !body
    ) {

        return;

    }


    if (
        rows.length ===
        0
    ) {

        head.innerHTML =
            "";

        body.innerHTML = `
            <tr>
                <td>
                    Tabelul nu conține date.
                </td>
            </tr>
        `;

        return;

    }


    head.innerHTML = `
        <tr>
            ${
                columns
                    .map(
                        function (column) {

                            return `
                                <th>
                                    ${escapeAdminHtml(
                                        column
                                    )}
                                </th>
                            `;

                        }
                    )
                    .join("")
            }
        </tr>
    `;


    body.innerHTML =
        rows
            .map(
                function (row) {

                    return `
                        <tr>
                            ${
                                columns
                                    .map(
                                        function (column) {

                                            return `
                                                <td>
                                                    ${escapeAdminHtml(
                                                        formatAdminDatabaseValue(
                                                            row[column]
                                                        )
                                                    )}
                                                </td>
                                            `;

                                        }
                                    )
                                    .join("")
                            }
                        </tr>
                    `;

                }
            )
            .join("");

}


async function loadAdminSelectedTableStructure() {

    if (!adminSelectedTable) {

        return;

    }


    try {

        const data =
            await window.adminApi
                .getDatabaseTableStructure(
                    adminSelectedTable
                );


        renderAdminDatabaseStructure(
            data.columns
            ||
            []
        );

    }

    catch (error) {

        showAdminGlobalMessage(
            error.message,
            "error"
        );

    }

}


function renderAdminDatabaseStructure(
    columns
) {

    const body =
        document.getElementById(
            "admin-database-structure-body"
        );


    if (!body) {

        return;

    }


    if (
        !Array.isArray(columns)
        ||
        columns.length ===
        0
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="7">
                    Structura nu este disponibilă.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        columns
            .map(
                function (column) {

                    return `
                        <tr>

                            <td>
                                ${escapeAdminHtml(
                                    column.ordinal_position
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${escapeAdminHtml(
                                        column.column_name
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeAdminHtml(
                                    column.column_type
                                )}
                            </td>

                            <td>
                                ${escapeAdminHtml(
                                    column.is_nullable
                                )}
                            </td>

                            <td>
                                ${escapeAdminHtml(
                                    formatAdminDatabaseValue(
                                        column.column_default
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeAdminHtml(
                                    column.column_key
                                    ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeAdminHtml(
                                    column.extra
                                    ||
                                    "-"
                                )}
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


function showAdminDatabaseTab(
    tabName
) {

    const tabs =
        document.querySelectorAll(
            "[data-database-tab]"
        );


    const contents =
        document.querySelectorAll(
            ".admin-database-tab-content"
        );


    tabs.forEach(
        function (tab) {

            tab.classList.toggle(
                "active",
                (
                    tab.dataset.databaseTab
                    ===
                    tabName
                )
            );

        }
    );


    contents.forEach(
        function (content) {

            content.hidden =
                true;

        }
    );


    const selectedContent =
        document.getElementById(
            (
                "admin-database-tab-"
                +
                tabName
            )
        );


    if (selectedContent) {

        selectedContent.hidden =
            false;

    }

}


/* =====================================
   SQL CONSOLE
===================================== */

function bindAdminSqlActions() {

    const runButton =
        document.getElementById(
            "admin-run-sql-button"
        );


    const clearButton =
        document.getElementById(
            "admin-clear-sql-button"
        );


    if (runButton) {

        runButton.addEventListener(
            "click",
            function () {

                executeAdminSql(
                    false
                );

            }
        );

    }


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                const editor =
                    document.getElementById(
                        "admin-sql-editor"
                    );


                if (editor) {

                    editor.value =
                        "";

                }


                hideAdminInlineMessage(
                    "admin-sql-message"
                );


                const result =
                    document.getElementById(
                        "admin-sql-result"
                    );


                if (result) {

                    result.hidden =
                        true;

                }

            }
        );

    }

}


async function executeAdminSql(
    confirmed
) {

    const editor =
        document.getElementById(
            "admin-sql-editor"
        );


    if (!editor) {

        return;

    }


    const sql =
        editor.value.trim();


    if (!sql) {

        showAdminInlineMessage(
            "admin-sql-message",
            "Interogarea SQL este goală.",
            "error"
        );

        return;

    }


    try {

        const result =
            await window.adminApi
                .executeSql(
                    sql,
                    confirmed
                );


        if (
            result.status ===
            "confirmation_required"
        ) {

            const confirmedByUser =
                window.confirm(
                    (
                        "Această comandă modifică baza de date.\n\n"
                        +
                        result.sql
                        +
                        "\n\nVrei să continui?"
                    )
                );


            if (confirmedByUser) {

                await executeAdminSql(
                    true
                );

            }


            return;

        }


        renderAdminSqlResult(
            result
        );


        showAdminInlineMessage(
            "admin-sql-message",
            (
                result.message
                ||
                "Interogarea a fost executată."
            ),
            "success"
        );


        if (
            [
                "insert",
                "update",
                "delete",
                "replace",
                "create",
                "alter",
                "drop",
                "truncate",
                "rename"
            ].includes(
                String(
                    result.command
                    ||
                    ""
                ).toLowerCase()
            )
        ) {

            await Promise.all([
                loadAdminDashboard(),
                loadAdminUsers(),
                loadAdminVehicles(),
                loadAdminDatabaseTables()
            ]);

        }

    }

    catch (error) {

        showAdminInlineMessage(
            "admin-sql-message",
            error.message,
            "error"
        );

    }

}


function renderAdminSqlResult(
    result
) {

    const resultSection =
        document.getElementById(
            "admin-sql-result"
        );


    const title =
        document.getElementById(
            "admin-sql-result-title"
        );


    const summary =
        document.getElementById(
            "admin-sql-result-summary"
        );


    const tableWrapper =
        document.getElementById(
            "admin-sql-result-table-wrapper"
        );


    const head =
        document.getElementById(
            "admin-sql-result-head"
        );


    const body =
        document.getElementById(
            "admin-sql-result-body"
        );


    if (resultSection) {

        resultSection.hidden =
            false;

    }


    if (title) {

        title.textContent =
            (
                "Comandă: "
                +
                String(
                    result.command
                    ||
                    "-"
                ).toUpperCase()
            );

    }


    if (
        Array.isArray(
            result.rows
        )
    ) {

        const rows =
            result.rows;


        const columns =
            Array.isArray(
                result.columns
            )
                ?
                result.columns
                :
                (
                    rows.length
                        ?
                        Object.keys(
                            rows[0]
                        )
                        :
                        []
                );


        if (summary) {

            summary.textContent =
                (
                    "Rânduri returnate: "
                    +
                    Number(
                        result.returned_rows
                        ??
                        rows.length
                    )
                    +
                    (
                        result.truncated
                            ?
                            " (rezultatul a fost limitat)"
                            :
                            ""
                    )
                );

        }


        if (
            tableWrapper
            &&
            head
            &&
            body
        ) {

            tableWrapper.hidden =
                false;


            if (
                rows.length ===
                0
            ) {

                head.innerHTML =
                    "";

                body.innerHTML = `
                    <tr>
                        <td>
                            Interogarea nu a returnat rânduri.
                        </td>
                    </tr>
                `;

            }

            else {

                head.innerHTML = `
                    <tr>
                        ${
                            columns
                                .map(
                                    function (column) {

                                        return `
                                            <th>
                                                ${escapeAdminHtml(
                                                    column
                                                )}
                                            </th>
                                        `;

                                    }
                                )
                                .join("")
                        }
                    </tr>
                `;


                body.innerHTML =
                    rows
                        .map(
                            function (row) {

                                return `
                                    <tr>
                                        ${
                                            columns
                                                .map(
                                                    function (column) {

                                                        return `
                                                            <td>
                                                                ${escapeAdminHtml(
                                                                    formatAdminDatabaseValue(
                                                                        row[column]
                                                                    )
                                                                )}
                                                            </td>
                                                        `;

                                                    }
                                                )
                                                .join("")
                                        }
                                    </tr>
                                `;

                            }
                        )
                        .join("");

            }

        }

    }

    else {

        if (summary) {

            summary.textContent =
                (
                    "Rânduri afectate: "
                    +
                    Number(
                        result.affected_rows
                        ??
                        0
                    )
                );

        }


        if (tableWrapper) {

            tableWrapper.hidden =
                true;

        }

    }

}


/* =====================================
   LOGOUT
===================================== */

function bindAdminLogout() {

    const button =
        document.getElementById(
            "admin-logout-button"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async function () {

            try {

                if (
                    window.authApi
                    &&
                    typeof window.authApi.logout ===
                        "function"
                ) {

                    await window.authApi
                        .logout();

                }

            }

            catch (error) {

                console.error(
                    "Deconectarea nu a reușit:",
                    error
                );

            }


            window.location.replace(
                "index.html"
            );

        }
    );

}


/* =====================================
   BADGE ROL
===================================== */

function createAdminRoleBadge(
    role
) {

    const normalizedRole =
        String(
            role
            ||
            ""
        ).toLowerCase();


    const labels = {

        administrator:
            "Administrator",

        dispatcher:
            "Dispecer",

        driver:
            "Șofer"

    };


    const classNames = {

        administrator:
            "primary",

        dispatcher:
            "neutral",

        driver:
            "success"

    };


    return `
        <span class="
            admin-badge
            ${
                classNames[
                    normalizedRole
                ]
                ||
                "neutral"
            }
        ">
            ${
                escapeAdminHtml(
                    labels[
                        normalizedRole
                    ]
                    ||
                    role
                    ||
                    "-"
                )
            }
        </span>
    `;

}


/* =====================================
   BADGE VEHICUL
===================================== */

function createAdminVehicleStatusBadge(
    status
) {

    const normalizedStatus =
        String(
            status
            ||
            ""
        ).toLowerCase();


    const labels = {

        active:
            "Disponibil",

        busy:
            "În misiune",

        inactive:
            "Inactiv"

    };


    const classes = {

        active:
            "active",

        busy:
            "busy",

        inactive:
            "inactive"

    };


    return `
        <span class="
            admin-badge
            ${
                classes[
                    normalizedStatus
                ]
                ||
                "neutral"
            }
        ">
            ${
                escapeAdminHtml(
                    labels[
                        normalizedStatus
                    ]
                    ||
                    status
                    ||
                    "-"
                )
            }
        </span>
    `;

}


/* =====================================
   TIP VEHICUL
===================================== */

function getAdminVehicleTypeName(
    vehicleType
) {

    const names = {

        police:
            "Poliție",

        ambulance:
            "Ambulanță",

        fire:
            "Pompieri"

    };


    return (
        names[
            String(
                vehicleType
                ||
                ""
            ).toLowerCase()
        ]
        ||
        vehicleType
        ||
        "-"
    );

}


/* =====================================
   MESAJE
===================================== */

function showAdminGlobalMessage(
    message,
    type = "success"
) {

    const element =
        document.getElementById(
            "admin-global-message"
        );


    if (!element) {

        return;

    }


    element.hidden =
        false;

    element.className =
        (
            "admin-global-message "
            +
            type
        );

    element.textContent =
        message;


    window.clearTimeout(
        showAdminGlobalMessage
            .timeoutId
    );


    showAdminGlobalMessage.timeoutId =
        window.setTimeout(
            function () {

                element.hidden =
                    true;

            },
            5000
        );

}


function showAdminInlineMessage(
    elementId,
    message,
    type = "success"
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.hidden =
        false;

    element.className =
        (
            "admin-inline-message "
            +
            type
        );

    element.textContent =
        message;

}


function hideAdminInlineMessage(
    elementId
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.hidden =
        true;

    element.textContent =
        "";

}


/* =====================================
   UTILITARE
===================================== */

function setAdminText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.textContent =
        (
            value
            ===
            null
            ||
            value
            ===
            undefined
                ?
                "-"
                :
                String(
                    value
                )
        );

}


function formatAdminDate(
    value
) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );

    }


    return date.toLocaleString(
        "ro-RO"
    );

}


function formatAdminDatabaseValue(
    value
) {

    if (
        value ===
        null
    ) {

        return "NULL";

    }


    if (
        value ===
        undefined
    ) {

        return "-";

    }


    if (
        typeof value ===
        "object"
    ) {

        try {

            return JSON.stringify(
                value
            );

        }

        catch {

            return String(
                value
            );

        }

    }


    return String(
        value
    );

}


function escapeAdminHtml(
    value
) {

    return String(
        value
        ??
        ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            "\"",
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAdminJavaScriptString(
    value
) {

    return String(
        value
        ??
        ""
    )
        .replaceAll(
            "\\",
            "\\\\"
        )
        .replaceAll(
            "'",
            "\\'"
        )
        .replaceAll(
            "\n",
            "\\n"
        )
        .replaceAll(
            "\r",
            "\\r"
        );

}


/* =====================================
   EXPUNERE FUNCȚII FOLOSITE DIN HTML
===================================== */

window.toggleAdminUserActive =
    toggleAdminUserActive;

window.openAdminPasswordModal =
    openAdminPasswordModal;

window.selectAdminDatabaseTable =
    selectAdminDatabaseTable;