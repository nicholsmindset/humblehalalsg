#!/usr/bin/env python3
"""Build the trust-safe evergreen Humble Halal email lead magnet.

The guide deliberately contains no restaurant names, certification verdicts,
prayer times, or other facts that can go stale. It teaches a reusable planning
workflow and sends readers back to the live site and official MUIS register for
current information.
"""

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "halal-weekend-planner-singapore.pdf"
PUBLIC = ROOT / "public" / "guides" / "halal-weekend-planner-singapore.pdf"
LEGACY_PUBLIC = [
    ROOT / "public" / "guides" / "ultimate-halal-food-guide-mrt.pdf",
    ROOT / "public" / "guides" / "halal-brand-cheat-sheet.pdf",
    ROOT / "public" / "guides" / "ramadan-2026-planner.pdf",
]

PAGE_W, PAGE_H = A4
MARGIN_X = 18 * mm
MARGIN_TOP = 18 * mm
MARGIN_BOTTOM = 17 * mm

EMERALD = HexColor("#0F6F63")
EMERALD_DARK = HexColor("#0A5149")
GOLD = HexColor("#B8860B")
INK = HexColor("#1F2933")
MUTED = HexColor("#52606D")
CREAM = HexColor("#FBF7EE")
MINT = HexColor("#EAF5F1")
LINE = HexColor("#DDD8CA")
PALE = HexColor("#F6F7F5")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="Brand",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=9,
    leading=11,
    textColor=EMERALD,
    tracking=1.2,
    spaceAfter=4 * mm,
))
styles.add(ParagraphStyle(
    name="CoverTitle",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=29,
    leading=32,
    textColor=INK,
    alignment=TA_LEFT,
    spaceAfter=5 * mm,
))
styles.add(ParagraphStyle(
    name="CoverSub",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=13,
    leading=19,
    textColor=MUTED,
    spaceAfter=7 * mm,
))
styles.add(ParagraphStyle(
    name="H1x",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=22,
    leading=26,
    textColor=INK,
    spaceAfter=3 * mm,
))
styles.add(ParagraphStyle(
    name="H2x",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=12,
    leading=15,
    textColor=EMERALD_DARK,
    spaceAfter=1.5 * mm,
))
styles.add(ParagraphStyle(
    name="Bodyx",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=9.4,
    leading=14,
    textColor=INK,
))
styles.add(ParagraphStyle(
    name="Smallx",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=7.8,
    leading=11,
    textColor=MUTED,
))
styles.add(ParagraphStyle(
    name="CenterSmall",
    parent=styles["Smallx"],
    alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="StepNum",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=11,
    leading=14,
    textColor=white,
    alignment=TA_CENTER,
))


class Rule(Flowable):
    def __init__(self, color=LINE, width=0.6, space_before=2 * mm, space_after=3 * mm):
        super().__init__()
        self.color = color
        self.width = width
        self.space_before = space_before
        self.space_after = space_after
        self.height = space_before + space_after + width

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.width)
        self.canv.line(0, self.space_after, self._availWidth, self.space_after)

    def wrap(self, avail_width, avail_height):
        self._availWidth = avail_width
        return avail_width, self.height


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_X, 12 * mm, PAGE_W - MARGIN_X, 12 * mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_X, 8 * mm, "Humble Halal - humblehalal.com")
    canvas.drawRightString(PAGE_W - MARGIN_X, 8 * mm, f"{doc.page} / 4")
    canvas.restoreState()


def link(text, url):
    return f'<link href="{url}" color="#0F6F63"><u>{text}</u></link>'


def step(number, title, body):
    badge = Table(
        [[Paragraph(str(number), styles["StepNum"])]],
        colWidths=[8 * mm],
        rowHeights=[8 * mm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), EMERALD),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BOX", (0, 0), (-1, -1), 0, EMERALD),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]),
    )
    copy = [Paragraph(title, styles["H2x"]), Paragraph(body, styles["Bodyx"])]
    row = Table(
        [[badge, copy]],
        colWidths=[12 * mm, PAGE_W - 2 * MARGIN_X - 12 * mm],
        style=TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 1.5 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm),
        ]),
    )
    return KeepTogether([row])


def checkbox_row(label, hint=""):
    box = Table(
        [[""]],
        colWidths=[5 * mm],
        rowHeights=[5 * mm],
        style=TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.8, EMERALD),
            ("BACKGROUND", (0, 0), (-1, -1), white),
        ]),
    )
    body = f"<b>{label}</b>"
    if hint:
        body += f'<br/><font color="#52606D" size="8">{hint}</font>'
    return [box, Paragraph(body, styles["Bodyx"])]


def write_line(label, height=10 * mm, hint=""):
    content = f"<b>{label}</b>"
    if hint:
        content += f'<br/><font color="#52606D" size="8">{hint}</font>'
    return Table(
        [[Paragraph(content, styles["Bodyx"])]],
        colWidths=[PAGE_W - 2 * MARGIN_X],
        rowHeights=[height],
        style=TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("BACKGROUND", (0, 0), (-1, -1), white),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ]),
    )


def build_story():
    story = []

    # Page 1 - promise and quick preview.
    story.append(Spacer(1, 26 * mm))
    story.append(Paragraph("HUMBLE HALAL - SINGAPORE", styles["Brand"]))
    story.append(Paragraph("The 10-Minute Halal<br/>Weekend Planner", styles["CoverTitle"]))
    story.append(Paragraph(
        "Plan one meal, one prayer stop and one meaningful activity - without opening twenty tabs or relying on an outdated list.",
        styles["CoverSub"],
    ))
    chips = Table(
        [["FOOD", "PRAYER", "SOMETHING TO DO"]],
        colWidths=[43 * mm, 43 * mm, 58 * mm],
        rowHeights=[11 * mm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), MINT),
            ("TEXTCOLOR", (0, 0), (-1, -1), EMERALD_DARK),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BOX", (0, 0), (-1, -1), 0.7, LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.7, LINE),
        ]),
    )
    story.append(chips)
    story.append(Spacer(1, 9 * mm))
    promise = Table(
        [[Paragraph("Inside", styles["H2x"]), Paragraph("A reusable planning method", styles["H2x"])],
         [Paragraph("4 mobile-friendly pages", styles["Bodyx"]), Paragraph("One printable worksheet + a halal-status check", styles["Bodyx"])]],
        colWidths=[55 * mm, 89 * mm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), CREAM),
            ("BOX", (0, 0), (-1, -1), 0.7, LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.7, LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
        ]),
    )
    story.append(promise)
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph("Reusable every weekend. Current information stays on the live site.", styles["CenterSmall"]))
    story.append(PageBreak())

    # Page 2 - the plan.
    story.append(Paragraph("YOUR REUSABLE ROUTINE", styles["Brand"]))
    story.append(Paragraph("Plan the weekend in 10 minutes", styles["H1x"]))
    story.append(Paragraph("Keep the decision small: one area, one main meal and one simple route.", styles["Bodyx"]))
    story.append(Spacer(1, 3 * mm))
    story.extend([
        step(1, "Pick one area", "Choose a neighbourhood or MRT area that keeps travel simple. Start with the live " + link("halal food guide", "https://www.humblehalal.com/halal-food-singapore") + "."),
        step(2, "Choose the main meal", "Save one first choice and one backup. Check the listing's label instead of assuming every outlet in a chain has the same status."),
        step(3, "Verify before you go", "For certified places, confirm the current outlet on the " + link("official MUIS HalalSG search", "https://www.muis.gov.sg/halal/for-consumers/") + ". For Muslim-owned or self-declared places, read the stated basis and decide what you are comfortable with."),
        step(4, "Place prayer into the route", "Check " + link("Singapore prayer times", "https://www.humblehalal.com/waktu-solat-singapore") + " and save a nearby " + link("mosque or prayer space", "https://www.humblehalal.com/mosques") + " before leaving."),
        step(5, "Add one meaningful stop", "Pick one activity, class, family stop or community event. Use the live " + link("events page", "https://www.humblehalal.com/events") + " for current dates and details."),
        step(6, "Share the plan", "Send the route to everyone going. Include the meeting point, meal time, prayer stop, budget and backup so the day stays easy."),
    ])
    story.append(Spacer(1, 2 * mm))
    tip = Table(
        [[Paragraph("THE 10-MINUTE RULE", styles["H2x"]), Paragraph("If the plan still feels complicated after ten minutes, remove a stop - do not add another tab.", styles["Bodyx"])]],
        colWidths=[42 * mm, 102 * mm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), MINT),
            ("BOX", (0, 0), (-1, -1), 0.7, EMERALD),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
        ]),
    )
    story.append(tip)
    story.append(PageBreak())

    # Page 3 - printable worksheet.
    story.append(Paragraph("PRINT OR FILL ON YOUR PHONE", styles["Brand"]))
    story.append(Paragraph("My halal weekend plan", styles["H1x"]))
    story.append(Paragraph("Keep it realistic. A good plan is one you will actually use.", styles["Bodyx"]))
    story.append(Spacer(1, 4 * mm))
    top = Table(
        [[Paragraph("<b>Date</b><br/><br/>________________________", styles["Bodyx"]),
          Paragraph("<b>Area / MRT</b><br/><br/>________________________", styles["Bodyx"]),
          Paragraph("<b>Who is going?</b><br/><br/>________________________", styles["Bodyx"])]],
        colWidths=[48 * mm, 48 * mm, 48 * mm],
        rowHeights=[23 * mm],
        style=TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.6, LINE),
            ("BACKGROUND", (0, 0), (-1, -1), CREAM),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ]),
    )
    story.append(top)
    story.append(Spacer(1, 3 * mm))
    story.append(write_line("1. Main meal", 15 * mm, "Place, outlet, time and the halal-status label you checked"))
    story.append(Spacer(1, 2.5 * mm))
    story.append(write_line("2. Prayer stop", 14 * mm, "Prayer, estimated time, mosque or prayer space"))
    story.append(Spacer(1, 2.5 * mm))
    story.append(write_line("3. One activity", 14 * mm, "Event, family activity, walk, class or useful errand"))
    story.append(Spacer(1, 2.5 * mm))
    story.append(write_line("4. Backup meal", 13 * mm, "A nearby alternative in case the first choice is full or closed"))
    story.append(Spacer(1, 3 * mm))
    checks = [
        checkbox_row("Current halal status checked", "Outlet and certificate details confirmed where applicable"),
        checkbox_row("Opening hours checked"),
        checkbox_row("Travel time checked"),
        checkbox_row("Budget agreed"),
    ]
    check_table = Table(
        checks,
        colWidths=[8 * mm, 136 * mm],
        rowHeights=[12 * mm] * len(checks),
        style=TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.6, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
        ]),
    )
    story.append(check_table)
    story.append(PageBreak())

    # Page 4 - verification quick reference and newsletter habit.
    story.append(Paragraph("SAVE THIS PAGE", styles["Brand"]))
    story.append(Paragraph("A quick halal-status check", styles["H1x"]))
    story.append(Paragraph("A label tells you the basis for a claim. It does not remove the need to check current information.", styles["Bodyx"]))
    story.append(Spacer(1, 4 * mm))
    rows = [
        [Paragraph("1", styles["StepNum"]), Paragraph("<b>Is a current MUIS certificate shown?</b><br/>Confirm the exact outlet, certificate details and validity using the official MUIS search.", styles["Bodyx"])],
        [Paragraph("2", styles["StepNum"]), Paragraph("<b>If not, what is the stated basis?</b><br/>Muslim-owned, no pork/lard and halal-friendly are different claims. They are not the same as MUIS certification.", styles["Bodyx"])],
        [Paragraph("3", styles["StepNum"]), Paragraph("<b>Is anything unclear?</b><br/>Ask the business directly or choose a currently certified alternative. Comfort levels differ; the label should help you make an informed choice.", styles["Bodyx"])],
    ]
    decision = Table(rows, colWidths=[12 * mm, 132 * mm], rowHeights=[30 * mm, 32 * mm, 32 * mm])
    decision.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), EMERALD),
        ("BACKGROUND", (1, 0), (1, -1), PALE),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.7, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    story.append(decision)
    story.append(Spacer(1, 6 * mm))
    habit = Table(
        [[Paragraph("MAKE FRIDAY THE PLANNING DAY", styles["H2x"])],
         [Paragraph("Use the weekly Humble Halal email to fill this sheet: pick one new find, check the live details and share the route with your family or friends.", styles["Bodyx"])],
         [Paragraph(link("Open the live Humble Halal guide", "https://www.humblehalal.com/"), styles["Bodyx"])]],
        colWidths=[144 * mm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), CREAM),
            ("BOX", (0, 0), (-1, -1), 0.8, GOLD),
            ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
        ]),
    )
    story.append(habit)
    story.append(Spacer(1, 5 * mm))
    story.append(Paragraph(
        "Current halal information: " + link("muis.gov.sg/halal/for-consumers", "https://www.muis.gov.sg/halal/for-consumers/") +
        "<br/>Humble Halal is a discovery platform, not a certifier. Always verify before visiting.",
        styles["Smallx"],
    ))

    return story


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    frame = Frame(
        MARGIN_X,
        MARGIN_BOTTOM,
        PAGE_W - 2 * MARGIN_X,
        PAGE_H - MARGIN_TOP - MARGIN_BOTTOM,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
        id="main",
    )
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        title="The 10-Minute Halal Weekend Planner - Singapore",
        author="Humble Halal",
        subject="A reusable food, prayer and activity planner for Singapore weekends",
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
    )
    doc.addPageTemplates([PageTemplate(id="guide", frames=[frame], onPage=footer)])
    doc.build(build_story())
    safe_bytes = OUTPUT.read_bytes()
    PUBLIC.write_bytes(safe_bytes)
    # Keep old shared links safe while the routing layer moves visitors to the
    # canonical URL. No outdated or unverified guide remains directly servable.
    for legacy_path in LEGACY_PUBLIC:
        legacy_path.write_bytes(safe_bytes)
    print(f"Wrote {OUTPUT}")
    print(f"Wrote {PUBLIC}")
    for legacy_path in LEGACY_PUBLIC:
        print(f"Wrote safe legacy alias {legacy_path}")


if __name__ == "__main__":
    build()
