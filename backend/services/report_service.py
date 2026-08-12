import os

from datetime import datetime
from html import escape
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import (
    TA_CENTER,
    TA_LEFT,
    TA_RIGHT,
)
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import (
    ParagraphStyle,
    getSampleStyleSheet,
)
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    LongTable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from staticmap import (
    CircleMarker,
    Line,
    StaticMap,
)


class IncidentReportService:

    SERVICE_NAMES = {
        "police":
            "Poliție",

        "ambulance":
            "Ambulanță",

        "fire":
            "Pompieri",

        "firefighters":
            "Pompieri",
    }


    STATUS_NAMES = {
        "draft":
            "Ciornă",

        "pending_location":
            "Locație în așteptare",

        "pending_dispatch":
            "În așteptarea dispecerizării",

        "assigned":
            "Asignat",

        "in_progress":
            "În desfășurare",

        "arrived":
            "Ajuns",

        "released":
            "Eliberat",

        "resolved":
            "Rezolvat",

        "cancelled":
            "Anulat",

        "pending":
            "În așteptare",

        "confirmed":
            "Confirmat",

        "accepted":
            "Acceptată",

        "rejected":
            "Respinsă",

        "completed":
            "Finalizată",

        "failed":
            "Eșuată",

        "partially_assigned":
            "Asignată parțial",
    }


    PRIORITY_NAMES = {
        "low":
            "Scăzută",

        "medium":
            "Medie",

        "high":
            "Ridicată",

        "critical":
            "Critică",
    }


    ASSIGNMENT_TYPE_NAMES = {
        "primary":
            "Principal",

        "reinforcement":
            "Întărire",
    }


    QUESTION_LABELS = {
        "traffic_affected":
            "Trafic afectat",

        "road_block_required":
            "Este necesară blocarea drumului?",

        "aggressive_persons":
            "Există persoane agresive?",

        "weapons_suspected":
            "Există arme observate sau suspectate?",

        "persons_involved":
            "Număr aproximativ de persoane implicate",

        "perimeter_required":
            "Perimetrul trebuie securizat?",

        "suspects_left_area":
            "Există suspecți care au părăsit zona?",

        "police_notes":
            "Observații operative",

        "estimated_victims":
            "Număr estimat de victime",

        "conscious_victims":
            "Victime conștiente",

        "unconscious_victims":
            "Victime inconștiente",

        "trapped_victims":
            "Victime blocate / încarcerate",

        "pediatric_victims":
            "Există victime pediatrice?",

        "severe_bleeding":
            "Există hemoragii severe raportate?",

        "extrication_required":
            "Este necesară descarcerarea?",

        "crew_risk":
            "Există risc suplimentar pentru echipaj?",

        "medical_notes":
            "Observații medicale",

        "main_situation":
            "Situație principală",

        "active_flame":
            "Flacără activă?",

        "dense_smoke":
            "Fum dens?",

        "explosion_risk":
            "Risc de explozie",

        "hazardous_materials":
            "Sunt implicate substanțe periculoase?",

        "fuel_or_gas":
            "Este implicat combustibil sau gaz?",

        "trapped_persons":
            "Există persoane blocate?",

        "evacuation_required":
            "Este necesară evacuarea zonei?",

        "firefighter_notes":
            "Observații operative",
    }


    def __init__(
        self
    ):

        self.page_width, self.page_height = (
            A4
        )

        self.styles = (
            getSampleStyleSheet()
        )

        self.font_regular = (
            "Helvetica"
        )

        self.font_bold = (
            "Helvetica-Bold"
        )

        self._register_fonts()

        self._configure_styles()


    # =====================================
    # FONT
    # =====================================

    def _register_fonts(
        self
    ):

        regular_candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/dejavu/DejaVuSans.ttf",
            "/usr/local/share/fonts/DejaVuSans.ttf",
            "/app/fonts/DejaVuSans.ttf",
        ]

        bold_candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
            "/usr/local/share/fonts/DejaVuSans-Bold.ttf",
            "/app/fonts/DejaVuSans-Bold.ttf",
        ]

        regular_path = (
            self._find_existing_file(
                regular_candidates
            )
        )

        bold_path = (
            self._find_existing_file(
                bold_candidates
            )
        )

        if (
            not regular_path
            or
            not bold_path
        ):

            raise RuntimeError(
                "Fonturile DejaVu Sans nu au fost găsite în container."
            )

        pdfmetrics.registerFont(
            TTFont(
                "IncidentSans",
                regular_path
            )
        )

        pdfmetrics.registerFont(
            TTFont(
                "IncidentSansBold",
                bold_path
            )
        )

        self.font_regular = (
            "IncidentSans"
        )

        self.font_bold = (
            "IncidentSansBold"
        )


    @staticmethod
    def _find_existing_file(
        candidates
    ):

        for path in candidates:

            if os.path.isfile(
                path
            ):

                return path

        return None



    # =====================================
    # STILURI
    # =====================================

    def _configure_styles(
        self
    ):

        dark = colors.HexColor(
            "#0F172A"
        )

        text = colors.HexColor(
            "#334155"
        )

        muted = colors.HexColor(
            "#64748B"
        )

        primary = colors.HexColor(
            "#1D4ED8"
        )


        self.title_style = (
            ParagraphStyle(
                name=
                    "IncidentReportTitle",

                parent=
                    self.styles[
                        "Title"
                    ],

                fontName=
                    self.font_bold,

                fontSize=
                    20,

                leading=
                    24,

                alignment=
                    TA_LEFT,

                textColor=
                    dark,

                spaceAfter=
                    2 * mm
            )
        )


        self.report_type_style = (
            ParagraphStyle(
                name=
                    "IncidentReportType",

                parent=
                    self.styles[
                        "Normal"
                    ],

                fontName=
                    self.font_bold,

                fontSize=
                    9,

                leading=
                    12,

                alignment=
                    TA_LEFT,

                textColor=
                    primary,

                spaceAfter=
                    2 * mm
            )
        )


        self.section_title_style = (
            ParagraphStyle(
                name=
                    "IncidentSectionTitle",

                parent=
                    self.styles[
                        "Heading2"
                    ],

                fontName=
                    self.font_bold,

                fontSize=
                    12,

                leading=
                    15,

                alignment=
                    TA_LEFT,

                textColor=
                    dark,

                spaceBefore=
                    4 * mm,

                spaceAfter=
                    3 * mm
            )
        )


        self.subsection_style = (
            ParagraphStyle(
                name=
                    "IncidentSubsectionTitle",

                parent=
                    self.styles[
                        "Heading3"
                    ],

                fontName=
                    self.font_bold,

                fontSize=
                    9.5,

                leading=
                    12,

                textColor=
                    primary,

                spaceBefore=
                    3 * mm,

                spaceAfter=
                    2 * mm
            )
        )


        self.normal_style = (
            ParagraphStyle(
                name=
                    "IncidentNormal",

                parent=
                    self.styles[
                        "BodyText"
                    ],

                fontName=
                    self.font_regular,

                fontSize=
                    8.5,

                leading=
                    12,

                textColor=
                    text
            )
        )


        self.normal_bold_style = (
            ParagraphStyle(
                name=
                    "IncidentNormalBold",

                parent=
                    self.normal_style,

                fontName=
                    self.font_bold
            )
        )


        self.small_style = (
            ParagraphStyle(
                name=
                    "IncidentSmall",

                parent=
                    self.styles[
                        "BodyText"
                    ],

                fontName=
                    self.font_regular,

                fontSize=
                    7,

                leading=
                    9,

                textColor=
                    muted
            )
        )


        self.small_bold_style = (
            ParagraphStyle(
                name=
                    "IncidentSmallBold",

                parent=
                    self.small_style,

                fontName=
                    self.font_bold
            )
        )


        self.center_small_style = (
            ParagraphStyle(
                name=
                    "IncidentCenterSmall",

                parent=
                    self.small_style,

                alignment=
                    TA_CENTER
            )
        )


        self.right_small_style = (
            ParagraphStyle(
                name=
                    "IncidentRightSmall",

                parent=
                    self.small_style,

                alignment=
                    TA_RIGHT
            )
        )


        self.conclusion_style = (
            ParagraphStyle(
                name=
                    "IncidentConclusion",

                parent=
                    self.normal_style,

                fontSize=
                    9,

                leading=
                    14,

                leftIndent=
                    4 * mm,

                rightIndent=
                    4 * mm,

                borderWidth=
                    0.7,

                borderColor=
                    colors.HexColor(
                        "#CBD5E1"
                    ),

                borderPadding=
                    9,

                backColor=
                    colors.HexColor(
                        "#F8FAFC"
                    ),

                textColor=
                    dark
            )
        )


    # =====================================
    # GENERARE RAPORT
    # =====================================

    def generate_report(
        self,
        report_data
    ):

        if not isinstance(
            report_data,
            dict
        ):

            raise ValueError(
                "Report data is required."
            )


        incident = (
            report_data.get(
                "incident"
            )
            or
            {}
        )


        if not incident:

            raise ValueError(
                "Incident data is required."
            )


        buffer = (
            BytesIO()
        )


        document = (
            SimpleDocTemplate(
                buffer,

                pagesize=
                    A4,

                rightMargin=
                    15 * mm,

                leftMargin=
                    15 * mm,

                topMargin=
                    18 * mm,

                bottomMargin=
                    18 * mm,

                title=
                    self._get_document_title(
                        incident
                    ),

                author=
                    "GPS Tracking System",

                subject=
                    (
                        "Raport operațional final "
                        "al incidentului"
                    )
            )
        )


        story = []


        story.extend(
            self._build_header(
                incident
            )
        )


        story.extend(
            self._build_general_section(
                incident,
                report_data
            )
        )


        story.extend(
            self._build_operational_summary_section(
                report_data
            )
        )


        story.extend(
            self._build_required_resources_section(
                report_data
            )
        )


        story.extend(
            self._build_vehicle_section(
                report_data
            )
        )


        story.extend(
            self._build_reinforcement_section(
                report_data
            )
        )


        story.extend(
            self._build_specialist_section(
                report_data
            )
        )


        story.extend(
            self._build_events_section(
                report_data
            )
        )


        story.extend(
            self._build_routes_section(
                report_data
            )
        )


        story.extend(
            self._build_conclusion_section(
                incident,
                report_data
            )
        )


        document.build(
            story,

            onFirstPage=
                self._draw_page_footer,

            onLaterPages=
                self._draw_page_footer
        )


        pdf_bytes = (
            buffer.getvalue()
        )


        buffer.close()


        return pdf_bytes


    # =====================================
    # HEADER
    # =====================================

    def _build_header(
        self,
        incident
    ):

        generated_at = (
            datetime.now()
        )


        header_table = Table(
            [
                [
                    Paragraph(
                        "GPS TRACKING SYSTEM",
                        self.report_type_style
                    ),

                    Paragraph(
                        (
                            "Generat: "
                            f"{self._format_datetime(generated_at)}"
                        ),
                        self.right_small_style
                    ),
                ],

                [
                    Paragraph(
                        "Raport operațional final",
                        self.title_style
                    ),

                    "",
                ],

                [
                    Paragraph(
                        (
                            "<b>Incident:</b> "
                            f"{self._safe_text(incident.get('incident_code') or '-')}"
                        ),
                        self.normal_style
                    ),

                    Paragraph(
                        (
                            "<b>Stare:</b> "
                            f"{self._safe_text(self._status_name(incident.get('status')))}"
                            "<br/>"
                            "<b>Prioritate:</b> "
                            f"{self._safe_text(self._priority_name(incident.get('priority')))}"
                        ),
                        self.right_small_style
                    ),
                ],
            ],

            colWidths=[
                115 * mm,
                65 * mm,
            ]
        )


        header_table.setStyle(
            TableStyle([
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP"
                ),

                (
                    "LINEBELOW",
                    (0, -1),
                    (-1, -1),
                    1,
                    colors.HexColor(
                        "#CBD5E1"
                    )
                ),

                (
                    "BOTTOMPADDING",
                    (0, -1),
                    (-1, -1),
                    8
                ),

                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    0
                ),

                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    0
                ),
            ])
        )


        return [
            header_table,

            Spacer(
                1,
                5 * mm
            ),
        ]


    # =====================================
    # DATE GENERALE
    # =====================================

    def _build_general_section(
        self,
        incident,
        report_data
    ):

        incident_types = (
            report_data.get(
                "incident_types"
            )
            or
            incident.get(
                "incident_types"
            )
            or
            []
        )


        incident_types_text = (
            ", ".join(
                self._readable_code(
                    item
                )
                for item
                in incident_types
            )
            or
            self._readable_code(
                incident.get(
                    "incident_type"
                )
            )
        )


        rows = [
            [
                self._label_cell(
                    "Cod incident"
                ),

                self._value_cell(
                    incident.get(
                        "incident_code"
                    )
                ),

                self._label_cell(
                    "ID intern"
                ),

                self._value_cell(
                    incident.get(
                        "id"
                    )
                ),
            ],

            [
                self._label_cell(
                    "Titlu"
                ),

                self._value_cell(
                    incident.get(
                        "title"
                    )
                ),

                self._label_cell(
                    "Prioritate"
                ),

                self._value_cell(
                    self._priority_name(
                        incident.get(
                            "priority"
                        )
                    )
                ),
            ],

            [
                self._label_cell(
                    "Tipuri incident"
                ),

                self._value_cell(
                    incident_types_text
                ),

                self._label_cell(
                    "Stare finală"
                ),

                self._value_cell(
                    self._status_name(
                        incident.get(
                            "status"
                        )
                    )
                ),
            ],

            [
                self._label_cell(
                    "Latitudine"
                ),

                self._value_cell(
                    self._format_coordinate(
                        incident.get(
                            "latitude"
                        )
                    )
                ),

                self._label_cell(
                    "Longitudine"
                ),

                self._value_cell(
                    self._format_coordinate(
                        incident.get(
                            "longitude"
                        )
                    )
                ),
            ],
        ]


        return [
            Paragraph(
                "1. Date generale ale incidentului",
                self.section_title_style
            ),

            self._create_four_column_table(
                rows
            ),

            Spacer(
                1,
                3 * mm
            ),

            Paragraph(
                "<b>Detalii inițiale</b>",
                self.normal_bold_style
            ),

            Spacer(
                1,
                1 * mm
            ),

            Paragraph(
                self._safe_multiline_text(
                    incident.get(
                        "details"
                    )
                    or
                    (
                        "Nu au fost furnizate "
                        "detalii suplimentare."
                    )
                ),
                self.normal_style
            ),

            Spacer(
                1,
                5 * mm
            ),
        ]


    # =====================================
    # SUMAR OPERAȚIONAL
    # =====================================

    def _build_operational_summary_section(
        self,
        report_data
    ):

        summary = (
            report_data.get(
                "summary"
            )
            or
            {}
        )


        times = (
            report_data.get(
                "operational_times"
            )
            or
            {}
        )


        rows = [
            [
                self._metric_cell(
                    "Vehicule implicate",
                    summary.get(
                        "vehicle_count",
                        0
                    )
                ),

                self._metric_cell(
                    "Vehicule principale",
                    summary.get(
                        "primary_vehicle_count",
                        0
                    )
                ),

                self._metric_cell(
                    "Vehicule întărire",
                    summary.get(
                        "reinforcement_vehicle_count",
                        0
                    )
                ),
            ],

            [
                self._metric_cell(
                    "Prima asignare",
                    self._format_datetime(
                        times.get(
                            "first_assignment_at"
                        )
                    )
                ),

                self._metric_cell(
                    "Prima sosire",
                    self._format_datetime(
                        times.get(
                            "first_arrival_at"
                        )
                    )
                ),

                self._metric_cell(
                    "Ultima eliberare",
                    self._format_datetime(
                        times.get(
                            "last_release_at"
                        )
                    )
                ),
            ],

            [
                self._metric_cell(
                    "Timp până la dispatch",
                    self._format_duration_seconds(
                        times.get(
                            "dispatch_delay_seconds"
                        )
                    )
                ),

                self._metric_cell(
                    "Timp până la prima sosire",
                    self._format_duration_seconds(
                        times.get(
                            "first_response_seconds"
                        )
                    )
                ),

                self._metric_cell(
                    "Durată totală incident",
                    self._format_duration_seconds(
                        times.get(
                            "total_incident_seconds"
                        )
                    )
                ),
            ],

            [
                self._metric_cell(
                    "Cereri întăriri",
                    summary.get(
                        "reinforcement_request_count",
                        0
                    )
                ),

                self._metric_cell(
                    "Chestionare servicii",
                    summary.get(
                        "specialist_report_count",
                        0
                    )
                ),

                self._metric_cell(
                    "Distanță GPS totală",
                    self._format_distance(
                        summary.get(
                            "total_recorded_distance_km"
                        )
                    )
                ),
            ],
        ]


        table = Table(
            rows,

            colWidths=[
                60 * mm,
                60 * mm,
                60 * mm,
            ]
        )


        table.setStyle(
            TableStyle([
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP"
                ),

                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor(
                        "#E2E8F0"
                    )
                ),

                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    colors.HexColor(
                        "#F8FAFC"
                    )
                ),

                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                ),

                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                ),

                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                ),

                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                ),
            ])
        )


        return [
            Paragraph(
                "2. Sumar operațional",
                self.section_title_style
            ),

            table,

            Spacer(
                1,
                5 * mm
            ),
        ]


    # =====================================
    # RESURSE INIȚIALE
    # =====================================

    def _build_required_resources_section(
        self,
        report_data
    ):

        resources = (
            report_data.get(
                "required_resources"
            )
            or
            []
        )


        elements = [
            Paragraph(
                "3. Resurse solicitate inițial",
                self.section_title_style
            )
        ]


        if not resources:

            elements.extend([
                Paragraph(
                    (
                        "Nu există resurse inițiale "
                        "înregistrate."
                    ),
                    self.normal_style
                ),

                Spacer(
                    1,
                    5 * mm
                ),
            ])


            return elements


        rows = [[
            self._header_cell(
                "Serviciu"
            ),

            self._header_cell(
                "Cantitate solicitată"
            ),
        ]]


        for resource in resources:

            rows.append([
                self._value_cell(
                    self._service_name(
                        resource.get(
                            "vehicle_type"
                        )
                    )
                ),

                self._value_cell(
                    resource.get(
                        "quantity",
                        0
                    )
                ),
            ])


        elements.extend([
            self._create_standard_table(
                rows,

                [
                    110 * mm,
                    70 * mm,
                ],

                header=
                    True
            ),

            Spacer(
                1,
                5 * mm
            ),
        ])


        return elements


    # =====================================
    # VEHICULE
    # =====================================

    def _build_vehicle_section(
        self,
        report_data
    ):

        assignments = (
            report_data.get(
                "assignments"
            )
            or
            []
        )


        elements = [
            Paragraph(
                "4. Vehicule implicate în intervenție",
                self.section_title_style
            )
        ]


        if not assignments:

            elements.extend([
                Paragraph(
                    (
                        "Nu există vehicule "
                        "înregistrate pentru incident."
                    ),
                    self.normal_style
                ),

                Spacer(
                    1,
                    5 * mm
                ),
            ])


            return elements


        grouped = {}


        for assignment in assignments:

            service = str(
                assignment.get(
                    "vehicle_type"
                )
                or
                "unknown"
            ).lower()


            grouped.setdefault(
                service,
                []
            ).append(
                assignment
            )


        preferred_order = [
            "police",
            "ambulance",
            "fire",
            "firefighters",
        ]


        service_keys = list(
            grouped.keys()
        )


        service_keys.sort(
            key=lambda value:
                (
                    preferred_order.index(
                        value
                    )
                    if value
                    in preferred_order
                    else 999
                )
        )


        for service in service_keys:

            vehicles = (
                grouped[
                    service
                ]
            )


            elements.append(
                Paragraph(
                    (
                        f"{self._service_name(service)} "
                        f"({len(vehicles)})"
                    ),
                    self.subsection_style
                )
            )


            rows = [[
                self._header_cell(
                    "Vehicul"
                ),

                self._header_cell(
                    "Rol"
                ),

                self._header_cell(
                    "Asignat"
                ),

                self._header_cell(
                    "Ajuns"
                ),

                self._header_cell(
                    "Eliberat"
                ),

                self._header_cell(
                    "Deplasare"
                ),

                self._header_cell(
                    "Distanță"
                ),
            ]]


            for assignment in vehicles:

                travel_duration = (
                    self._duration_between(
                        assignment.get(
                            "assigned_at"
                        ),

                        assignment.get(
                            "arrived_at"
                        )
                    )
                )


                vehicle_name = (
                    assignment.get(
                        "vehicle_code"
                    )
                    or
                    (
                        "ID "
                        f"{assignment.get('vehicle_id', '-')}"
                    )
                )


                if assignment.get(
                    "vehicle_name"
                ):

                    vehicle_name += (
                        " / "
                        +
                        str(
                            assignment[
                                "vehicle_name"
                            ]
                        )
                    )


                rows.append([
                    self._value_cell(
                        vehicle_name
                    ),

                    self._value_cell(
                        self._assignment_type_name(
                            assignment.get(
                                "assignment_type"
                            )
                        )
                    ),

                    self._value_cell(
                        self._format_datetime(
                            assignment.get(
                                "assigned_at"
                            )
                        )
                    ),

                    self._value_cell(
                        self._format_datetime(
                            assignment.get(
                                "arrived_at"
                            )
                        )
                    ),

                    self._value_cell(
                        self._format_datetime(
                            assignment.get(
                                "released_at"
                            )
                        )
                    ),

                    self._value_cell(
                        travel_duration
                    ),

                    self._value_cell(
                        self._format_distance(
                            assignment.get(
                                "distance_km"
                            )
                        )
                    ),
                ])


            table = LongTable(
                rows,

                colWidths=[
                    31 * mm,
                    22 * mm,
                    29 * mm,
                    29 * mm,
                    29 * mm,
                    20 * mm,
                    20 * mm,
                ],

                repeatRows=
                    1
            )


            self._apply_standard_table_style(
                table,
                header=True
            )


            elements.append(
                table
            )


            elements.append(
                Spacer(
                    1,
                    4 * mm
                )
            )


        return elements


    # =====================================
    # ÎNTĂRIRI
    # =====================================

    def _build_reinforcement_section(
        self,
        report_data
    ):

        requests = (
            report_data.get(
                "reinforcement_requests"
            )
            or
            []
        )


        summary = (
            report_data.get(
                "reinforcement_summary"
            )
            or
            {}
        )


        elements = [
            Paragraph(
                "5. Cereri de întăriri",
                self.section_title_style
            )
        ]


        if not requests:

            elements.extend([
                Paragraph(
                    (
                        "Nu au fost înregistrate "
                        "cereri de întăriri."
                    ),
                    self.normal_style
                ),

                Spacer(
                    1,
                    5 * mm
                ),
            ])


            return elements


        summary_table = Table(
            [[
                self._metric_cell(
                    "Total cereri",
                    summary.get(
                        "total_requests",
                        len(requests)
                    )
                ),

                self._metric_cell(
                    "Vehicule solicitate",
                    summary.get(
                        "requested_vehicles",
                        0
                    )
                ),

                self._metric_cell(
                    "Vehicule aprobate",
                    summary.get(
                        "approved_vehicles",
                        0
                    )
                ),

                self._metric_cell(
                    "Vehicule asignate",
                    summary.get(
                        "assigned_vehicles",
                        0
                    )
                ),
            ]],

            colWidths=[
                45 * mm,
                45 * mm,
                45 * mm,
                45 * mm,
            ]
        )


        summary_table.setStyle(
            TableStyle([
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor(
                        "#E2E8F0"
                    )
                ),

                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    colors.HexColor(
                        "#F8FAFC"
                    )
                ),

                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP"
                ),

                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                ),

                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                ),

                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                ),

                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                ),
            ])
        )


        elements.extend([
            summary_table,

            Spacer(
                1,
                4 * mm
            ),
        ])


        for index, request_item in enumerate(
            requests,
            start=1
        ):

            requester = (
                request_item.get(
                    "requested_by_vehicle_code"
                )
                or
                "-"
            )


            request_status = (
                self._status_name(
                    request_item.get(
                        "status"
                    )
                )
            )


            elements.append(
                Paragraph(
                    (
                        f"Cererea #{index} — "
                        f"{self._safe_text(requester)} — "
                        f"{self._safe_text(request_status)}"
                    ),
                    self.subsection_style
                )
            )


            request_rows = [
                [
                    self._label_cell(
                        "Creată"
                    ),

                    self._value_cell(
                        self._format_datetime(
                            request_item.get(
                                "created_at"
                            )
                        )
                    ),

                    self._label_cell(
                        "Analizată"
                    ),

                    self._value_cell(
                        self._format_datetime(
                            request_item.get(
                                "reviewed_at"
                            )
                        )
                    ),
                ],

                [
                    self._label_cell(
                        "Solicitant"
                    ),

                    self._value_cell(
                        requester
                    ),

                    self._label_cell(
                        "Analizată de"
                    ),

                    self._value_cell(
                        request_item.get(
                            "reviewed_by_display_name"
                        )
                        or
                        "-"
                    ),
                ],
            ]


            elements.append(
                self._create_four_column_table(
                    request_rows
                )
            )


            request_message = (
                request_item.get(
                    "requested_message"
                )
            )


            dispatcher_message = (
                request_item.get(
                    "dispatcher_message"
                )
            )


            if request_message:

                elements.extend([
                    Spacer(
                        1,
                        2 * mm
                    ),

                    Paragraph(
                        "<b>Mesaj echipaj</b>",
                        self.small_bold_style
                    ),

                    Paragraph(
                        self._safe_multiline_text(
                            request_message
                        ),
                        self.small_style
                    ),
                ])


            if dispatcher_message:

                elements.extend([
                    Spacer(
                        1,
                        2 * mm
                    ),

                    Paragraph(
                        "<b>Mesaj dispecerat</b>",
                        self.small_bold_style
                    ),

                    Paragraph(
                        self._safe_multiline_text(
                            dispatcher_message
                        ),
                        self.small_style
                    ),
                ])


            resources = (
                request_item.get(
                    "resources"
                )
                or
                []
            )


            if resources:

                resource_rows = [[
                    self._header_cell(
                        "Serviciu"
                    ),

                    self._header_cell(
                        "Solicitat"
                    ),

                    self._header_cell(
                        "Aprobat"
                    ),

                    self._header_cell(
                        "Asignat"
                    ),
                ]]


                for resource in resources:

                    resource_rows.append([
                        self._value_cell(
                            self._service_name(
                                resource.get(
                                    "vehicle_type"
                                )
                            )
                        ),

                        self._value_cell(
                            resource.get(
                                "requested_quantity",
                                0
                            )
                        ),

                        self._value_cell(
                            resource.get(
                                "approved_quantity",
                                0
                            )
                        ),

                        self._value_cell(
                            resource.get(
                                "assigned_quantity",
                                0
                            )
                        ),
                    ])


                elements.extend([
                    Spacer(
                        1,
                        2 * mm
                    ),

                    self._create_standard_table(
                        resource_rows,

                        [
                            90 * mm,
                            30 * mm,
                            30 * mm,
                            30 * mm,
                        ],

                        header=
                            True
                    ),
                ])


            elements.append(
                Spacer(
                    1,
                    4 * mm
                )
            )


        return elements


    # =====================================
    # CHESTIONARE SPECIALIZATE
    # =====================================

    def _build_specialist_section(
        self,
        report_data
    ):

        reports = (
            report_data.get(
                "specialist_reports"
            )
            or
            []
        )


        elements = [
            Paragraph(
                "6. Informații operative specializate",
                self.section_title_style
            )
        ]


        if not reports:

            elements.extend([
                Paragraph(
                    (
                        "Nu există chestionare "
                        "specializate pentru acest incident."
                    ),
                    self.normal_style
                ),

                Spacer(
                    1,
                    5 * mm
                ),
            ])


            return elements


        for report in reports:

            service_type = str(
                report.get(
                    "service_type"
                )
                or
                ""
            ).lower()


            service_name = (
                self._service_name(
                    service_type
                )
            )


            report_status = (
                self._status_name(
                    report.get(
                        "status"
                    )
                )
            )


            elements.append(
                Paragraph(
                    (
                        f"{self._safe_text(service_name)} — "
                        f"{self._safe_text(report_status)}"
                    ),
                    self.subsection_style
                )
            )


            metadata_rows = [
                [
                    self._label_cell(
                        "Creat"
                    ),

                    self._value_cell(
                        self._format_datetime(
                            report.get(
                                "created_at"
                            )
                        )
                    ),

                    self._label_cell(
                        "Actualizat"
                    ),

                    self._value_cell(
                        self._format_datetime(
                            report.get(
                                "updated_at"
                            )
                        )
                    ),
                ],

                [
                    self._label_cell(
                        "Confirmat"
                    ),

                    self._value_cell(
                        self._format_datetime(
                            report.get(
                                "confirmed_at"
                            )
                        )
                    ),

                    self._label_cell(
                        "Status"
                    ),

                    self._value_cell(
                        report_status
                    ),
                ],
            ]


            elements.append(
                self._create_four_column_table(
                    metadata_rows
                )
            )


            answers = (
                report.get(
                    "answers"
                )
                or
                {}
            )


            normalized_answers = (
                self._normalize_answers(
                    answers
                )
            )


            if not normalized_answers:

                elements.extend([
                    Spacer(
                        1,
                        2 * mm
                    ),

                    Paragraph(
                        (
                            "Nu au fost înregistrate "
                            "răspunsuri pentru acest chestionar."
                        ),
                        self.small_style
                    ),
                ])


            else:

                answer_rows = [[
                    self._header_cell(
                        "Informație"
                    ),

                    self._header_cell(
                        "Valoare"
                    ),
                ]]


                for (
                    question_code,
                    answer_value
                ) in normalized_answers:

                    answer_rows.append([
                        self._value_cell(
                            self._question_label(
                                question_code
                            )
                        ),

                        self._value_cell(
                            self._format_answer(
                                answer_value
                            )
                        ),
                    ])


                elements.extend([
                    Spacer(
                        1,
                        2 * mm
                    ),

                    self._create_standard_table(
                        answer_rows,

                        [
                            95 * mm,
                            85 * mm,
                        ],

                        header=
                            True
                    ),
                ])


            elements.append(
                Spacer(
                    1,
                    4 * mm
                )
            )


        return elements


    # =====================================
    # CRONOLOGIE
    # =====================================

    def _build_events_section(
        self,
        report_data
    ):

        events = (
            report_data.get(
                "events"
            )
            or
            []
        )


        elements = [
            Paragraph(
                "7. Cronologia intervenției",
                self.section_title_style
            )
        ]


        if not events:

            elements.extend([
                Paragraph(
                    (
                        "Nu există evenimente "
                        "înregistrate pentru incident."
                    ),
                    self.normal_style
                ),

                Spacer(
                    1,
                    5 * mm
                ),
            ])


            return elements


        rows = [[
            self._header_cell(
                "Moment"
            ),

            self._header_cell(
                "Categorie"
            ),

            self._header_cell(
                "Eveniment"
            ),

            self._header_cell(
                "Utilizator"
            ),
        ]]


        for event in events:

            source = (
                event.get(
                    "service_type"
                )
                or
                event.get(
                    "source_type"
                )
                or
                "-"
            )


            source_normalized = str(
                source
            ).lower()


            if source_normalized in {
                "police",
                "ambulance",
                "fire",
                "firefighters",
            }:

                source_text = (
                    self._service_name(
                        source_normalized
                    )
                )


            else:

                source_text = (
                    self._readable_code(
                        source
                    )
                )


            user_name = (
                event.get(
                    "created_by_display_name"
                )
                or
                (
                    "Sistem"
                    if not event.get(
                        "created_by_user_id"
                    )
                    else "-"
                )
            )


            rows.append([
                self._value_cell(
                    self._format_datetime(
                        event.get(
                            "created_at"
                        )
                    )
                ),

                self._value_cell(
                    source_text
                ),

                self._value_cell(
                    event.get(
                        "message"
                    )
                    or
                    self._readable_code(
                        event.get(
                            "event_type"
                        )
                    )
                ),

                self._value_cell(
                    user_name
                ),
            ])


        table = LongTable(
            rows,

            colWidths=[
                32 * mm,
                30 * mm,
                86 * mm,
                32 * mm,
            ],

            repeatRows=
                1
        )


        self._apply_standard_table_style(
            table,
            header=True
        )


        elements.extend([
            table,

            Spacer(
                1,
                5 * mm
            ),
        ])


        return elements


    # =====================================
    # TRASEE GPS
    # =====================================

    def _build_routes_section(
        self,
        report_data
    ):

        routes = (
            report_data.get(
                "vehicle_routes"
            )
            or
            []
        )


        elements = [
            Paragraph(
                "8. Trasee și deplasări GPS",
                self.section_title_style
            )
        ]


        routes_with_data = [
            route

            for route
            in routes

            if (
                route.get(
                    "coordinates"
                )
                or
                route.get(
                    "distance_km"
                )
                is not None
            )
        ]


        if not routes_with_data:

            elements.extend([
                Paragraph(
                    (
                        "Nu există suficiente date GPS "
                        "pentru reconstruirea traseelor."
                    ),
                    self.normal_style
                ),

                Spacer(
                    1,
                    5 * mm
                ),
            ])


            return elements


        route_rows = [[
            self._header_cell(
                "Vehicul"
            ),

            self._header_cell(
                "Serviciu"
            ),

            self._header_cell(
                "Rol"
            ),

            self._header_cell(
                "Distanță"
            ),

            self._header_cell(
                "Puncte GPS"
            ),

            self._header_cell(
                "Interval"
            ),
        ]]


        for route in routes_with_data:

            interval = (
                f"{self._format_datetime(route.get('route_start_at'))}"
                " → "
                f"{self._format_datetime(route.get('route_end_at'))}"
            )


            route_rows.append([
                self._value_cell(
                    route.get(
                        "vehicle_code"
                    )
                ),

                self._value_cell(
                    self._service_name(
                        route.get(
                            "vehicle_type"
                        )
                    )
                ),

                self._value_cell(
                    self._assignment_type_name(
                        route.get(
                            "assignment_type"
                        )
                    )
                ),

                self._value_cell(
                    self._format_distance(
                        route.get(
                            "distance_km"
                        )
                    )
                ),

                self._value_cell(
                    route.get(
                        "coordinate_count",
                        0
                    )
                ),

                self._value_cell(
                    interval
                ),
            ])


        route_table = LongTable(
            route_rows,

            colWidths=[
                30 * mm,
                27 * mm,
                24 * mm,
                23 * mm,
                23 * mm,
                53 * mm,
            ],

            repeatRows=
                1
        )


        self._apply_standard_table_style(
            route_table,
            header=True
        )


        elements.extend([
            route_table,

            Spacer(
                1,
                4 * mm
            ),
        ])


        map_count = 0


        for route in routes_with_data:

            coordinates = (
                route.get(
                    "coordinates"
                )
                or
                []
            )


            if len(
                coordinates
            ) < 2:

                continue


            image_buffer = (
                self._generate_route_map_image(
                    route
                )
            )


            if image_buffer is None:

                continue


            map_count += 1


            elements.append(
                Paragraph(
                    (
                        "Traseu — "
                        f"{self._safe_text(route.get('vehicle_code') or '-')}"
                        " / "
                        f"{self._safe_text(self._service_name(route.get('vehicle_type')))}"
                    ),
                    self.subsection_style
                )
            )


            image = Image(
                image_buffer,

                width=
                    170 * mm,

                height=
                    95 * mm
            )


            image.hAlign = (
                "CENTER"
            )


            elements.extend([
                image,

                Spacer(
                    1,
                    1.5 * mm
                ),

                Paragraph(
                    (
                        "Marcajul albastru indică "
                        "prima poziție GPS disponibilă, "
                        "iar marcajul roșu indică "
                        "locația incidentului. "
                        "Linia reprezintă traseul GPS "
                        "înregistrat pentru vehicul."
                    ),
                    self.center_small_style
                ),

                Spacer(
                    1,
                    4 * mm
                ),
            ])


        if map_count == 0:

            elements.extend([
                Paragraph(
                    (
                        "Datele numerice ale traseelor "
                        "sunt disponibile mai sus, însă "
                        "imaginile cartografice nu au "
                        "putut fi generate."
                    ),
                    self.small_style
                ),

                Spacer(
                    1,
                    4 * mm
                ),
            ])


        return elements


    # =====================================
    # CONCLUZIE
    # =====================================

    def _build_conclusion_section(
        self,
        incident,
        report_data
    ):

        summary = (
            report_data.get(
                "summary"
            )
            or
            {}
        )


        reinforcement_summary = (
            report_data.get(
                "reinforcement_summary"
            )
            or
            {}
        )


        incident_code = (
            self._safe_text(
                incident.get(
                    "incident_code"
                )
                or
                "-"
            )
        )


        status = (
            self._safe_text(
                self._status_name(
                    incident.get(
                        "status"
                    )
                )
            )
        )


        vehicle_count = int(
            summary.get(
                "vehicle_count"
            )
            or
            0
        )


        reinforcement_count = int(
            summary.get(
                "reinforcement_vehicle_count"
            )
            or
            0
        )


        request_count = int(
            reinforcement_summary.get(
                "total_requests"
            )
            or
            0
        )


        specialist_count = int(
            summary.get(
                "specialist_report_count"
            )
            or
            0
        )


        total_distance = (
            self._safe_text(
                self._format_distance(
                    summary.get(
                        "total_recorded_distance_km"
                    )
                )
            )
        )


        conclusion = (
            f"Incidentul <b>{incident_code}</b> "
            f"s-a încheiat cu starea "
            f"<b>{status}</b>. "

            f"În cadrul intervenției au fost "
            f"înregistrate <b>{vehicle_count}</b> "
            f"vehicule, dintre care "
            f"<b>{reinforcement_count}</b> "
            f"au fost asignate ca întăriri. "

            f"Au fost înregistrate "
            f"<b>{request_count}</b> "
            f"cereri de întăriri și "
            f"<b>{specialist_count}</b> "
            f"chestionare operative specializate. "

            f"Distanța GPS cumulată disponibilă "
            f"pentru deplasările asociate incidentului "
            f"este <b>{total_distance}</b>. "

            "Raportul a fost generat automat pe baza "
            "datelor operaționale existente în sistem "
            "la momentul generării."
        )


        return [
            Paragraph(
                "9. Concluzie",
                self.section_title_style
            ),

            Paragraph(
                conclusion,
                self.conclusion_style
            ),

            Spacer(
                1,
                8 * mm
            ),

            Paragraph(
                "Sfârșitul raportului",
                self.center_small_style
            ),
        ]


    # =====================================
    # HARTĂ TRASEU
    # =====================================

    def _generate_route_map_image(
        self,
        route_information
    ):

        coordinates = (
            route_information.get(
                "coordinates"
            )
            or
            []
        )


        route_points = []


        for coordinate in coordinates:

            if not isinstance(
                coordinate,
                dict
            ):

                continue


            try:

                latitude = float(
                    coordinate.get(
                        "latitude"
                    )
                )


                longitude = float(
                    coordinate.get(
                        "longitude"
                    )
                )


            except (
                TypeError,
                ValueError
            ):

                continue


            route_points.append(
                (
                    longitude,
                    latitude
                )
            )


        if len(
            route_points
        ) < 2:

            return None


        try:

            static_map = StaticMap(
                1200,
                670,

                padding_x=
                    90,

                padding_y=
                    90,

                url_template=(
                    "https://tile.openstreetmap.org/"
                    "{z}/{x}/{y}.png"
                )
            )


            static_map.add_line(
                Line(
                    route_points,
                    "white",
                    10
                )
            )


            static_map.add_line(
                Line(
                    route_points,
                    "#2563EB",
                    6
                )
            )


            start_point = (
                route_points[0]
            )


            destination_point = (
                route_points[-1]
            )


            incident_latitude = (
                route_information.get(
                    "incident_latitude"
                )
            )


            incident_longitude = (
                route_information.get(
                    "incident_longitude"
                )
            )


            if (
                incident_latitude
                is not None
                and
                incident_longitude
                is not None
            ):

                try:

                    destination_point = (
                        float(
                            incident_longitude
                        ),
                        float(
                            incident_latitude
                        ),
                    )


                except (
                    TypeError,
                    ValueError
                ):

                    destination_point = (
                        route_points[-1]
                    )


            static_map.add_marker(
                CircleMarker(
                    start_point,
                    "white",
                    21
                )
            )


            static_map.add_marker(
                CircleMarker(
                    start_point,
                    "#2563EB",
                    14
                )
            )


            static_map.add_marker(
                CircleMarker(
                    destination_point,
                    "white",
                    21
                )
            )


            static_map.add_marker(
                CircleMarker(
                    destination_point,
                    "#DC2626",
                    14
                )
            )


            rendered_map = (
                static_map.render()
            )


            image_buffer = (
                BytesIO()
            )


            rendered_map.save(
                image_buffer,
                format="PNG"
            )


            image_buffer.seek(
                0
            )


            return image_buffer


        except Exception:

            return None


    # =====================================
    # TABELE
    # =====================================

    def _create_standard_table(
        self,
        rows,
        column_widths,
        header=False
    ):

        table = Table(
            rows,

            colWidths=
                column_widths,

            hAlign=
                "LEFT"
        )


        self._apply_standard_table_style(
            table,
            header=
                header
        )


        return table


    def _create_four_column_table(
        self,
        rows
    ):

        table = Table(
            rows,

            colWidths=[
                32 * mm,
                58 * mm,
                32 * mm,
                58 * mm,
            ],

            hAlign=
                "LEFT"
        )


        table.setStyle(
            TableStyle([
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP"
                ),

                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.45,
                    colors.HexColor(
                        "#E2E8F0"
                    )
                ),

                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.HexColor(
                        "#F1F5F9"
                    )
                ),

                (
                    "BACKGROUND",
                    (2, 0),
                    (2, -1),
                    colors.HexColor(
                        "#F1F5F9"
                    )
                ),

                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    6
                ),

                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    6
                ),

                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5
                ),

                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5
                ),
            ])
        )


        return table


    def _apply_standard_table_style(
        self,
        table,
        header=False
    ):

        body_start = (
            1
            if header
            else
            0
        )


        commands = [
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "TOP"
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.45,
                colors.HexColor(
                    "#E2E8F0"
                )
            ),

            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                5
            ),

            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                5
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                5
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                5
            ),
        ]


        if (
            body_start
            <=
            len(
                table._cellvalues
            )
            - 1
        ):

            commands.append(
                (
                    "ROWBACKGROUNDS",
                    (0, body_start),
                    (-1, -1),
                    [
                        colors.white,

                        colors.HexColor(
                            "#F8FAFC"
                        ),
                    ],
                )
            )


        if header:

            commands.extend([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor(
                        "#E2E8F0"
                    )
                ),

                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor(
                        "#0F172A"
                    )
                ),
            ])


        table.setStyle(
            TableStyle(
                commands
            )
        )


    def _header_cell(
        self,
        value
    ):

        return Paragraph(
            self._safe_text(
                value
            ),
            self.small_bold_style
        )


    def _label_cell(
        self,
        value
    ):

        return Paragraph(
            self._safe_text(
                value
            ),
            self.small_bold_style
        )


    def _value_cell(
        self,
        value
    ):

        if (
            value is None
            or
            value == ""
        ):

            value = "-"


        return Paragraph(
            self._safe_multiline_text(
                value
            ),
            self.small_style
        )


    def _metric_cell(
        self,
        label,
        value
    ):

        if (
            value is None
            or
            value == ""
        ):

            value = "-"


        return Paragraph(
            (
                "<font size='6' color='#64748B'>"
                f"{self._safe_text(label).upper()}"
                "</font>"
                "<br/>"
                "<font size='9'>"
                f"<b>{self._safe_text(value)}</b>"
                "</font>"
            ),
            self.normal_style
        )


    # =====================================
    # RĂSPUNSURI CHESTIONARE
    # =====================================

    def _normalize_answers(
        self,
        answers
    ):

        normalized = []


        if isinstance(
            answers,
            dict
        ):

            for (
                question_code,
                answer_value
            ) in answers.items():

                if (
                    answer_value is None
                    or
                    str(
                        answer_value
                    ).strip()
                    ==
                    ""
                ):

                    continue


                normalized.append(
                    (
                        str(
                            question_code
                        ),
                        answer_value,
                    )
                )


            return normalized


        if isinstance(
            answers,
            list
        ):

            for answer in answers:

                if not isinstance(
                    answer,
                    dict
                ):

                    continue


                question_code = (
                    answer.get(
                        "question_code"
                    )
                    or
                    answer.get(
                        "code"
                    )
                )


                if (
                    "answer_value"
                    in answer
                ):

                    answer_value = (
                        answer.get(
                            "answer_value"
                        )
                    )


                else:

                    answer_value = (
                        answer.get(
                            "value"
                        )
                    )


                if not question_code:

                    continue


                if (
                    answer_value is None
                    or
                    str(
                        answer_value
                    ).strip()
                    ==
                    ""
                ):

                    continue


                normalized.append(
                    (
                        str(
                            question_code
                        ),
                        answer_value,
                    )
                )


        return normalized


    # =====================================
    # NUME DISPLAY
    # =====================================

    def _service_name(
        self,
        value
    ):

        normalized = str(
            value
            or
            ""
        ).strip().lower()


        return (
            self.SERVICE_NAMES.get(
                normalized
            )
            or
            self._readable_code(
                normalized
            )
            or
            "-"
        )


    def _status_name(
        self,
        value
    ):

        normalized = str(
            value
            or
            ""
        ).strip().lower()


        return (
            self.STATUS_NAMES.get(
                normalized
            )
            or
            self._readable_code(
                normalized
            )
            or
            "-"
        )


    def _priority_name(
        self,
        value
    ):

        normalized = str(
            value
            or
            ""
        ).strip().lower()


        return (
            self.PRIORITY_NAMES.get(
                normalized
            )
            or
            self._readable_code(
                normalized
            )
            or
            "-"
        )


    def _assignment_type_name(
        self,
        value
    ):

        normalized = str(
            value
            or
            ""
        ).strip().lower()


        return (
            self.ASSIGNMENT_TYPE_NAMES.get(
                normalized
            )
            or
            self._readable_code(
                normalized
            )
            or
            "-"
        )


    def _question_label(
        self,
        question_code
    ):

        normalized = str(
            question_code
            or
            ""
        ).strip()


        return (
            self.QUESTION_LABELS.get(
                normalized
            )
            or
            self._readable_code(
                normalized
            )
        )


    def _format_answer(
        self,
        value
    ):

        if value is None:

            return "-"


        normalized = str(
            value
        ).strip()


        boolean_names = {
            "true":
                "Da",

            "false":
                "Nu",

            "yes":
                "Da",

            "no":
                "Nu",

            "1":
                "Da",

            "0":
                "Nu",
        }


        return (
            boolean_names.get(
                normalized.lower()
            )
            or
            normalized
        )


    @staticmethod
    def _readable_code(
        value
    ):

        if value is None:

            return "-"


        text = str(
            value
        ).strip()


        if not text:

            return "-"


        text = (
            text
            .replace(
                "_",
                " "
            )
            .replace(
                "-",
                " "
            )
        )


        return (
            text[:1].upper()
            +
            text[1:]
        )


    # =====================================
    # DATE
    # =====================================

    @staticmethod
    def _parse_datetime(
        value
    ):

        if value is None:

            return None


        if isinstance(
            value,
            datetime
        ):

            return value


        text = str(
            value
        ).strip()


        if not text:

            return None


        supported_formats = [
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%S.%f",
            "%a, %d %b %Y %H:%M:%S GMT",
        ]


        for date_format in supported_formats:

            try:

                return datetime.strptime(
                    text,
                    date_format
                )


            except ValueError:

                continue


        try:

            return datetime.fromisoformat(
                text.replace(
                    "Z",
                    "+00:00"
                )
            )


        except ValueError:

            return None


    def _format_datetime(
        self,
        value
    ):

        parsed_date = (
            self._parse_datetime(
                value
            )
        )


        if parsed_date is None:

            if value:

                return str(
                    value
                )


            return "-"


        return parsed_date.strftime(
            "%d.%m.%Y %H:%M:%S"
        )


    def _duration_between(
        self,
        start_value,
        end_value
    ):

        start_date = (
            self._parse_datetime(
                start_value
            )
        )


        end_date = (
            self._parse_datetime(
                end_value
            )
        )


        if (
            start_date is None
            or
            end_date is None
        ):

            return "-"


        try:

            seconds = max(
                0,

                int(
                    (
                        end_date
                        -
                        start_date
                    ).total_seconds()
                )
            )


        except TypeError:

            return "-"


        return (
            self._format_duration_seconds(
                seconds
            )
        )


    @staticmethod
    def _format_duration_seconds(
        seconds_value
    ):

        if (
            seconds_value is None
            or
            seconds_value == ""
        ):

            return "-"


        try:

            total_seconds = max(
                0,
                int(
                    seconds_value
                )
            )


        except (
            TypeError,
            ValueError
        ):

            return "-"


        days, remainder = divmod(
            total_seconds,
            86400
        )


        hours, remainder = divmod(
            remainder,
            3600
        )


        minutes, seconds = divmod(
            remainder,
            60
        )


        parts = []


        if days:

            parts.append(
                f"{days} zile"
            )


        if hours:

            parts.append(
                f"{hours} h"
            )


        if minutes:

            parts.append(
                f"{minutes} min"
            )


        if (
            seconds
            and
            not days
        ):

            parts.append(
                f"{seconds} sec"
            )


        if not parts:

            return "0 sec"


        return " ".join(
            parts
        )


    # =====================================
    # NUMERE
    # =====================================

    @staticmethod
    def _format_coordinate(
        value
    ):

        if value is None:

            return "-"


        try:

            return (
                f"{float(value):.6f}"
            )


        except (
            TypeError,
            ValueError
        ):

            return str(
                value
            )


    @staticmethod
    def _format_distance(
        value
    ):

        if value is None:

            return "-"


        try:

            return (
                f"{float(value):.3f} km"
            )


        except (
            TypeError,
            ValueError
        ):

            return str(
                value
            )


    # =====================================
    # TEXT
    # =====================================

    @staticmethod
    def _safe_text(
        value
    ):

        if value is None:

            return "-"


        return escape(
            str(
                value
            )
        )


    @staticmethod
    def _safe_multiline_text(
        value
    ):

        if value is None:

            return "-"


        return (
            escape(
                str(
                    value
                )
            )
            .replace(
                "\r\n",
                "\n"
            )
            .replace(
                "\r",
                "\n"
            )
            .replace(
                "\n",
                "<br/>"
            )
        )


    # =====================================
    # DOCUMENT
    # =====================================

    @staticmethod
    def _get_document_title(
        incident
    ):

        incident_code = (
            incident.get(
                "incident_code"
            )
            or
            "incident"
        )


        return (
            "Raport final - "
            f"{incident_code}"
        )


    # =====================================
    # FOOTER
    # =====================================

    def _draw_page_footer(
        self,
        canvas,
        document
    ):

        canvas.saveState()


        page_number = (
            canvas.getPageNumber()
        )


        canvas.setStrokeColor(
            colors.HexColor(
                "#E2E8F0"
            )
        )


        canvas.setLineWidth(
            0.5
        )


        canvas.line(
            15 * mm,
            12 * mm,
            self.page_width
            -
            15 * mm,
            12 * mm
        )


        canvas.setFont(
            self.font_regular,
            7
        )


        canvas.setFillColor(
            colors.HexColor(
                "#64748B"
            )
        )


        canvas.drawString(
            15 * mm,
            7.5 * mm,
            (
                "GPS Tracking System · "
                "Raport operațional final"
            )
        )


        canvas.drawRightString(
            self.page_width
            -
            15 * mm,
            7.5 * mm,
            f"Pagina {page_number}"
        )


        canvas.restoreState()