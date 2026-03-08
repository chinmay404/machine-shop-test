"""Styled trial report PDF generator aligned to the provided reference layout."""

import io
from decimal import Decimal, InvalidOperation

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


NAVY = colors.HexColor("#0E1B3A")
ORANGE = colors.HexColor("#F36A1D")
GREEN = colors.HexColor("#20B15A")
LIGHT_BG = colors.HexColor("#F7F8FB")
SOFT_BORDER = colors.HexColor("#D9DEE7")
SECTION_BG = colors.HexColor("#F5F1EE")
SOFT_GREEN = colors.HexColor("#E8F8EE")
SOFT_ORANGE = colors.HexColor("#FFF2EA")
TEXT_DARK = colors.HexColor("#1F2937")
TEXT_MUTED = colors.HexColor("#667085")


def _text(value, default="-"):
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


def _as_decimal(value, default=Decimal("0")):
    if value in (None, ""):
        return default
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return default


def _fmt_number(value, digits=2, default="-"):
    if value in (None, ""):
        return default
    try:
        return f"{_as_decimal(value):.{digits}f}"
    except Exception:
        return _text(value, default)


def _fmt_currency(value, default="-"):
    if value in (None, ""):
        return default
    try:
        return f"Rs. {_as_decimal(value):,.2f}"
    except Exception:
        return _text(value, default)


def _fmt_percent(value, digits=1, default="-"):
    if value in (None, ""):
        return default
    try:
        return f"{_as_decimal(value):.{digits}f}%"
    except Exception:
        return _text(value, default)


def _try_related(instance, attr_name):
    try:
        return getattr(instance, attr_name)
    except Exception:
        return None


def _first_cutting_tool(trial):
    manager = getattr(trial, "cutting_tools", None)
    if manager is None:
        return None
    try:
        return manager.order_by("id").first()
    except Exception:
        return None


def _report_id(trial):
    date_seed = getattr(trial, "trial_date", None) or getattr(trial, "created_at", None)
    if hasattr(date_seed, "strftime"):
        date_token = date_seed.strftime("%Y%m%d")
    else:
        date_token = "NA"
    return f"TR-{date_token}-{getattr(trial, 'id', 'NA')}"


def _result_label(trial_result):
    value = _text(trial_result, default="").upper()
    if value == "PASS":
        return "SUCCEEDED"
    if value == "FAIL":
        return "FAILED"
    if value == "CONDITIONAL":
        return "CONDITIONAL"
    return "-"


def _section_title(title, width, style):
    bar = Table([[Paragraph(title, style)]], colWidths=[width])
    bar.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return bar


def generate_trial_pdf(trial):
    """Generate a styled trial report PDF and return it as a BytesIO buffer."""
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=A4,
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=10 * mm,
        bottomMargin=10 * mm,
        title=f"Trial Report {_report_id(trial)}",
    )
    page_width = doc.width

    styles = getSampleStyleSheet()
    brand_title = ParagraphStyle(
        "BrandTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=16,
        textColor=NAVY,
    )
    brand_subtitle = ParagraphStyle(
        "BrandSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        textColor=ORANGE,
    )
    tiny_label = ParagraphStyle(
        "TinyLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=6.2,
        leading=8,
        textColor=ORANGE,
    )
    value_text = ParagraphStyle(
        "ValueText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=TEXT_DARK,
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=13,
        textColor=TEXT_DARK,
    )
    cell_header = ParagraphStyle(
        "CellHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=colors.white,
        alignment=TA_CENTER,
    )
    cell_text = ParagraphStyle(
        "CellText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.4,
        leading=9,
        textColor=TEXT_DARK,
    )
    cell_text_center = ParagraphStyle(
        "CellTextCenter",
        parent=cell_text,
        alignment=TA_CENTER,
    )
    cell_text_bold = ParagraphStyle(
        "CellTextBold",
        parent=cell_text,
        fontName="Helvetica-Bold",
    )
    banner_left = ParagraphStyle(
        "BannerLeft",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        textColor=colors.white,
        alignment=TA_LEFT,
    )
    banner_small = ParagraphStyle(
        "BannerSmall",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#C8D0E5"),
        alignment=TA_LEFT,
    )
    banner_value = ParagraphStyle(
        "BannerValue",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=18,
        textColor=ORANGE,
        alignment=TA_RIGHT,
    )
    banner_value_label = ParagraphStyle(
        "BannerValueLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=6.5,
        leading=8,
        textColor=colors.HexColor("#C8D0E5"),
        alignment=TA_RIGHT,
    )
    note_center = ParagraphStyle(
        "NoteCenter",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=6.2,
        leading=8,
        textColor=colors.HexColor("#A3AEC2"),
        alignment=TA_CENTER,
    )
    signature_title = ParagraphStyle(
        "SignatureTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.2,
        leading=9,
        textColor=TEXT_DARK,
        alignment=TA_CENTER,
    )
    signature_sub = ParagraphStyle(
        "SignatureSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=6.4,
        leading=8,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER,
    )
    right_meta = ParagraphStyle(
        "RightMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        leading=9,
        textColor=TEXT_MUTED,
        alignment=TA_RIGHT,
    )
    right_meta_bold = ParagraphStyle(
        "RightMetaBold",
        parent=right_meta,
        fontName="Helvetica-Bold",
        textColor=TEXT_DARK,
    )

    insert_detail = _try_related(trial, "insert_detail")
    first_cutting_tool = _first_cutting_tool(trial)

    existing_cpc = _as_decimal(getattr(trial, "existing_cost_per_component", None))
    new_cpc = _as_decimal(getattr(trial, "new_cost_per_component", None))
    raw_savings = getattr(trial, "savings_per_component", None)
    if raw_savings in (None, ""):
        savings_per_component = existing_cpc - new_cpc
    else:
        savings_per_component = _as_decimal(raw_savings)

    monthly_savings = _as_decimal(getattr(trial, "monthly_savings", None))
    target_qty = _as_decimal(getattr(trial, "target_quantity", None))
    if monthly_savings == Decimal("0") and target_qty > 0:
        monthly_savings = savings_per_component * target_qty

    cpc_reduction = Decimal("0")
    if existing_cpc > 0:
        cpc_reduction = (savings_per_component / existing_cpc) * Decimal("100")

    trial_result_label = _result_label(getattr(trial, "trial_result", ""))

    customer_name = _text(getattr(trial, "customer", None))
    customer_contact = _text(getattr(trial, "approved_by", None))
    hariomtech_contact = _text(getattr(trial, "conducted_by", None))
    insert_name = _text(getattr(trial, "new_insert_code", None), default=_text(getattr(trial, "existing_insert_code", None)))
    cutter_body = _text(
        getattr(first_cutting_tool, "tool_code", None),
        default=_text(getattr(trial, "tool_name", None))
    )
    report_date = _text(getattr(trial, "trial_date", None))
    report_id = _report_id(trial)

    machine_spindle = _text(getattr(trial, "spindle_speed", None), default="-")
    if machine_spindle != "-":
        machine_spindle = f"{machine_spindle} RPM Max"

    target_qty_label = _text(getattr(trial, "target_quantity", None), default="-")
    if target_qty_label != "-":
        try:
            target_qty_label = f"{int(_as_decimal(target_qty_label)):,} Units"
        except Exception:
            target_qty_label = f"{target_qty_label} Units"

    elements = []

    icon_style = ParagraphStyle(
        "IconStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.white,
    )
    icon_cell = Table([[Paragraph("T", icon_style)]], colWidths=[10 * mm], rowHeights=[10 * mm])
    icon_cell.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ORANGE),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))

    brand_text_block = Table(
        [[Paragraph("HARIOMTECH", brand_title)], [Paragraph("CNC TOOL TRIAL REPORT", brand_subtitle)]],
        colWidths=[96 * mm],
    )
    brand_text_block.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    left_header = Table([[icon_cell, brand_text_block]], colWidths=[12 * mm, 100 * mm])
    left_header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    badge_text = ParagraphStyle(
        "BadgeText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        textColor=colors.white,
        alignment=TA_CENTER,
    )
    badge = Table([[Paragraph("Download PDF", badge_text)]], colWidths=[44 * mm], rowHeights=[7 * mm])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ORANGE),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LINEABOVE", (0, 0), (-1, -1), 0, colors.white),
    ]))

    right_header = Table(
        [
            [badge],
            [Paragraph(f"Report ID: <b>{report_id}</b>", right_meta_bold)],
        ],
        colWidths=[74 * mm],
    )
    right_header.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))

    header_table = Table([[left_header, right_header]], colWidths=[112 * mm, 74 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    elements.append(header_table)
    elements.append(Spacer(1, 2 * mm))

    divider = Table([[""]], colWidths=[page_width], rowHeights=[0.8 * mm])
    divider.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), ORANGE)]))
    elements.append(divider)
    elements.append(Spacer(1, 3 * mm))

    info_panel = [
        [Paragraph("CUSTOMER NAME", tiny_label), Paragraph("DATE", tiny_label)],
        [Paragraph(customer_name, value_text), Paragraph(report_date, value_text)],
        [Paragraph("CUSTOMER CONTACT", tiny_label), Paragraph("INSERT NAME", tiny_label)],
        [Paragraph(customer_contact, value_text), Paragraph(insert_name, value_text)],
        [Paragraph("HARIOMTECH CONTACT", tiny_label), Paragraph("CUTTER BODY USED", tiny_label)],
        [Paragraph(hariomtech_contact, value_text), Paragraph(cutter_body, value_text)],
    ]
    info_table = Table(info_panel, colWidths=[93 * mm, 93 * mm])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.6, SOFT_BORDER),
        ("LINEBELOW", (0, 1), (-1, 1), 0.25, SOFT_BORDER),
        ("LINEBELOW", (0, 3), (-1, 3), 0.25, SOFT_BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 4 * mm))

    elements.append(_section_title("<font color='#F36A1D'>##</font> <b>Machine &amp; Operation Details</b>", page_width, section_heading))
    elements.append(Spacer(1, 1.2 * mm))

    job_rows = [
        [Paragraph("PARAMETER", cell_text_bold), Paragraph("VALUE", cell_text_bold)],
        [Paragraph("Part Name", cell_text), Paragraph(_text(getattr(trial, "part_name", None)), cell_text)],
        [Paragraph("Material", cell_text), Paragraph(_text(getattr(trial, "part_material", None)), cell_text)],
        [Paragraph("Machine", cell_text), Paragraph(_text(getattr(trial, "machine_name", None)), cell_text)],
        [Paragraph("Machine Spindle", cell_text), Paragraph(machine_spindle, cell_text)],
        [Paragraph("Operation", cell_text), Paragraph(_text(getattr(trial, "operation", None)), cell_text)],
        [Paragraph("No. of component/month", cell_text), Paragraph(target_qty_label, cell_text)],
        [Paragraph("Machine hour rate", cell_text), Paragraph(_fmt_currency(None), cell_text)],
    ]
    job_table = Table(job_rows, colWidths=[62 * mm, 124 * mm])
    job_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2F8")),
        ("BOX", (0, 0), (-1, -1), 0.6, SOFT_BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, SOFT_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    elements.append(job_table)
    elements.append(Spacer(1, 4 * mm))

    elements.append(_section_title("<font color='#F36A1D'>##</font> <b>Performance Comparison: Existing vs NEW</b>", page_width, section_heading))
    elements.append(Spacer(1, 1.2 * mm))

    new_grade = _text(getattr(insert_detail, "grade", None))
    existing_grade = _text(getattr(trial, "existing_grade", None))
    if existing_grade == "-":
        existing_grade = "-"

    perf_rows = [
        [Paragraph("SECTION / PARAMETERS", cell_header), Paragraph("EXISTING TOOL", cell_header), Paragraph("HARIOMTECH (NEW)", cell_header)],
        [Paragraph("I. CUTTING TOOL DETAILS", cell_text_bold), "", ""],
        [Paragraph("Manufacturer", cell_text), Paragraph(_text(getattr(trial, "existing_manufacturer", None)), cell_text_center), Paragraph(_text(getattr(trial, "new_manufacturer", None)), cell_text_center)],
        [Paragraph("Insert Code", cell_text), Paragraph(_text(getattr(trial, "existing_insert_code", None)), cell_text_center), Paragraph(_text(getattr(trial, "new_insert_code", None)), cell_text_center)],
        [Paragraph("Grade", cell_text), Paragraph(existing_grade, cell_text_center), Paragraph(new_grade, cell_text_center)],
        [Paragraph("No. of Cutting Edges", cell_text), Paragraph(_text(getattr(trial, "existing_cutting_edges", None)), cell_text_center), Paragraph(_text(getattr(trial, "new_cutting_edges", None)), cell_text_center)],
        [Paragraph("II. CUTTING DETAILS", cell_text_bold), "", ""],
        [Paragraph("Cutting Speed Vc (m/min)", cell_text), Paragraph(_fmt_number(getattr(trial, "existing_cutting_speed", None), 2), cell_text_center), Paragraph(_fmt_number(getattr(trial, "new_cutting_speed", None), 2), cell_text_center)],
        [Paragraph("Feed Rate f (mm/rev)", cell_text), Paragraph(_fmt_number(getattr(trial, "existing_feed", None), 2), cell_text_center), Paragraph(_fmt_number(getattr(trial, "new_feed", None), 2), cell_text_center)],
        [Paragraph("Depth of Cut ap (mm)", cell_text), Paragraph(_fmt_number(getattr(trial, "depth_of_cut", None), 2), cell_text_center), Paragraph(_fmt_number(getattr(trial, "depth_of_cut", None), 2), cell_text_center)],
        [Paragraph("Coolant", cell_text), Paragraph(_text(getattr(trial, "existing_coolant", None)), cell_text_center), Paragraph(f'<b>{_text(getattr(trial, "new_coolant", None))}</b>', cell_text_center)],
        [Paragraph("III. RESULTS &amp; PERFORMANCE", cell_text_bold), "", ""],
        [Paragraph("Tool Life (No. of Components)", cell_text), Paragraph(_text(getattr(trial, "existing_tool_life", None)), cell_text_center), Paragraph(f'<b>{_text(getattr(trial, "new_tool_life", None))}</b>', cell_text_center)],
        [Paragraph("Surface Finish (Ra)", cell_text), Paragraph(_fmt_number(getattr(trial, "surface_finish_ra", None), 1, "-") + " um" if getattr(trial, "surface_finish_ra", None) else "-", cell_text_center), Paragraph(_fmt_number(getattr(trial, "surface_finish_ra", None), 1, "-") + " um" if getattr(trial, "surface_finish_ra", None) else "-", cell_text_center)],
        [Paragraph("Chip Control", cell_text), Paragraph("-", cell_text_center), Paragraph("-", cell_text_center)],
        [Paragraph("Test Result", cell_text), Paragraph("-", cell_text_center), Paragraph(trial_result_label, cell_text_bold)],
    ]

    perf_table = Table(perf_rows, colWidths=[74 * mm, 56 * mm, 56 * mm])
    perf_style = TableStyle([
        ("BACKGROUND", (0, 0), (1, 0), NAVY),
        ("BACKGROUND", (2, 0), (2, 0), ORANGE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.6, SOFT_BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, SOFT_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ])

    for row_index in (1, 6, 11):
        perf_style.add("SPAN", (0, row_index), (2, row_index))
        perf_style.add("BACKGROUND", (0, row_index), (2, row_index), SECTION_BG)
        perf_style.add("TEXTCOLOR", (0, row_index), (2, row_index), ORANGE)
        perf_style.add("FONTNAME", (0, row_index), (2, row_index), "Helvetica-Bold")

    if trial_result_label == "SUCCEEDED":
        perf_style.add("BACKGROUND", (2, len(perf_rows) - 1), (2, len(perf_rows) - 1), GREEN)
        perf_style.add("TEXTCOLOR", (2, len(perf_rows) - 1), (2, len(perf_rows) - 1), colors.white)
        perf_style.add("ALIGN", (2, len(perf_rows) - 1), (2, len(perf_rows) - 1), "CENTER")
    elif trial_result_label == "FAILED":
        perf_style.add("BACKGROUND", (2, len(perf_rows) - 1), (2, len(perf_rows) - 1), colors.HexColor("#E15241"))
        perf_style.add("TEXTCOLOR", (2, len(perf_rows) - 1), (2, len(perf_rows) - 1), colors.white)

    # Highlight new tool life value in blue (row 12 = Tool Life row)
    perf_style.add("TEXTCOLOR", (2, 12), (2, 12), colors.HexColor("#1D4ED8"))

    perf_table.setStyle(perf_style)
    elements.append(perf_table)
    elements.append(Spacer(1, 4 * mm))

    elements.append(_section_title("<font color='#F36A1D'>##</font> <b>Cost Savings Analysis</b>", page_width, section_heading))
    elements.append(Spacer(1, 1.2 * mm))

    # Derive insert cost and average life per corner from available data
    # insert_cost = CPC * tool_life  (reverse from CPC = insert_cost / tool_life)
    e_tool_life = _as_decimal(getattr(trial, "existing_tool_life", None))
    n_tool_life = _as_decimal(getattr(trial, "new_tool_life", None))
    e_insert_cost = existing_cpc * e_tool_life if e_tool_life > 0 else Decimal("0")
    n_insert_cost = new_cpc * n_tool_life if n_tool_life > 0 else Decimal("0")

    # Average Life (per corner) from insert detail or derive from tool_life / edges
    e_edges = _as_decimal(getattr(trial, "existing_cutting_edges", None))
    n_edges = _as_decimal(getattr(trial, "new_cutting_edges", None))
    life_per_edge = _as_decimal(getattr(insert_detail, "life_per_edge", None))
    e_avg_life = (e_tool_life / e_edges) if e_edges > 0 else Decimal("0")
    n_avg_life = life_per_edge if life_per_edge > 0 else ((n_tool_life / n_edges) if n_edges > 0 else Decimal("0"))

    e_insert_cost_str = _fmt_number(e_insert_cost, 2) if e_insert_cost > 0 else "-"
    n_insert_cost_str = _fmt_number(n_insert_cost, 2) if n_insert_cost > 0 else "-"
    e_avg_life_str = f"{_fmt_number(e_avg_life, 1)} pcs" if e_avg_life > 0 else "-"
    n_avg_life_str = f"{_fmt_number(n_avg_life, 1)} pcs" if n_avg_life > 0 else "-"

    # Green-text style for highlighted NEW values in cost table
    cell_text_center_green = ParagraphStyle(
        "CellTextCenterGreen",
        parent=cell_text_center,
        textColor=colors.HexColor("#1C8D4F"),
    )
    cell_text_bold_green = ParagraphStyle(
        "CellTextBoldGreen",
        parent=cell_text_bold,
        textColor=colors.HexColor("#1C8D4F"),
        alignment=TA_CENTER,
    )

    cost_rows = [
        [Paragraph("COST PARAMETER (RS.)", cell_text_bold), Paragraph("EXISTING", cell_text_bold), Paragraph("NEW", cell_text_bold)],
        [Paragraph("Insert Cost (per pc)", cell_text), Paragraph(e_insert_cost_str, cell_text_center), Paragraph(n_insert_cost_str, cell_text_center)],
        [Paragraph("Average Life (per corner)", cell_text), Paragraph(e_avg_life_str, cell_text_center), Paragraph(n_avg_life_str, cell_text_center_green)],
        [Paragraph("Cost / Component (CPC)", cell_text_bold), Paragraph(_fmt_currency(existing_cpc), cell_text_bold), Paragraph(_fmt_currency(new_cpc), cell_text_bold_green)],
    ]
    cost_table = Table(cost_rows, colWidths=[74 * mm, 25 * mm, 25 * mm])
    cost_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2F8")),
        ("BOX", (0, 0), (-1, -1), 0.6, SOFT_BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, SOFT_BORDER),
        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))

    card_title_green = ParagraphStyle(
        "CardTitleGreen",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        textColor=colors.HexColor("#1C8D4F"),
        alignment=TA_CENTER,
    )
    card_value_green = ParagraphStyle(
        "CardValueGreen",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=20,
        textColor=colors.HexColor("#1C8D4F"),
        alignment=TA_CENTER,
    )
    card_sub_green = ParagraphStyle(
        "CardSubGreen",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=6,
        textColor=colors.HexColor("#5B8C6C"),
        alignment=TA_CENTER,
    )
    card_title_orange = ParagraphStyle(
        "CardTitleOrange",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        textColor=ORANGE,
        alignment=TA_CENTER,
    )
    card_value_orange = ParagraphStyle(
        "CardValueOrange",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=20,
        textColor=ORANGE,
        alignment=TA_CENTER,
    )
    card_sub_orange = ParagraphStyle(
        "CardSubOrange",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=6,
        textColor=colors.HexColor("#C08868"),
        alignment=TA_CENTER,
    )

    savings_card = Table(
        [[Paragraph("SAVINGS / COMPONENT", card_title_green)], [Paragraph(_fmt_currency(savings_per_component), card_value_green)], [Paragraph("DIRECT TOOL COST REDUCTION", card_sub_green)]],
        colWidths=[62 * mm],
    )
    savings_card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SOFT_GREEN),
        ("BOX", (0, 0), (-1, -1), 1.2, GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))

    reduction_card = Table(
        [[Paragraph("CPC REDUCTION %", card_title_orange)], [Paragraph(_fmt_percent(cpc_reduction, 1), card_value_orange)], [Paragraph("EFFICIENCY IMPROVEMENT", card_sub_orange)]],
        colWidths=[62 * mm],
    )
    reduction_card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SOFT_ORANGE),
        ("BOX", (0, 0), (-1, -1), 1.2, ORANGE),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))

    summary_col = Table([[savings_card], [reduction_card]], colWidths=[62 * mm])
    summary_col.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 1), (0, 1), 4),
    ]))

    cost_layout = Table([[cost_table, summary_col]], colWidths=[124 * mm, 62 * mm])
    cost_layout.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(cost_layout)
    elements.append(Spacer(1, 3.5 * mm))

    estimated_qty_text = _text(getattr(trial, "target_quantity", None), default="0")
    try:
        estimated_qty_text = f"{int(_as_decimal(estimated_qty_text)):,}"
    except Exception:
        pass

    monthly_banner = Table(
        [[
            Paragraph(
                f"<b>Estimated Monthly Savings</b><br/><font size='7'>Based on {estimated_qty_text} components/month production volume</font>",
                banner_left,
            ),
            Paragraph(
                f"<b>{_fmt_currency(monthly_savings)}</b><br/><font size='6.5'>PROJECTED SAVINGS / MONTH</font>",
                banner_value,
            ),
        ]],
        colWidths=[124 * mm, 62 * mm],
    )
    monthly_banner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("BOX", (0, 0), (-1, -1), 0.6, NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(monthly_banner)

    if _text(getattr(trial, "remarks", None)) != "-":
        elements.append(Spacer(1, 3 * mm))
        remarks_title = ParagraphStyle(
            "RemarksTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            textColor=TEXT_DARK,
        )
        remarks_text = ParagraphStyle(
            "RemarksText",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7,
            textColor=TEXT_MUTED,
            leading=9,
        )
        elements.append(Paragraph("Remarks", remarks_title))
        elements.append(Paragraph(_text(getattr(trial, "remarks", None)), remarks_text))

    elements.append(Spacer(1, 10 * mm))

    signatures = Table(
        [["", ""], [
            Paragraph("<b>Prepared By (HariomTech)</b><br/><font size='6.5'>Sales &amp; Application Engineer</font>", signature_title),
            Paragraph("<b>Approved By (Customer)</b><br/><font size='6.5'>Authorized Signatory / Production Manager</font>", signature_title),
        ]],
        colWidths=[93 * mm, 93 * mm],
        rowHeights=[6 * mm, 12 * mm],
    )
    signatures.setStyle(TableStyle([
        ("LINEABOVE", (0, 1), (0, 1), 0.6, SOFT_BORDER),
        ("LINEABOVE", (1, 1), (1, 1), 0.6, SOFT_BORDER),
        ("VALIGN", (0, 1), (-1, 1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(signatures)
    elements.append(Spacer(1, 2 * mm))

    elements.append(Paragraph("END OF REPORT - CONFIDENTIAL DOCUMENT", note_center))
    elements.append(Paragraph("(c) Hariomtech Tooling Solutions. All Rights Reserved.", note_center))

    doc.build(elements)
    pdf_buffer.seek(0)
    return pdf_buffer
