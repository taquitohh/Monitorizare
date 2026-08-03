/* =====================================
   VEHICLE NUMBER
===================================== */

function getVehicleNumber(
    vehicleCode
) {

    if (!vehicleCode) {

        return 0;

    }

    const parts =
        String(
            vehicleCode
        ).split("-");

    const number =
        parseInt(
            parts[
                parts.length - 1
            ],
            10
        );

    return Number.isNaN(number)
        ? 0
        : number;

}


/* =====================================
   VEHICLE DISPLAY NAME
===================================== */

function getVehicleDisplayName(
    vehicleCode
) {

    return (
        `Vehicul ${getVehicleNumber(vehicleCode)}`
    );

}


/* =====================================
   READABLE TEXT
===================================== */

function getReadableStatus(
    status
) {

    return String(
        status || ""
    )
        .replaceAll(
            "_",
            " "
        )
        .replaceAll(
            "-",
            " "
        )
        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            }
        );

}


/* =====================================
   INCIDENT CATEGORY
===================================== */

function getIncidentCategory(
    incident
) {

    const status =
        String(
            incident?.status || ""
        ).toLowerCase();

    if (
        ACTIVE_INCIDENT_STATUSES.includes(
            status
        )
    ) {

        return "active";

    }

    if (
        ARCHIVED_INCIDENT_STATUSES.includes(
            status
        )
    ) {

        return "archived";

    }

    return "pending";

}


/* =====================================
   ACTIVE INCIDENT CHECK
===================================== */

function isIncidentActive(
    incident
) {

    return (
        getIncidentCategory(
            incident
        ) === "active"
    );

}


/* =====================================
   ARCHIVED INCIDENT CHECK
===================================== */

function isIncidentArchived(
    incident
) {

    return (
        getIncidentCategory(
            incident
        ) === "archived"
    );

}


/* =====================================
   PENDING INCIDENT CHECK
===================================== */

function isIncidentPending(
    incident
) {

    return (
        getIncidentCategory(
            incident
        ) === "pending"
    );

}


/* =====================================
   INCIDENT DATE FORMAT
===================================== */

function formatIncidentDate(
    dateValue
) {

    if (!dateValue) {

        return "-";

    }

    const date =
        new Date(
            dateValue
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateValue
        );

    }

    return date.toLocaleString(
        "ro-RO",
        {
            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit",

            second:
                "2-digit"
        }
    );

}


/* =====================================
   NUMBER FORMAT
===================================== */

function formatNumber(
    value,
    decimals = 2
) {

    const number =
        Number(
            value
        );

    if (
        !Number.isFinite(
            number
        )
    ) {

        return "-";

    }

    return number.toFixed(
        decimals
    );

}


/* =====================================
   COORDINATE FORMAT
===================================== */

function formatCoordinate(
    value
) {

    return formatNumber(
        value,
        6
    );

}


/* =====================================
   SAFE TEXT
===================================== */

function escapeHtml(
    value
) {

    const temporaryElement =
        document.createElement(
            "div"
        );

    temporaryElement.textContent =
        value === null ||
        value === undefined
            ? ""
            : String(value);

    return temporaryElement.innerHTML;

}


/* =====================================
   INCIDENT LOCATION VALIDATION
===================================== */

function incidentHasLocation(
    incident
) {

    if (!incident) {

        return false;

    }

    const latitude =
        Number(
            incident.latitude
        );

    const longitude =
        Number(
            incident.longitude
        );

    return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
    );

}


/* =====================================
   VEHICLE LOCATION VALIDATION
===================================== */

function vehicleHasLocation(
    vehicle
) {

    if (!vehicle) {

        return false;

    }

    const latitude =
        Number(
            vehicle.latitude
        );

    const longitude =
        Number(
            vehicle.longitude
        );

    return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
    );

}


/* =====================================
   INCIDENT REPORT URL
===================================== */

function getIncidentReportUrl(
    incidentId
) {

    return (
        `/api/incidents/${incidentId}/report`
    );

}


/* =====================================
   OPEN INCIDENT REPORT
===================================== */

function openIncidentReport(
    incident
) {

    if (
        !incident ||
        !incident.id
    ) {

        console.error(
            "The incident report cannot be opened because the incident id is missing."
        );

        return;

    }

    const reportUrl =
        getIncidentReportUrl(
            incident.id
        );

    window.open(
        reportUrl,
        "_blank",
        "noopener,noreferrer"
    );

}