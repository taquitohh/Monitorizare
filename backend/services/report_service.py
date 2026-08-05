from datetime import datetime
from html import escape
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import (
    ParagraphStyle,
    getSampleStyleSheet,
)
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from staticmap import CircleMarker, Line, StaticMap


class IncidentReportService:

    def __init__(self):

        self.page_width, self.page_height = A4

        self.styles = getSampleStyleSheet()

        self._configure_styles()

    # =====================================
    # PUBLIC METHOD
    # =====================================

    def generate_report(
        self,
        incident,
        route_information=None
    ):
        """
        Generează raportul PDF pentru un incident.

        Parametri:
            incident:
                Dicționar cu datele incidentului
                preluate din baza de date.

            route_information:
                Dicționar opțional cu informații
                despre traseu, de exemplu:
                {
                    "distance_km": 4.25,
                    "start_latitude": 44.42,
                    "start_longitude": 26.10
                }

        Returnează:
            bytes reprezentând documentul PDF.
        """

        if not incident:

            raise ValueError(
                "Incident data is required."
            )

        buffer = BytesIO()

        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=18 * mm,
            leftMargin=18 * mm,
            topMargin=18 * mm,
            bottomMargin=18 * mm,
            title=self._get_document_title(
                incident
            ),
            author="GPS Tracking System",
            subject="Raport de activitate al incidentului"
        )

        story = []

        story.extend(
            self._build_header(
                incident
            )
        )

        story.extend(
            self._build_summary_section(
                incident
            )
        )

        story.extend(
            self._build_description_section(
                incident
            )
        )

        story.extend(
            self._build_location_section(
                incident,
                route_information
            )
        )

        story.extend(
            self._build_timeline_section(
                incident
            )
        )

        story.extend(
            self._build_duration_section(
                incident
            )
        )

        story.extend(
            self._build_route_section(
                route_information
            )
        )

        story.extend(
            self._build_route_map_section(
                route_information
            )
        )

        story.extend(
            self._build_conclusion_section(
                incident
            )
        )

        document.build(
            story,
            onFirstPage=self._draw_page_footer,
            onLaterPages=self._draw_page_footer
        )

        pdf_bytes = buffer.getvalue()

        buffer.close()

        return pdf_bytes

    # =====================================
    # STYLE CONFIGURATION
    # =====================================

    def _configure_styles(self):

        self.title_style = ParagraphStyle(
            name="IncidentReportTitle",
            parent=self.styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            alignment=TA_CENTER,
            textColor=colors.HexColor(
                "#17202A"
            ),
            spaceAfter=6 * mm
        )

        self.subtitle_style = ParagraphStyle(
            name="IncidentReportSubtitle",
            parent=self.styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            alignment=TA_CENTER,
            textColor=colors.HexColor(
                "#5D6D7E"
            ),
            spaceAfter=7 * mm
        )

        self.section_title_style = ParagraphStyle(
            name="IncidentSectionTitle",
            parent=self.styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            alignment=TA_LEFT,
            textColor=colors.HexColor(
                "#2471A3"
            ),
            spaceBefore=4 * mm,
            spaceAfter=3 * mm
        )

        self.normal_style = ParagraphStyle(
            name="IncidentNormal",
            parent=self.styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor(
                "#263442"
            )
        )

        self.small_style = ParagraphStyle(
            name="IncidentSmall",
            parent=self.styles["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor(
                "#68737D"
            )
        )

        self.conclusion_style = ParagraphStyle(
            name="IncidentConclusion",
            parent=self.styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=15,
            leftIndent=5 * mm,
            rightIndent=5 * mm,
            borderWidth=1,
            borderColor=colors.HexColor(
                "#D5DBDB"
            ),
            borderPadding=8,
            backColor=colors.HexColor(
                "#F8F9F9"
            ),
            textColor=colors.HexColor(
                "#263442"
            )
        )

    # =====================================
    # HEADER
    # =====================================

    def _build_header(
        self,
        incident
    ):

        incident_code = self._safe_text(
            incident.get(
                "incident_code",
                "Unknown incident"
            )
        )

        generated_at = datetime.now()

        return [
            Paragraph(
                "GPS Tracking System",
                self.title_style
            ),

            Paragraph(
                "Raport de activitate al incidentului",
                self.styles["Heading2"]
            ),

            Spacer(
                1,
                2 * mm
            ),

            Paragraph(
                (
                    f"<b>Incident:</b> "
                    f"{incident_code}"
                    "<br/>"
                    f"<b>Raport generat:</b> "
                    f"{self._format_datetime(generated_at)}"
                ),
                self.subtitle_style
            )
        ]

    # =====================================
    # SUMMARY
    # =====================================

    def _build_summary_section(
        self,
        incident
    ):

        rows = [
            [
                self._label_cell(
                    "Cod incident"
                ),
                self._value_cell(
                    incident.get(
                        "incident_code"
                    )
                )
            ],
            [
                self._label_cell(
                    "Titlu"
                ),
                self._value_cell(
                    incident.get(
                        "title"
                    )
                )
            ],
            [
                self._label_cell(
                    "Tip incident"
                ),
                self._value_cell(
                    self._format_readable_value(
                        incident.get(
                            "incident_type"
                        )
                    )
                )
            ],
            [
                self._label_cell(
                    "Vehicul necesar"
                ),
                self._value_cell(
                    self._format_readable_value(
                        incident.get(
                            "required_vehicle_type"
                        )
                    )
                )
            ],
            [
                self._label_cell(
                    "Prioritate"
                ),
                self._value_cell(
                    self._format_readable_value(
                        incident.get(
                            "priority"
                        )
                    )
                )
            ],
            [
                self._label_cell(
                    "Stare finală"
                ),
                self._value_cell(
                    self._format_readable_value(
                        incident.get(
                            "status"
                        )
                    )
                )
            ],
            [
                self._label_cell(
                    "Vehicul asignat"
                ),
                self._value_cell(
                    incident.get(
                        "assigned_vehicle_code"
                    )
                    or
                    "Neatribuit"
                )
            ]
        ]

        return [
            Paragraph(
                "1. Rezumat incident",
                self.section_title_style
            ),

            self._create_information_table(
                rows
            ),

            Spacer(
                1,
                4 * mm
            )
        ]

    # =====================================
    # DESCRIPTION
    # =====================================

    def _build_description_section(
        self,
        incident
    ):

        details = (
            incident.get(
                "details"
            )
            or
            "Nu au fost furnizate detalii suplimentare."
        )

        return [
            Paragraph(
                "2. Descriere incident",
                self.section_title_style
            ),

            Paragraph(
                self._safe_text(
                    details
                ).replace(
                    "\n",
                    "<br/>"
                ),
                self.normal_style
            ),

            Spacer(
                1,
                4 * mm
            )
        ]

    # =====================================
    # LOCATION
    # =====================================

    def _build_location_section(
        self,
        incident,
        route_information
    ):

        latitude = self._format_coordinate(
            incident.get(
                "latitude"
            )
        )

        longitude = self._format_coordinate(
            incident.get(
                "longitude"
            )
        )

        rows = [
            [
                self._label_cell(
                    "Latitudine incident"
                ),
                self._value_cell(
                    latitude
                )
            ],
            [
                self._label_cell(
                    "Longitudine incident"
                ),
                self._value_cell(
                    longitude
                )
            ]
        ]

        if route_information:

            start_latitude = (
                route_information.get(
                    "start_latitude"
                )
            )

            start_longitude = (
                route_information.get(
                    "start_longitude"
                )
            )

            if start_latitude is not None:

                rows.append([
                    self._label_cell(
                        "Latitudine pornire vehicul"
                    ),
                    self._value_cell(
                        self._format_coordinate(
                            start_latitude
                        )
                    )
                ])

            if start_longitude is not None:

                rows.append([
                    self._label_cell(
                        "Longitudine pornire vehicul"
                    ),
                    self._value_cell(
                        self._format_coordinate(
                            start_longitude
                        )
                    )
                ])

        return [
            Paragraph(
                "3. Informații despre locație",
                self.section_title_style
            ),

            self._create_information_table(
                rows
            ),

            Spacer(
                1,
                4 * mm
            )
        ]

    # =====================================
    # TIMELINE
    # =====================================

    def _build_timeline_section(
        self,
        incident
    ):

        rows = [
            [
                self._label_cell(
                    "Creat"
                ),
                self._value_cell(
                    self._format_datetime(
                        incident.get(
                            "created_at"
                        )
                    )
                )
            ],
            [
                self._label_cell(
                    "Ultima actualizare"
                ),
                self._value_cell(
                    self._format_datetime(
                        incident.get(
                            "updated_at"
                        )
                    )
                )
            ],
            [
                self._label_cell(
                    "Vehicul dispecerat"
                ),
                self._value_cell(
                    self._format_datetime(
                        incident.get(
                            "dispatched_at"
                        )
                    )
                )
            ],
            [
                self._label_cell(
                    "Incident rezolvat"
                ),
                self._value_cell(
                    self._format_datetime(
                        incident.get(
                            "resolved_at"
                        )
                    )
                )
            ]
        ]

        return [
            Paragraph(
                "4. Cronologia activității",
                self.section_title_style
            ),

            self._create_information_table(
                rows
            ),

            Spacer(
                1,
                4 * mm
            )
        ]

    # =====================================
    # DURATIONS
    # =====================================

    def _build_duration_section(
        self,
        incident
    ):

        created_at = self._parse_datetime(
            incident.get(
                "created_at"
            )
        )

        dispatched_at = self._parse_datetime(
            incident.get(
                "dispatched_at"
            )
        )

        resolved_at = self._parse_datetime(
            incident.get(
                "resolved_at"
            )
        )

        dispatch_duration = (
            self._calculate_duration(
                created_at,
                dispatched_at
            )
        )

        response_duration = (
            self._calculate_duration(
                dispatched_at,
                resolved_at
            )
        )

        total_duration = (
            self._calculate_duration(
                created_at,
                resolved_at
            )
        )

        rows = [
            [
                self._label_cell(
                    "Time until dispatch"
                ),
                self._value_cell(
                    dispatch_duration
                )
            ],
            [
                self._label_cell(
                    "Vehicle response time"
                ),
                self._value_cell(
                    response_duration
                )
            ],
            [
                self._label_cell(
                    "Total incident duration"
                ),
                self._value_cell(
                    total_duration
                )
            ]
        ]

        return [
            Paragraph(
                "5. Duration statistics",
                self.section_title_style
            ),

            self._create_information_table(
                rows
            ),

            Spacer(
                1,
                4 * mm
            )
        ]

    # =====================================
    # ROUTE INFORMATION
    # =====================================

    def _build_route_section(
        self,
        route_information
    ):

        rows = []

        if route_information:

            distance_km = (
                route_information.get(
                    "distance_km"
                )
            )

            if distance_km is not None:

                try:

                    distance_text = (
                        f"{float(distance_km):.3f} km"
                    )

                except (
                    TypeError,
                    ValueError
                ):

                    distance_text = str(
                        distance_km
                    )

                rows.append([
                    self._label_cell(
                        "Calculated route distance"
                    ),
                    self._value_cell(
                        distance_text
                    )
                ])

            coordinate_count = (
                route_information.get(
                    "coordinate_count"
                )
            )

            if coordinate_count is not None:

                rows.append([
                    self._label_cell(
                        "Route coordinate count"
                    ),
                    self._value_cell(
                        coordinate_count
                    )
                ])

            start_latitude = (
                route_information.get(
                    "start_latitude"
                )
            )

            start_longitude = (
                route_information.get(
                    "start_longitude"
                )
            )

            end_latitude = (
                route_information.get(
                    "end_latitude"
                )
            )

            end_longitude = (
                route_information.get(
                    "end_longitude"
                )
            )

            if (
                start_latitude is not None
                and
                start_longitude is not None
            ):

                rows.append([
                    self._label_cell(
                        "Start rută"
                    ),
                    self._value_cell(
                        (
                            f"{self._format_coordinate(start_latitude)}, "
                            f"{self._format_coordinate(start_longitude)}"
                        )
                    )
                ])

            if (
                end_latitude is not None
                and
                end_longitude is not None
            ):

                rows.append([
                    self._label_cell(
                        "Sfârșit rută"
                    ),
                    self._value_cell(
                        (
                            f"{self._format_coordinate(end_latitude)}, "
                            f"{self._format_coordinate(end_longitude)}"
                        )
                    )
                ])

        if not rows:

            rows.append([
                self._label_cell(
                    "Informații despre rută"
                ),
                self._value_cell(
                    "Datele detaliate despre rută nu sunt disponibile "
                    "pentru acest raport."
                )
            ])

        return [
            Paragraph(
                "6. Informații despre rută",
                self.section_title_style
            ),

            self._create_information_table(
                rows
            ),

            Spacer(
                1,
                4 * mm
            )
        ]

    # =====================================
    # ROUTE MAP
    # =====================================

    def _build_route_map_section(
        self,
        route_information
    ):

        elements = [
            Paragraph(
                "7. Ruta parcursă",
                self.section_title_style
            )
        ]

        route_image = (
            self._generate_route_map_image(
                route_information
            )
        )

        if route_image is None:

            elements.append(
                Paragraph(
                    (
                        "The OpenStreetMap route image could not be "
                        "generated. At least two valid GPS points "
                        "and network access to the map tile server "
                        "are required."
                    ),
                    self.small_style
                )
            )

            elements.append(
                Spacer(
                    1,
                    4 * mm
                )
            )

            return elements

        image = Image(
            route_image,
            width=168 * mm,
            height=105 * mm
        )

        image.hAlign = "CENTER"

        elements.append(
            image
        )

        elements.append(
            Spacer(
                1,
                2 * mm
            )
        )

        elements.append(
            Paragraph(
                (
                    "A marks the vehicle position at dispatch. "
                    "B marks the incident destination. "
                    "The highlighted line represents the GPS path "
                    "recorded while the vehicle travelled to the incident. "
                    "Map data © OpenStreetMap contributors."
                ),
                self.small_style
            )
        )

        elements.append(
            Spacer(
                1,
                5 * mm
            )
        )

        return elements

    def _generate_route_map_image(
        self,
        route_information
    ):

        if not route_information:

            return None

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

        if len(route_points) < 2:

            return None

        try:

            static_map = StaticMap(
                1200,
                750,
                padding_x=90,
                padding_y=90,
                url_template=(
                    "https://tile.openstreetmap.org/"
                    "{z}/{x}/{y}.png"
                )
            )

            route_outline = Line(
                route_points,
                "white",
                10
            )

            route_line = Line(
                route_points,
                "#7d3c98",
                6
            )

            static_map.add_line(
                route_outline
            )

            static_map.add_line(
                route_line
            )

            start_point = route_points[0]

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
                incident_latitude is not None
                and
                incident_longitude is not None
            ):

                try:

                    destination_point = (
                        float(
                            incident_longitude
                        ),
                        float(
                            incident_latitude
                        )
                    )

                except (
                    TypeError,
                    ValueError
                ):

                    destination_point = (
                        route_points[-1]
                    )

            else:

                destination_point = (
                    route_points[-1]
                )

            static_map.add_marker(
                CircleMarker(
                    start_point,
                    "white",
                    22
                )
            )

            static_map.add_marker(
                CircleMarker(
                    start_point,
                    "#2471a3",
                    15
                )
            )

            static_map.add_marker(
                CircleMarker(
                    destination_point,
                    "white",
                    22
                )
            )

            static_map.add_marker(
                CircleMarker(
                    destination_point,
                    "#8e44ad",
                    15
                )
            )

            rendered_map = static_map.render()

            image_buffer = BytesIO()

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
    # CONCLUSION
    # =====================================

    def _build_conclusion_section(
        self,
        incident
    ):

        status = self._format_readable_value(
            incident.get(
                "status"
            )
        )

        incident_code = self._safe_text(
            incident.get(
                "incident_code",
                "-"
            )
        )

        vehicle_code = self._safe_text(
            incident.get(
                "assigned_vehicle_code",
                "Neatribuit"
            )
        )

        conclusion = (
            f"Incident <b>{incident_code}</b> "
            f"s-a încheiat cu starea <b>{status}</b>. "
            f"Vehiculul de intervenție asignat a fost "
            f"<b>{vehicle_code}</b>. "
            "Marcajele de timp și detaliile operaționale "
            "incluse în acest document au fost obținute "
            "din baza de date a sistemului de monitorizare GPS."
        )

        return [
            Paragraph(
                "8. Concluzie",
                self.section_title_style
            ),

            Paragraph(
                conclusion,
                self.conclusion_style
            )
        ]

    # =====================================
    # TABLE HELPERS
    # =====================================

    def _create_information_table(
        self,
        rows
    ):

        table = Table(
            rows,
            colWidths=[
                55 * mm,
                113 * mm
            ],
            hAlign="LEFT"
        )

        table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.HexColor(
                        "#EAF2F8"
                    )
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (0, -1),
                    colors.HexColor(
                        "#1B4F72"
                    )
                ),
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
                        "#D5DBDB"
                    )
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
                    6
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    6
                ),
                (
                    "ROWBACKGROUNDS",
                    (1, 0),
                    (1, -1),
                    [
                        colors.white,
                        colors.HexColor(
                            "#FAFAFA"
                        )
                    ]
                )
            ])
        )

        return table

    def _label_cell(
        self,
        value
    ):

        return Paragraph(
            f"<b>{self._safe_text(value)}</b>",
            self.normal_style
        )

    def _value_cell(
        self,
        value
    ):

        return Paragraph(
            self._safe_text(
                value
                if value not in {
                    None,
                    ""
                }
                else
                "-"
            ),
            self.normal_style
        )

    # =====================================
    # DATE AND TIME HELPERS
    # =====================================

    def _parse_datetime(
        self,
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
            "%a, %d %b %Y %H:%M:%S GMT"
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

    def _calculate_duration(
        self,
        start_value,
        end_value
    ):

        if (
            start_value is None
            or
            end_value is None
        ):

            return "-"

        difference = (
            end_value
            -
            start_value
        )

        total_seconds = max(
            0,
            int(
                difference.total_seconds()
            )
        )

        days, remaining_seconds = divmod(
            total_seconds,
            86400
        )

        hours, remaining_seconds = divmod(
            remaining_seconds,
            3600
        )

        minutes, seconds = divmod(
            remaining_seconds,
            60
        )

        parts = []

        if days:

            parts.append(
                f"{days} day"
                +
                (
                    "s"
                    if days != 1
                    else
                    ""
                )
            )

        if hours:

            parts.append(
                f"{hours} hour"
                +
                (
                    "s"
                    if hours != 1
                    else
                    ""
                )
            )

        if minutes:

            parts.append(
                f"{minutes} minute"
                +
                (
                    "s"
                    if minutes != 1
                    else
                    ""
                )
            )

        if (
            seconds
            or
            not parts
        ):

            parts.append(
                f"{seconds} second"
                +
                (
                    "s"
                    if seconds != 1
                    else
                    ""
                )
            )

        return ", ".join(
            parts
        )

    # =====================================
    # TEXT HELPERS
    # =====================================

    def _safe_text(
        self,
        value
    ):

        if value is None:

            return "-"

        return escape(
            str(
                value
            )
        )

    def _format_readable_value(
        self,
        value
    ):

        if value is None:

            return "-"

        return (
            str(
                value
            )
            .replace(
                "_",
                " "
            )
            .replace(
                "-",
                " "
            )
            .title()
        )

    def _format_coordinate(
        self,
        value
    ):

        if value is None:

            return "-"

        try:

            return f"{float(value):.7f}"

        except (
            TypeError,
            ValueError
        ):

            return str(
                value
            )

    def _get_document_title(
        self,
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
            f"Incident Report - "
            f"{incident_code}"
        )

    # =====================================
    # PAGE FOOTER
    # =====================================

    def _draw_page_footer(
        self,
        canvas,
        document
    ):

        canvas.saveState()

        canvas.setStrokeColor(
            colors.HexColor(
                "#D5DBDB"
            )
        )

        canvas.setLineWidth(
            0.5
        )

        canvas.line(
            18 * mm,
            13 * mm,
            self.page_width - 18 * mm,
            13 * mm
        )

        canvas.setFont(
            "Helvetica",
            8
        )

        canvas.setFillColor(
            colors.HexColor(
                "#68737D"
            )
        )

        canvas.drawString(
            18 * mm,
            8 * mm,
            "GPS Tracking System"
        )

        canvas.drawRightString(
            self.page_width - 18 * mm,
            8 * mm,
            f"Page {document.page}"
        )

        canvas.restoreState()