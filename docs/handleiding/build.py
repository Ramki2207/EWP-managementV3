import base64
import html
import io
import re
import subprocess
import tempfile
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from PIL import Image
from pypdf import PdfReader, PdfWriter

from content_algemeen import ADMIN, ALGEMEEN
from content_basis import AAN_DE_SLAG, INLEIDING, PROCES
from content_bijlagen import BIJLAGEN
from content_projectleider import PROJECTLEIDER
from content_rollen import KLANT, LOGISTIEK, MONTAGE, OVERIGE_ROLLEN, PLANNER, TESTER

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
LOGO = ROOT / "public" / "EWP-Logo_blauw.png"
OUT_PDF = HERE / "Gebruikershandleiding_EWP_Paneelbouw.pdf"
OUT_DOCX = HERE / "Gebruikershandleiding_EWP_Paneelbouw.docx"
CHROMIUM = "/usr/bin/chromium"

CHAPTERS = [INLEIDING, AAN_DE_SLAG, PROCES, ALGEMEEN, ADMIN, PROJECTLEIDER, PLANNER,
            MONTAGE, TESTER, LOGISTIEK, OVERIGE_ROLLEN, KLANT, BIJLAGEN]

MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus",
          "september", "oktober", "november", "december"]
TODAY = date.today()
VERSION_LINE = f"Versie 2.0 – {MONTHS[TODAY.month - 1]} {TODAY.year}"
TITLE = "Gebruikershandleiding"
SUBTITLE = "EWP Paneelbouw Projectsysteem"

BLUE = "0B4F9C"
DARK = "0F172A"


def small_logo_png():
    img = Image.open(LOGO)
    img.thumbnail((1200, 1200))
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


LOGO_PNG = small_logo_png()


def chapter_label(ci):
    return "Bijlagen" if CHAPTERS[ci] is BIJLAGEN else f"Hoofdstuk {ci + 1}"


def section_number(ci, si):
    return "" if CHAPTERS[ci] is BIJLAGEN else f"{ci + 1}.{si + 1}"


def inline_html(text):
    parts = re.split(r"\*\*(.+?)\*\*", text)
    return "".join(f"<b>{html.escape(p)}</b>" if i % 2 else html.escape(p) for i, p in enumerate(parts))


CAMERA_SVG = ('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#7a8aa3" stroke-width="1.5" '
              'stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 '
              '2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>')


def block_html(block, counter):
    kind = block[0]
    if kind == "p":
        return f"<p>{inline_html(block[1])}</p>"
    if kind == "h3":
        return f"<h3>{inline_html(block[1])}</h3>"
    if kind == "list":
        return "<ul>" + "".join(f"<li>{inline_html(i)}</li>" for i in block[1]) + "</ul>"
    if kind == "steps":
        return '<ol class="steps">' + "".join(f"<li>{inline_html(i)}</li>" for i in block[1]) + "</ol>"
    if kind == "tip":
        return f'<div class="note tip"><div class="tag">Tip</div><div>{inline_html(block[1])}</div></div>'
    if kind == "warn":
        return f'<div class="note warn"><div class="tag">Let op</div><div>{inline_html(block[1])}</div></div>'
    if kind == "shot":
        counter[0] += 1
        return (f'<figure class="shot"><div class="ph">{CAMERA_SVG}<div class="ph-t">Plaats hier de schermafbeelding</div>'
                f'<div class="ph-s">{html.escape(block[1])}</div></div>'
                f'<figcaption><b>Afbeelding {counter[0]}</b> – {html.escape(block[1])}</figcaption></figure>')
    if kind == "table":
        head = "".join(f"<th>{html.escape(h)}</th>" for h in block[1])
        rows = "".join("<tr>" + "".join(f"<td>{inline_html(c)}</td>" for c in r) + "</tr>" for r in block[2])
        return f'<table class="grid"><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table>'
    if kind == "flow":
        items = "".join(f'<div class="fs"><span>{i + 1}</span>{html.escape(s)}</div>' for i, s in enumerate(block[1]))
        return f'<div class="flow">{items}</div>'
    raise ValueError(kind)


CSS = """
@page { size: A4; margin: 20mm 18mm 22mm 18mm; }
* { box-sizing: border-box; }
body { font-family: 'Noto Sans', 'Liberation Sans', sans-serif; color: #1e293b; font-size: 10pt; line-height: 1.5; margin: 0; }
b { color: #0f172a; font-weight: 700; }
.cover { height: 255mm; position: relative; page-break-after: always; }
.cover .band { position: absolute; left: -18mm; right: -18mm; top: 120mm; height: 82mm; background: #0B4F9C; }
.cover img { width: 95mm; margin-top: 14mm; }
.cover h1 { position: absolute; top: 134mm; left: 10mm; margin: 0; color: #fff; font-size: 36pt; line-height: 1.2; font-weight: 700; }
.cover .sub { position: absolute; top: 156mm; left: 10mm; color: #dbeafe; font-size: 16pt; }
.cover .ver { position: absolute; top: 178mm; left: 10mm; color: #bfdbfe; font-size: 10.5pt; }
.cover .foot { position: absolute; bottom: 0; left: 0; right: 0; font-size: 9pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4mm; }
.toc { page-break-after: always; }
.toc h2 { font-size: 22pt; color: #0B4F9C; margin: 0 0 8mm; line-height: 1.2; }
.toc .c { display: flex; font-weight: 700; color: #0f172a; margin-top: 3.2mm; font-size: 10.5pt; }
.toc .s { display: flex; padding-left: 9mm; color: #334155; font-size: 9.5pt; line-height: 1.55; }
.toc .n { width: 9mm; flex: none; }
.toc .t { flex: 1; display: flex; }
.toc .t::after { content: ''; flex: 1; border-bottom: 1px dotted #94a3b8; margin: 0 2mm 1.2mm; }
.toc .pg { width: 8mm; text-align: right; flex: none; }
.toc a { color: inherit; text-decoration: none; }
.chapter { page-break-before: always; }
.ch-head { border-bottom: 3px solid #0B4F9C; padding-bottom: 4mm; margin-bottom: 6mm; }
.ch-head .lbl { font-size: 9.5pt; letter-spacing: .12em; text-transform: uppercase; color: #0B4F9C; font-weight: 700; }
.ch-head h1 { margin: 1mm 0 0; font-size: 24pt; line-height: 1.2; color: #0f172a; }
.intro { font-size: 10.5pt; color: #334155; background: #f1f5f9; border-radius: 2mm; padding: 4mm 5mm; }
h2 { font-size: 14pt; color: #0B4F9C; margin: 8mm 0 3mm; line-height: 1.2; page-break-after: avoid; }
h2 .num { color: #64748b; margin-right: 2.5mm; }
h3 { font-size: 11pt; color: #0f172a; margin: 5mm 0 2mm; line-height: 1.2; page-break-after: avoid; }
p { margin: 0 0 2.5mm; }
ul { margin: 0 0 3mm; padding-left: 5mm; }
ul li { margin-bottom: 1.2mm; }
ul li::marker { color: #0B4F9C; }
ol.steps { list-style: none; counter-reset: st; padding: 0; margin: 0 0 3mm; }
ol.steps li { counter-increment: st; position: relative; padding-left: 9mm; margin-bottom: 2mm; min-height: 6mm; page-break-inside: avoid; }
ol.steps li::before { content: counter(st); position: absolute; left: 0; top: 0; width: 6mm; height: 6mm; border-radius: 50%;
  background: #0B4F9C; color: #fff; font-size: 8.5pt; font-weight: 700; text-align: center; line-height: 6mm; }
.note { display: flex; gap: 3mm; border-radius: 2mm; padding: 3mm 4mm; margin: 2mm 0 4mm; page-break-inside: avoid; }
.note .tag { flex: none; font-weight: 700; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .06em; padding-top: .4mm; width: 13mm; }
.tip { background: #eff6ff; border-left: 3px solid #2563eb; } .tip .tag { color: #1d4ed8; }
.warn { background: #fff7ed; border-left: 3px solid #ea580c; } .warn .tag { color: #c2410c; }
.shot { margin: 3mm 0 5mm; page-break-inside: avoid; }
.ph { height: 62mm; border: 1.5px dashed #94a3b8; border-radius: 2mm; background: #f8fafc; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center; padding: 0 10mm; }
.ph-t { font-weight: 700; color: #475569; margin-top: 2mm; }
.ph-s { color: #64748b; font-size: 9pt; }
figcaption { font-size: 8.5pt; color: #475569; margin-top: 1.5mm; font-style: italic; }
table.grid { width: 100%; border-collapse: collapse; margin: 1mm 0 4mm; font-size: 9pt; page-break-inside: auto; }
table.grid th { background: #0B4F9C; color: #fff; text-align: left; padding: 1.8mm 2.5mm; font-weight: 700; }
table.grid td { padding: 1.6mm 2.5mm; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
table.grid tr { page-break-inside: avoid; }
table.grid tbody tr:nth-child(even) td { background: #f8fafc; }
.flow { display: flex; flex-wrap: wrap; gap: 2mm; margin: 2mm 0 5mm; }
.fs { background: #eff6ff; border: 1px solid #bfdbfe; color: #0f172a; border-radius: 10mm; padding: 1.2mm 3.5mm 1.2mm 1.2mm; font-size: 9pt; font-weight: 700; display: flex; align-items: center; gap: 2mm; }
.fs span { background: #0B4F9C; color: #fff; width: 5.5mm; height: 5.5mm; border-radius: 50%; display: inline-block; text-align: center; line-height: 5.5mm; font-size: 8pt; }
.mk { position: absolute; font-size: 1px; color: #fff; }
"""


def build_html(page_map, with_markers):
    logo = base64.b64encode(LOGO_PNG).decode()
    out = [f"<!doctype html><html lang='nl'><head><meta charset='utf-8'><style>{CSS}</style></head><body>"]
    out.append(f"""<div class="cover"><img src="data:image/png;base64,{logo}"><div class="band"></div>
<h1>{TITLE}</h1><div class="sub">{SUBTITLE}</div><div class="ver">{VERSION_LINE}</div>
<div class="foot">EWP Paneelbouw · Uitgebreide handleiding per rol, inclusief het volledige proces van Intake tot Gereed</div></div>""")
    out.append('<div class="toc"><h2>Inhoudsopgave</h2>')
    for ci, ch in enumerate(CHAPTERS):
        num = "" if ch is BIJLAGEN else f"{ci + 1}"
        pg = page_map.get(f"c{ci}", "")
        out.append(f'<div class="c"><span class="n">{num}</span><a class="t" href="#c{ci}">{html.escape(ch["title"])}</a><span class="pg">{pg}</span></div>')
        for si, sec in enumerate(ch["sections"]):
            pg = page_map.get(f"c{ci}s{si}", "")
            out.append(f'<div class="s"><span class="n">{section_number(ci, si)}</span><a class="t" href="#c{ci}s{si}">{html.escape(sec["title"])}</a><span class="pg">{pg}</span></div>')
    out.append("</div>")
    counter = [0]
    for ci, ch in enumerate(CHAPTERS):
        mk = f'<span class="mk">@@c{ci}@@</span>' if with_markers else ""
        out.append(f'<section class="chapter" id="c{ci}">{mk}<div class="ch-head"><div class="lbl">{chapter_label(ci)}</div><h1>{html.escape(ch["title"])}</h1></div>')
        if ch.get("intro"):
            out.append(f'<p class="intro">{inline_html(ch["intro"])}</p>')
        for si, sec in enumerate(ch["sections"]):
            mk = f'<span class="mk">@@c{ci}s{si}@@</span>' if with_markers else ""
            num = section_number(ci, si)
            numh = f'<span class="num">{num}</span>' if num else ""
            out.append(f'<h2 id="c{ci}s{si}">{mk}{numh}{html.escape(sec["title"])}</h2>')
            out.extend(block_html(b, counter) for b in sec["blocks"])
        out.append("</section>")
    out.append("</body></html>")
    return "".join(out)


def render_pdf(html_text, pdf_path):
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html_text)
        src = f.name
    subprocess.run([CHROMIUM, "--headless", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={pdf_path}", f"file://{src}"], check=True, capture_output=True, timeout=180)


def find_pages(pdf_path):
    mapping = {}
    for i, page in enumerate(PdfReader(pdf_path).pages):
        for key in re.findall(r"@@(c\d+(?:s\d+)?)@@", page.extract_text() or ""):
            mapping.setdefault(key, i + 1)
    return mapping


def footer_overlay(count, pdf_path):
    pages = "".join(
        f'<div class="pg"><div class="f"><span>{TITLE} · {SUBTITLE}</span><span>Pagina {n}</span></div></div>'
        for n in range(1, count + 1))
    doc = f"""<!doctype html><html><head><meta charset='utf-8'><style>
@page {{ size: A4; margin: 0; }} body {{ margin: 0; font-family: 'Noto Sans', sans-serif; }}
.pg {{ width: 210mm; height: 297mm; position: relative; page-break-after: always; }}
.f {{ position: absolute; left: 18mm; right: 18mm; bottom: 10mm; display: flex; justify-content: space-between;
     font-size: 8pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 2mm; }}
</style></head><body>{pages}</body></html>"""
    render_pdf(doc, pdf_path)


def build_pdf():
    tmp = Path(tempfile.mkdtemp())
    first = tmp / "pass1.pdf"
    render_pdf(build_html({}, True), first)
    page_map = find_pages(first)
    expected = sum(1 + len(c["sections"]) for c in CHAPTERS)
    if len(page_map) != expected:
        raise RuntimeError(f"Found {len(page_map)} of {expected} headings")
    body = tmp / "body.pdf"
    render_pdf(build_html(page_map, False), body)
    writer = PdfWriter(clone_from=body)
    overlay_path = tmp / "footer.pdf"
    footer_overlay(len(writer.pages), overlay_path)
    overlay = PdfReader(overlay_path)
    for i, page in enumerate(writer.pages):
        if i > 0:
            page.merge_page(overlay.pages[i])
    writer.add_metadata({"/Title": f"{TITLE} – {SUBTITLE}", "/Author": "EWP Paneelbouw"})
    with open(OUT_PDF, "wb") as f:
        writer.write(f)
    return len(writer.pages), page_map


def shade(cell, hex_color):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tc_pr.append(shd)


def cell_borders(cell, color, style="single", size=8):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), style)
        el.set(qn("w:sz"), str(size))
        el.set(qn("w:color"), color)
        borders.append(el)
    tc_pr.append(borders)


def add_rich(paragraph, text, size=None, color=None):
    for i, part in enumerate(re.split(r"\*\*(.+?)\*\*", text)):
        if not part:
            continue
        run = paragraph.add_run(part)
        run.bold = bool(i % 2)
        if size:
            run.font.size = Pt(size)
        if color:
            run.font.color.rgb = RGBColor.from_string(color)


def add_field(paragraph, instr):
    run = paragraph.add_run()
    for tag, attr in (("w:fldChar", "begin"), ("w:instrText", None), ("w:fldChar", "separate")):
        el = OxmlElement(tag)
        if attr:
            el.set(qn("w:fldCharType"), attr)
        else:
            el.set(qn("xml:space"), "preserve")
            el.text = instr
        run._r.append(el)
    run2 = paragraph.add_run("Klik met de rechtermuisknop en kies 'Veld bijwerken' om de inhoudsopgave te vullen."
                             if "TOC" in instr else "1")
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run2._r.append(end)


def docx_block(doc, block, counter):
    kind = block[0]
    if kind == "p":
        add_rich(doc.add_paragraph(), block[1])
    elif kind == "h3":
        doc.add_heading(block[1], level=3)
    elif kind == "list":
        for item in block[1]:
            add_rich(doc.add_paragraph(style="List Bullet"), item)
    elif kind == "steps":
        for n, item in enumerate(block[1], 1):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(0.8)
            p.paragraph_format.first_line_indent = Cm(-0.8)
            r = p.add_run(f"{n}.\t")
            r.bold = True
            r.font.color.rgb = RGBColor.from_string(BLUE)
            p.paragraph_format.tab_stops.add_tab_stop(Cm(0.8))
            add_rich(p, item)
    elif kind in ("tip", "warn"):
        t = doc.add_table(rows=1, cols=1)
        c = t.cell(0, 0)
        shade(c, "EFF6FF" if kind == "tip" else "FFF7ED")
        cell_borders(c, "2563EB" if kind == "tip" else "EA580C")
        p = c.paragraphs[0]
        r = p.add_run("Tip: " if kind == "tip" else "Let op: ")
        r.bold = True
        r.font.color.rgb = RGBColor.from_string("1D4ED8" if kind == "tip" else "C2410C")
        add_rich(p, block[1])
        doc.add_paragraph()
    elif kind == "shot":
        counter[0] += 1
        t = doc.add_table(rows=1, cols=1)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        c = t.cell(0, 0)
        shade(c, "F8FAFC")
        cell_borders(c, "94A3B8", "dashed", 8)
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(60)
        p.paragraph_format.space_after = Pt(60)
        r = p.add_run(f"[ Plaats hier de schermafbeelding ]\n{block[1]}")
        r.font.color.rgb = RGBColor.from_string("64748B")
        cap = doc.add_paragraph()
        cr = cap.add_run(f"Afbeelding {counter[0]} – {block[1]}")
        cr.italic = True
        cr.font.size = Pt(8.5)
        cr.font.color.rgb = RGBColor.from_string("475569")
    elif kind == "table":
        headers, rows = block[1], block[2]
        t = doc.add_table(rows=1, cols=len(headers))
        t.style = "Table Grid"
        for i, h in enumerate(headers):
            c = t.rows[0].cells[i]
            shade(c, BLUE)
            r = c.paragraphs[0].add_run(h)
            r.bold = True
            r.font.size = Pt(9)
            r.font.color.rgb = RGBColor(255, 255, 255)
        for row in rows:
            cells = t.add_row().cells
            for i, val in enumerate(row):
                add_rich(cells[i].paragraphs[0], val, size=9)
        doc.add_paragraph()
    elif kind == "flow":
        p = doc.add_paragraph()
        add_rich(p, "  →  ".join(f"**{s}**" for s in block[1]), color=BLUE)


def build_docx():
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    for side in ("left_margin", "right_margin"):
        setattr(sec, side, Cm(2))
    styles = doc.styles
    styles["Normal"].font.name = "Calibri"
    styles["Normal"].font.size = Pt(10.5)
    for name, size in (("Heading 1", 22), ("Heading 2", 14), ("Heading 3", 11.5)):
        st = styles[name]
        st.font.name = "Calibri"
        st.font.size = Pt(size)
        st.font.color.rgb = RGBColor.from_string(BLUE if name != "Heading 3" else DARK)

    doc.add_paragraph().paragraph_format.space_before = Pt(60)
    doc.add_picture(io.BytesIO(LOGO_PNG), width=Cm(9))
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(120)
    r = p.add_run(TITLE)
    r.bold = True
    r.font.size = Pt(34)
    r.font.color.rgb = RGBColor.from_string(BLUE)
    p = doc.add_paragraph()
    r = p.add_run(SUBTITLE)
    r.font.size = Pt(16)
    p = doc.add_paragraph()
    r = p.add_run(VERSION_LINE)
    r.font.color.rgb = RGBColor.from_string("64748B")
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    doc.add_heading("Inhoudsopgave", level=1)
    add_field(doc.add_paragraph(), 'TOC \\o "1-2" \\h \\z \\u')

    footer = doc.sections[0].footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    fr = footer.add_run(f"{TITLE} · {SUBTITLE} · Pagina ")
    fr.font.size = Pt(8)
    add_field(footer, "PAGE")

    counter = [0]
    for ci, ch in enumerate(CHAPTERS):
        doc.add_section(WD_SECTION.NEW_PAGE)
        prefix = "" if ch is BIJLAGEN else f"{ci + 1}. "
        doc.add_heading(f"{prefix}{ch['title']}", level=1)
        if ch.get("intro"):
            add_rich(doc.add_paragraph(), ch["intro"])
        for si, s in enumerate(ch["sections"]):
            num = section_number(ci, si)
            doc.add_heading(f"{num} {s['title']}".strip(), level=2)
            for b in s["blocks"]:
                docx_block(doc, b, counter)
    doc.settings.element.append(OxmlElement("w:updateFields"))
    doc.settings.element[-1].set(qn("w:val"), "true")
    doc.save(OUT_DOCX)
    return counter[0]


if __name__ == "__main__":
    pages, _ = build_pdf()
    shots = build_docx()
    print(f"PDF: {OUT_PDF.name} ({pages} pagina's)")
    print(f"DOCX: {OUT_DOCX.name} ({shots} screenshot-plekken)")
