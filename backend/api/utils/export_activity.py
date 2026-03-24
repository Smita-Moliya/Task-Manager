import io
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer


def _safe(value):
    if value is None:
        return ""
    return str(value)


def generate_activity_pdf(logs):
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=20,
        rightMargin=20,
        topMargin=20,
        bottomMargin=20,
    )

    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Activity Logs", styles["Title"]))
    elements.append(Spacer(1, 12))

    data = [[
        "Time",
        "Task",
        "Actor",
        "Action",
        "Message",
    ]]

    for log in logs:
        from xml.sax.saxutils import escape

        msg = _safe(log.get("message"))
        task_str = f'#{_safe(log.get("task_id"))} {_safe(log.get("task_title"))}'.strip()
        actor_str = f'{_safe(log.get("actor_name"))} #{_safe(log.get("actor_id"))}'.strip()

        data.append([
            _safe(log.get("created_at")),
            Paragraph(escape(task_str), styles["Normal"]),
            Paragraph(escape(actor_str), styles["Normal"]),
            _safe(log.get("action")),
            Paragraph(escape(msg), styles["Normal"]),
        ])

    table = Table(
        data,
        repeatRows=1,
        colWidths=[130, 130, 110, 130, 260],
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
    ]))

    elements.append(table)
    doc.build(elements)

    buffer.seek(0)
    return buffer


def generate_activity_excel(logs):
    wb = Workbook()
    ws = wb.active
    ws.title = "Activity Logs"

    headers = ["Time", "Task", "Actor", "Action", "Message"]
    ws.append(headers)

    for log in logs:
        ws.append([
            _safe(log.get("created_at")),
            f'#{_safe(log.get("task_id"))} {_safe(log.get("task_title"))}'.strip(),
            f'{_safe(log.get("actor_name"))} #{_safe(log.get("actor_id"))}'.strip(),
            _safe(log.get("action")),
            _safe(log.get("message")),
        ])

    ws.column_dimensions["A"].width = 24
    ws.column_dimensions["B"].width = 24
    ws.column_dimensions["C"].width = 20
    ws.column_dimensions["D"].width = 24
    ws.column_dimensions["E"].width = 45

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer