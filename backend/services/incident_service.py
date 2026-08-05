import uuid


class IncidentService:
    @staticmethod
    def build_incident_code():
        return "INCIDENT-" + uuid.uuid4().hex[:12].upper()

    @staticmethod
    def validate_incident_payload(data):
        title = str(data.get("title", "")).strip()
        incident_type = str(data.get("incident_type", "")).strip().lower()
        required_vehicle_type = str(data.get("required_vehicle_type", "")).strip().lower()
        priority = str(data.get("priority", "medium")).strip().lower()
        details = str(data.get("details", "")).strip()

        allowed_vehicle_types = {"police", "ambulance", "fire"}
        allowed_priorities = {"low", "medium", "high", "critical"}

        if not title:
            raise ValueError("Situation name is required.")

        if len(title) > 100:
            raise ValueError("Situation name cannot exceed 100 characters.")

        if not incident_type:
            raise ValueError("Incident type is required.")

        if required_vehicle_type not in allowed_vehicle_types:
            raise ValueError("Required vehicle type is invalid.")

        if priority not in allowed_priorities:
            raise ValueError("Priority is invalid.")

        if len(details) > 1000:
            raise ValueError("Details cannot exceed 1000 characters.")

        return {
            "title": title,
            "incident_type": incident_type,
            "required_vehicle_type": required_vehicle_type,
            "priority": priority,
            "details": details,
            "incident_code": IncidentService.build_incident_code(),
        }
