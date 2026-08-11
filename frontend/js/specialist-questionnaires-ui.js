/* =====================================
   SPECIALIST QUESTIONNAIRES
===================================== */

let specialistReports = [];

let specialistAutosaveTimers = {};

let specialistQuestionnaireIncidentId = null;


/* =====================================
   SERVICE LABELS
===================================== */

const specialistServiceLabels = {

    police:
        "Poliție",

    ambulance:
        "Ambulanță",

    firefighters:
        "Pompieri"

};


/* =====================================
   QUESTION DEFINITIONS
===================================== */

const specialistQuestionDefinitions = {

    police: [

        {
            code:
                "traffic_affected",

            label:
                "Trafic afectat",

            type:
                "select",

            options: [
                "",
                "Nu",
                "Parțial",
                "Complet"
            ]
        },

        {
            code:
                "road_block_required",

            label:
                "Este necesară blocarea drumului?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu"
            ]
        },

        {
            code:
                "aggressive_persons",

            label:
                "Există persoane agresive?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu",
                "Necunoscut"
            ]
        },

        {
            code:
                "weapons_suspected",

            label:
                "Există arme observate sau suspectate?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu",
                "Necunoscut"
            ]
        },

        {
            code:
                "persons_involved",

            label:
                "Număr aproximativ de persoane implicate",

            type:
                "number",

            min:
                0
        },

        {
            code:
                "perimeter_required",

            label:
                "Perimetrul trebuie securizat?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu"
            ]
        },

        {
            code:
                "suspects_left_area",

            label:
                "Există suspecți care au părăsit zona?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu"
            ]
        },

        {
            code:
                "police_notes",

            label:
                "Observații operative",

            type:
                "textarea"
        }

    ],


    ambulance: [

        {
            code:
                "estimated_victims",

            label:
                "Număr estimat de victime",

            type:
                "number",

            min:
                0
        },

        {
            code:
                "conscious_victims",

            label:
                "Victime conștiente",

            type:
                "number",

            min:
                0
        },

        {
            code:
                "unconscious_victims",

            label:
                "Victime inconștiente",

            type:
                "number",

            min:
                0
        },

        {
            code:
                "trapped_victims",

            label:
                "Victime blocate / încarcerate",

            type:
                "number",

            min:
                0
        },

        {
            code:
                "pediatric_victims",

            label:
                "Există victime pediatrice?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu",
                "Necunoscut"
            ]
        },

        {
            code:
                "severe_bleeding",

            label:
                "Există hemoragii severe raportate?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu",
                "Necunoscut"
            ]
        },

        {
            code:
                "extrication_required",

            label:
                "Este necesară descarcerarea?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu",
                "Necunoscut"
            ]
        },

        {
            code:
                "crew_risk",

            label:
                "Există risc suplimentar pentru echipaj?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu"
            ]
        },

        {
            code:
                "medical_notes",

            label:
                "Observații medicale",

            type:
                "textarea"
        }

    ],


    firefighters: [

        {
            code:
                "main_situation",

            label:
                "Situație principală",

            type:
                "select",

            options: [
                "",
                "Incendiu",
                "Fum",
                "Explozie",
                "Scurgere gaz",
                "Material periculos",
                "Persoane blocate",
                "Altă situație"
            ]
        },

        {
            code:
                "active_flame",

            label:
                "Flacără activă?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu",
                "Necunoscut"
            ]
        },

        {
            code:
                "dense_smoke",

            label:
                "Fum dens?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu"
            ]
        },

        {
            code:
                "explosion_risk",

            label:
                "Risc de explozie",

            type:
                "select",

            options: [
                "",
                "Scăzut",
                "Mediu",
                "Ridicat",
                "Necunoscut"
            ]
        },

        {
            code:
                "hazardous_materials",

            label:
                "Sunt implicate substanțe periculoase?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu",
                "Necunoscut"
            ]
        },

        {
            code:
                "fuel_or_gas",

            label:
                "Este implicat combustibil sau gaz?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu",
                "Necunoscut"
            ]
        },

        {
            code:
                "trapped_persons",

            label:
                "Există persoane blocate?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu",
                "Necunoscut"
            ]
        },

        {
            code:
                "evacuation_required",

            label:
                "Este necesară evacuarea zonei?",

            type:
                "select",

            options: [
                "",
                "Da",
                "Nu"
            ]
        },

        {
            code:
                "firefighter_notes",

            label:
                "Observații operative",

            type:
                "textarea"
        }

    ]

};


/* =====================================
   GET ACCESS TOKEN
===================================== */

function getSpecialistAccessToken() {

    if (
        typeof window.getAccessToken ===
        "function"
    ) {

        return (
            window.getAccessToken()
            ||
            ""
        );

    }

    return "";

}


/* =====================================
   API REQUEST
===================================== */

async function specialistApiRequest(
    url,
    options = {}
) {

    let headers = {
        "Content-Type":
            "application/json",

        ...(
            options.headers
            ||
            {}
        )
    };


    /*
     * Folosim mecanismul unic de
     * autentificare al aplicației.
     */

    if (
        typeof window.getAuthorizationHeaders ===
        "function"
    ) {

        headers =
            window.getAuthorizationHeaders(
                headers
            );

    }

    else {

        const token =
            getSpecialistAccessToken();

        if (token) {

            headers.Authorization =
                `Bearer ${token}`;

        }

    }


    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );


    let data = {};

    try {

        data =
            await response.json();

    }

    catch (error) {

        data = {};

    }


    if (
        response.status ===
        401
    ) {

        if (
            typeof window.redirectToLogin ===
            "function"
        ) {

            window.redirectToLogin();

        }

        throw new Error(
            "Sesiunea a expirat."
        );

    }


    if (!response.ok) {

        throw new Error(
            data.message
            ||
            `HTTP ${response.status}`
        );

    }


    return data;

}


/* =====================================
   START QUESTIONNAIRES
===================================== */

async function startIncidentQuestionnaires(
    incidentId
) {

    specialistQuestionnaireIncidentId =
        incidentId;

    dispatcherWorkspaceMode =
        "questionnaires";

    if (
        typeof refreshDispatcherWorkspace ===
        "function"
    ) {

        refreshDispatcherWorkspace();

    }

    await loadIncidentQuestionnaires(
        incidentId
    );

}


/* =====================================
   LOAD QUESTIONNAIRES
===================================== */

async function loadIncidentQuestionnaires(
    incidentId
) {

    const data =
        await specialistApiRequest(
            (
                `/api/incidents/`
                +
                `${incidentId}`
                +
                `/specialist-reports`
            )
        );

    specialistReports =
        Array.isArray(
            data.reports
        )
            ?
            data.reports
            :
            [];

    renderSpecialistQuestionnaires();

}


/* =====================================
   RENDER QUESTIONNAIRES
===================================== */

function renderSpecialistQuestionnaires() {

    const panel =
        document.getElementById(
            "specialist-questionnaires-panel"
        );

    const container =
        document.getElementById(
            "specialist-questionnaires-container"
        );

    if (
        !panel
        ||
        !container
    ) {

        return;

    }

    panel.hidden =
        false;

    if (
        specialistReports.length ===
        0
    ) {

        container.innerHTML = `
            <p>
                Nu există chestionare specializate pentru acest incident.
            </p>
        `;

        return;

    }

    container.innerHTML =
        specialistReports
            .map(
                function (
                    report
                ) {

                    return (
                        buildSpecialistReportHtml(
                            report
                        )
                    );

                }
            )
            .join("");

    initializeSpecialistQuestionnaireEvents();

}


/* =====================================
   BUILD REPORT HTML
===================================== */

function buildSpecialistReportHtml(
    report
) {

    const serviceType =
        report.service_type;

    const questions =
        specialistQuestionDefinitions[
            serviceType
        ]
        ||
        [];

    const answers =
        report.answers
        ||
        {};

    const serviceLabel =
        specialistServiceLabels[
            serviceType
        ]
        ||
        serviceType;

    const statusLabel =
        getSpecialistStatusLabel(
            report.status
        );

    const fieldsHtml =
        questions
            .map(
                function (
                    question
                ) {

                    return (
                        buildSpecialistFieldHtml(
                            report,
                            question,
                            answers[
                                question.code
                            ]
                        )
                    );

                }
            )
            .join("");

    const confirmed =
        report.status ===
        "confirmed";

    return `
        <article
            class="specialist-report-card"
            data-report-id="${report.id}"
        >

            <div class="specialist-report-header">

                <div>

                    <div class="specialist-report-kicker">
                        CHESTIONAR SPECIALIZAT
                    </div>

                    <h3>
                        ${escapeHtml(
                            serviceLabel
                        )}
                    </h3>

                </div>

                <span
                    class="specialist-report-status"
                >
                    ${escapeHtml(
                        statusLabel
                    )}
                </span>

            </div>

            <div class="specialist-report-fields">

                ${fieldsHtml}

            </div>

            <div class="specialist-report-footer">

                <span
                    class="specialist-save-status"
                    id="specialist-save-status-${report.id}"
                >
                    ${
                        confirmed
                            ?
                            "Confirmat"
                            :
                            "Salvare automată activă"
                    }
                </span>

                <button
                    type="button"
                    class="specialist-confirm-button"
                    data-specialist-confirm="${report.id}"
                    ${
                        confirmed
                            ?
                            "disabled"
                            :
                            ""
                    }
                >
                    ${
                        confirmed
                            ?
                            "Confirmat"
                            :
                            "Confirmă informațiile"
                    }
                </button>

            </div>

        </article>
    `;

}


/* =====================================
   BUILD FIELD HTML
===================================== */

function buildSpecialistFieldHtml(
    report,
    question,
    currentValue
) {

    const disabled =
        report.status ===
        "confirmed";

    const safeValue =
        currentValue ===
        null
        ||
        currentValue ===
        undefined
            ?
            ""
            :
            String(
                currentValue
            );

    const commonAttributes = `
        data-specialist-report="${report.id}"
        data-specialist-question="${question.code}"
        ${disabled ? "disabled" : ""}
    `;

    if (
        question.type ===
        "textarea"
    ) {

        return `
            <label class="specialist-field specialist-field-full">

                <span>
                    ${escapeHtml(
                        question.label
                    )}
                </span>

                <textarea
                    ${commonAttributes}
                    rows="4"
                >${escapeHtml(
                    safeValue
                )}</textarea>

            </label>
        `;

    }

    if (
        question.type ===
        "select"
    ) {

        const options =
            question.options
                .map(
                    function (
                        option
                    ) {

                        const selected =
                            safeValue ===
                            String(
                                option
                            );

                        return `
                            <option
                                value="${escapeHtml(
                                    option
                                )}"
                                ${
                                    selected
                                        ?
                                        "selected"
                                        :
                                        ""
                                }
                            >
                                ${
                                    option
                                    ||
                                    "Selectează"
                                }
                            </option>
                        `;

                    }
                )
                .join("");

        return `
            <label class="specialist-field">

                <span>
                    ${escapeHtml(
                        question.label
                    )}
                </span>

                <select
                    ${commonAttributes}
                >
                    ${options}
                </select>

            </label>
        `;

    }

    return `
        <label class="specialist-field">

            <span>
                ${escapeHtml(
                    question.label
                )}
            </span>

            <input
                type="${question.type || "text"}"
                value="${escapeHtml(
                    safeValue
                )}"
                ${
                    question.min !==
                    undefined
                        ?
                        `min="${question.min}"`
                        :
                        ""
                }
                ${commonAttributes}
            >

        </label>
    `;

}


/* =====================================
   INITIALIZE EVENTS
===================================== */

function initializeSpecialistQuestionnaireEvents() {

    const fields =
        document.querySelectorAll(
            (
                "[data-specialist-report]"
                +
                "[data-specialist-question]"
            )
        );

    fields.forEach(
        function (
            field
        ) {

            const eventName =
                (
                    field.tagName ===
                    "SELECT"
                )
                    ?
                    "change"
                    :
                    "input";

            field.addEventListener(
                eventName,
                function () {

                    scheduleSpecialistAutosave(
                        field
                    );

                }
            );

        }
    );

    const confirmButtons =
        document.querySelectorAll(
            "[data-specialist-confirm]"
        );

    confirmButtons.forEach(
        function (
            button
        ) {

            button.addEventListener(
                "click",
                async function () {

                    const reportId =
                        Number(
                            button.dataset
                                .specialistConfirm
                        );

                    await confirmSpecialistReport(
                        reportId
                    );

                }
            );

        }
    );

}


/* =====================================
   AUTOSAVE SCHEDULER
===================================== */

function scheduleSpecialistAutosave(
    field
) {

    const reportId =
        Number(
            field.dataset
                .specialistReport
        );

    const questionCode =
        field.dataset
            .specialistQuestion;

    const timerKey =
        `${reportId}:${questionCode}`;

    if (
        specialistAutosaveTimers[
            timerKey
        ]
    ) {

        clearTimeout(
            specialistAutosaveTimers[
                timerKey
            ]
        );

    }

    setSpecialistSaveStatus(
        reportId,
        "Se salvează..."
    );

    specialistAutosaveTimers[
        timerKey
    ] = window.setTimeout(
        async function () {

            delete specialistAutosaveTimers[
                timerKey
            ];

            await saveSpecialistAnswer(
                reportId,
                questionCode,
                field.value
            );

        },
        500
    );

}


/* =====================================
   SAVE ANSWER
===================================== */

async function saveSpecialistAnswer(
    reportId,
    questionCode,
    value
) {

    try {

        await specialistApiRequest(
            (
                `/api/specialist-reports/`
                +
                `${reportId}`
                +
                `/answers/`
                +
                `${encodeURIComponent(
                    questionCode
                )}`
            ),
            {
                method:
                    "PATCH",

                body:
                    JSON.stringify({
                        value:
                            value
                    })
            }
        );

        setSpecialistSaveStatus(
            reportId,
            "Salvat"
        );

    }

    catch (error) {

        console.error(
            "Autosave chestionar eșuat:",
            error
        );

        setSpecialistSaveStatus(
            reportId,
            "Eroare la salvare"
        );

    }

}


/* =====================================
   CONFIRM REPORT
===================================== */

async function confirmSpecialistReport(
    reportId
) {

    const button =
        document.querySelector(
            (
                `[data-specialist-confirm="`
                +
                `${reportId}`
                +
                `"]`
            )
        );

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Se confirmă...";

    }

    try {

        await flushSpecialistAutosaves();

        const result =
            await specialistApiRequest(
                (
                    `/api/specialist-reports/`
                    +
                    `${reportId}`
                    +
                    `/confirm`
                ),
                {
                    method:
                        "PATCH",

                    body:
                        JSON.stringify({})
                }
            );

        const report =
            specialistReports.find(
                function (
                    currentReport
                ) {

                    return (
                        Number(
                            currentReport.id
                        )
                        ===
                        Number(
                            reportId
                        )
                    );

                }
            );

        if (report) {

            report.status =
                "confirmed";

        }

        if (
            result.completion
            &&
            result.completion.complete
        ) {

            finishIncidentQuestionnaires();

            return;

        }

        await loadIncidentQuestionnaires(
            specialistQuestionnaireIncidentId
        );

    }

    catch (error) {

        console.error(
            "Confirmarea chestionarului a eșuat:",
            error
        );

        alert(
            error.message
        );

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Confirmă informațiile";

        }

    }

}


/* =====================================
   FLUSH AUTOSAVES
===================================== */

async function flushSpecialistAutosaves() {

    const pendingTimers =
        Object.keys(
            specialistAutosaveTimers
        );

    pendingTimers.forEach(
        function (
            timerKey
        ) {

            clearTimeout(
                specialistAutosaveTimers[
                    timerKey
                ]
            );

            delete specialistAutosaveTimers[
                timerKey
            ];

        }
    );

    const fields =
        document.querySelectorAll(
            (
                "[data-specialist-report]"
                +
                "[data-specialist-question]"
            )
        );

    const requests = [];

    fields.forEach(
        function (
            field
        ) {

            if (field.disabled) {

                return;

            }

            requests.push(
                saveSpecialistAnswer(
                    Number(
                        field.dataset
                            .specialistReport
                    ),
                    field.dataset
                        .specialistQuestion,
                    field.value
                )
            );

        }
    );

    await Promise.all(
        requests
    );

}


/* =====================================
   FINISH QUESTIONNAIRES
===================================== */

function finishIncidentQuestionnaires() {

    specialistReports =
        [];

    specialistQuestionnaireIncidentId =
        null;

    const panel =
        document.getElementById(
            "specialist-questionnaires-panel"
        );

    if (panel) {

        panel.hidden =
            true;

    }

    dispatcherWorkspaceMode =
        "normal";

    if (
        typeof refreshDispatcherWorkspace ===
        "function"
    ) {

        refreshDispatcherWorkspace();

    }

}


/* =====================================
   STATUS LABEL
===================================== */

function getSpecialistStatusLabel(
    status
) {

    const labels = {

        pending:
            "Necompletat",

        in_progress:
            "În completare",

        confirmed:
            "Confirmat"

    };

    return (
        labels[
            status
        ]
        ||
        status
    );

}


/* =====================================
   SET SAVE STATUS
===================================== */

function setSpecialistSaveStatus(
    reportId,
    message
) {

    const element =
        document.getElementById(
            `specialist-save-status-${reportId}`
        );

    if (element) {

        element.textContent =
            message;

    }

}