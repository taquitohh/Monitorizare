/* =====================================
   VEHICLE STATE
===================================== */

let vehicles = [];

let filteredVehicles = [];

let selectedVehicleId = null;


/* =====================================
   INCIDENT CREATION STATE
===================================== */

let activeIncidentId = null;

let activeIncidentCode = null;

let activeIncidentLocation = null;

let incidentLocationSelectionActive = false;

let incidentLocationSaving = false;

/* =====================================
   STARE CERERI DE ÎNTĂRIRI
===================================== */

let allReinforcementRequests = [];

let filteredReinforcementRequests = [];

let selectedReinforcementRequestId = null;

let reinforcementRequestsLoading = false;

/* =====================================
   FILTRE CERERI DE ÎNTĂRIRI
===================================== */

const reinforcementRequestFilters = {
    status:
        "all",

    vehicleType:
        "all"
};

/* =====================================
   RECOMMENDATION STATE
===================================== */

window.recommendedVehicle = null;

window.recommendedVehicles = [];

window.recommendedVehicleDistance = null;

let recommendationModeActive = false;

let assignmentSaving = false;


/* =====================================
   INCIDENT LIST STATE
===================================== */

let allIncidents = [];

let filteredIncidents = [];

let activeRoutes = [];

let activeRouteId = null;

let sidebarMode = "vehicles";

let activeRoutesLoading = false;

let activeRouteRefreshRunning = false;


/* =====================================
   VEHICLE FILTER STATE
===================================== */

const filters = {
    type: "all",
    status: "all"
};


/* =====================================
   INCIDENT FILTER STATE
===================================== */

const incidentFilters = {
    status: "all",
    type: "all",
    priority: "all"
};


/* =====================================
   INCIDENT STATUS GROUPS
===================================== */

const ACTIVE_INCIDENT_STATUSES = [
    "assigned",
    "in_progress"
];

const ARCHIVED_INCIDENT_STATUSES = [
    "resolved",
    "cancelled"
];


/* =====================================
   REFRESH INTERVALS
===================================== */

const REFRESH_INTERVAL = 1000;

const ACTIVE_ROUTES_INTERVAL = 2000;

const ROUTE_REFRESH_INTERVAL = 2000;