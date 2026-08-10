import uuid


class IncidentService:

    ALLOWED_VEHICLE_TYPES = {
        "police",
        "ambulance",
        "fire"
    }

    ALLOWED_PRIORITIES = {
        "low",
        "medium",
        "high",
        "critical"
    }

    ALLOWED_INCIDENT_TYPES = {
        "traffic-accident",
        "theft",
        "assault",
        "public-disturbance",
        "missing-person",

        "medical-emergency",
        "unconscious-person",
        "injured-person",
        "cardiac-emergency",
        "urgent-medical-transport",

        "building-fire",
        "vehicle-fire",
        "vegetation-fire",
        "gas-leak",
        "explosion"
    }

    MAX_RESOURCE_QUANTITY = 20

    MAX_INCIDENT_TYPES = 10

    @staticmethod
    def build_incident_code():

        return (
            "INCIDENT-"
            +
            uuid.uuid4()
                .hex[:12]
                .upper()
        )

    @staticmethod
    def validate_incident_types(
        data
    ):

        incident_types = data.get(
            "incident_types"
        )

        # Compatibilitate cu formularul vechi.
        if incident_types is None:

            legacy_incident_type = str(
                data.get(
                    "incident_type",
                    ""
                )
            ).strip().lower()

            if legacy_incident_type:

                incident_types = [
                    legacy_incident_type
                ]

        if not isinstance(
            incident_types,
            list
        ):

            raise ValueError(
                "Lista tipurilor de incident "
                "nu este validă."
            )

        normalized_types = []

        for incident_type in incident_types:

            normalized_type = str(
                incident_type or ""
            ).strip().lower()

            if not normalized_type:

                continue

            if (
                normalized_type
                not in
                IncidentService.ALLOWED_INCIDENT_TYPES
            ):

                raise ValueError(
                    "Unul dintre tipurile de incident "
                    "nu este valid."
                )

            if (
                normalized_type
                not in normalized_types
            ):

                normalized_types.append(
                    normalized_type
                )

        if not normalized_types:

            raise ValueError(
                "Trebuie selectat cel puțin "
                "un tip de incident."
            )

        if (
            len(normalized_types)
            >
            IncidentService.MAX_INCIDENT_TYPES
        ):

            raise ValueError(
                "Nu pot fi selectate mai mult de "
                f"{IncidentService.MAX_INCIDENT_TYPES} "
                "tipuri pentru același incident."
            )

        return normalized_types

    @staticmethod
    def validate_required_resources(
        data
    ):

        required_resources = data.get(
            "required_resources"
        )

        if required_resources is None:

            legacy_vehicle_type = str(
                data.get(
                    "required_vehicle_type",
                    ""
                )
            ).strip().lower()

            if not legacy_vehicle_type:

                raise ValueError(
                    "Trebuie selectat cel puțin "
                    "un tip de vehicul."
                )

            required_resources = [
                {
                    "vehicle_type":
                        legacy_vehicle_type,

                    "quantity":
                        1
                }
            ]

        if not isinstance(
            required_resources,
            list
        ):

            raise ValueError(
                "Lista resurselor necesare "
                "nu este validă."
            )

        if not required_resources:

            raise ValueError(
                "Trebuie selectat cel puțin "
                "un tip de vehicul."
            )

        normalized_resources = []

        used_vehicle_types = set()

        for resource in required_resources:

            if not isinstance(
                resource,
                dict
            ):

                raise ValueError(
                    "Una dintre resursele incidentului "
                    "nu este validă."
                )

            vehicle_type = str(
                resource.get(
                    "vehicle_type",
                    ""
                )
            ).strip().lower()

            if (
                vehicle_type
                not in
                IncidentService.ALLOWED_VEHICLE_TYPES
            ):

                raise ValueError(
                    "Tipul vehiculului necesar "
                    "nu este valid."
                )

            if vehicle_type in used_vehicle_types:

                raise ValueError(
                    "Același tip de vehicul "
                    "nu poate apărea de mai multe ori."
                )

            try:

                quantity = int(
                    resource.get(
                        "quantity",
                        1
                    )
                )

            except (
                TypeError,
                ValueError
            ) as error:

                raise ValueError(
                    "Numărul vehiculelor necesare "
                    "trebuie să fie întreg."
                ) from error

            if quantity < 1:

                raise ValueError(
                    "Pentru fiecare categorie trebuie "
                    "solicitat cel puțin un vehicul."
                )

            if (
                quantity
                >
                IncidentService.MAX_RESOURCE_QUANTITY
            ):

                raise ValueError(
                    "Nu pot fi solicitate mai mult de "
                    f"{IncidentService.MAX_RESOURCE_QUANTITY} "
                    "vehicule din aceeași categorie."
                )

            used_vehicle_types.add(
                vehicle_type
            )

            normalized_resources.append({
                "vehicle_type":
                    vehicle_type,

                "quantity":
                    quantity
            })

        return normalized_resources

    @staticmethod
    def validate_incident_payload(
        data
    ):

        if not isinstance(
            data,
            dict
        ):

            raise ValueError(
                "Datele incidentului nu sunt valide."
            )

        title = str(
            data.get(
                "title",
                ""
            )
        ).strip()

        priority = str(
            data.get(
                "priority",
                "medium"
            )
        ).strip().lower()

        details = str(
            data.get(
                "details",
                ""
            )
        ).strip()

        if not title:

            raise ValueError(
                "Numele evenimentului este obligatoriu."
            )

        if len(title) > 100:

            raise ValueError(
                "Numele evenimentului nu poate "
                "depăși 100 de caractere."
            )

        if (
            priority
            not in
            IncidentService.ALLOWED_PRIORITIES
        ):

            raise ValueError(
                "Prioritatea incidentului nu este validă."
            )

        if len(details) > 1000:

            raise ValueError(
                "Detaliile nu pot depăși "
                "1000 de caractere."
            )

        incident_types = (
            IncidentService
            .validate_incident_types(
                data
            )
        )

        required_resources = (
            IncidentService
            .validate_required_resources(
                data
            )
        )

        return {
            "title":
                title,

            # Păstrăm primul tip în coloana veche.
            "incident_type":
                incident_types[0],

            "incident_types":
                incident_types,

            "required_vehicle_type":
                required_resources[0][
                    "vehicle_type"
                ],

            "required_resources":
                required_resources,

            "priority":
                priority,

            "details":
                details,

            "incident_code":
                IncidentService
                .build_incident_code()
        }