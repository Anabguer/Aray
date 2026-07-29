"""Genera HTML/PDF imprimibles de les fitxes de repaso (fichas_repaso/)."""
from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass
from html import escape
from pathlib import Path

import markdown

from generate_week1_special import document_css


ROOT = Path(__file__).resolve().parent
FICHAS = ROOT / "fichas_repaso"
OUT = ROOT / "salida" / "fichas_repaso"
IMAGES = FICHAS / "imatges"

AREAS = [
    ("01_mates", "Matemàtiques", "01_mates.pdf"),
    ("02_castellano", "Castellano", "02_castellano.pdf"),
    ("03_catala", "Català", "03_catala.pdf"),
    ("04_medi", "Medi", "04_medi.pdf"),
    ("05_angles", "Anglès", "05_angles.pdf"),
]

AREA_SHORT = {
    "01_mates": ("MAT", "#1e4db7"),
    "02_castellano": ("CAS", "#c45a11"),
    "03_catala": ("CAT", "#2a7a3b"),
    "04_medi": ("MED", "#6b4c9a"),
    "05_angles": ("ANG", "#0d7a8c"),
}

PAGE_MAX_WEIGHT = 8.5
HEAVY_EXERCISE = 7.5
MIN_EXERCISES_PER_PAGE = 2


@dataclass
class ExerciseBlock:
    area_folder: str
    area_label: str
    area_short: str
    area_color: str
    fitxa_num: str
    fitxa_title: str
    section_title: str
    md_body: str
    weight: float
    use_english: bool = False

NOM_DATA_RE = re.compile(
    r"^\*\*(?:Nom|Name):\*\*.*?\*\*(?:Fitxa|Worksheet)\s+(\d+)\*\*\s*$",
    re.MULTILINE,
)
ARAY_IMG_RE = re.compile(r'<img[^>]*aray\.png[^>]*>', re.IGNORECASE)
META_RE = re.compile(
    r"^\*\*Àrea:\*\*|\*\*Area:\*\*|\*\*Àrea:\*\*",
    re.MULTILINE,
)


def fichas_css() -> str:
    return (
        document_css()
        + """
    @page { size: A4; margin: 8mm; }
    .page.fitxa-page {
      width: 196mm;
      min-height: 279mm;
      margin: 0 auto;
      padding: 7mm 9mm 5mm 9mm;
      page-break-after: always;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
    }
    .fitxa-body {
      flex: 1 1 auto;
      min-height: 0;
    }
    .fitxa-body > :first-child { margin-top: 0; }
    .fitxa-meta {
      margin: 0 0 8px 0;
      padding: 0;
      color: #55627a;
      font-size: 11.5px;
      line-height: 1.35;
    }
    .fitxa-header-bar {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      margin: 0 0 10px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #c9d2e5;
    }
    .fitxa-header-bar img.aray-avatar {
      width: 60px !important;
      height: auto !important;
      max-height: 60px;
      flex-shrink: 0;
    }
    .fitxa-fields {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 10px 18px;
      font-size: 14px;
      font-weight: 700;
    }
    .field-group {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      white-space: nowrap;
    }
    .field-line {
      display: inline-block;
      border-bottom: 2.5px solid #1f2530;
      height: 24px;
      vertical-align: bottom;
    }
    .field-nom { width: 72mm; min-width: 72mm; }
    .field-date { width: 36mm; min-width: 36mm; }
    .fitxa-num {
      margin-left: auto;
      color: #1e4db7;
      font-size: 15px;
      white-space: nowrap;
    }
    .fitxa-body h1 {
      font-size: 21px;
      margin: 0 0 8px 0;
      line-height: 1.2;
    }
    .fitxa-body h2 {
      font-size: 16px;
      margin: 14px 0 8px 0;
      color: #1e4db7;
      line-height: 1.3;
    }
    .fitxa-body p,
    .fitxa-body li,
    .fitxa-body td,
    .fitxa-body th {
      font-size: 14px;
      line-height: 1.45;
      margin: 4px 0;
    }
    .fitxa-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    .fitxa-body th,
    .fitxa-body td {
      border: 1px solid #c9d2e5;
      padding: 8px 9px;
      font-size: 13.5px;
      vertical-align: top;
      min-height: 32px;
    }
    .fitxa-body th { background: #eef3ff; }
    .fitxa-body blockquote {
      margin: 8px 0;
      padding: 8px 12px;
      background: #f8fbff;
      border-left: 3px solid #1e4db7;
      color: #44506a;
      font-size: 13px;
    }
    .fitxa-body img.fitxa-illustration {
      width: auto !important;
      height: auto !important;
      max-height: 48mm !important;
      max-width: 52% !important;
      float: right;
      margin: 0 0 8px 10px;
      object-fit: contain;
    }
    .fitxa-body img.fitxa-illustration-small {
      max-height: 24mm !important;
      max-width: 28% !important;
    }
  /* Imatge principal sola: més gran i centrada */
    .fitxa-body h2 + p > img.fitxa-illustration:only-child,
    .fitxa-body p > img.fitxa-illustration:only-child {
      max-height: 55mm !important;
      max-width: 75% !important;
      float: none;
      display: block;
      margin: 8px auto 12px auto;
    }
    .fitxa-body pre {
      font-family: "Courier New", monospace;
      font-size: 14px;
      line-height: 1.35;
      background: #f8faff;
      border: 1px solid #d5ddec;
      border-radius: 8px;
      padding: 10px;
      margin: 8px 0;
      white-space: pre-wrap;
      min-height: 55mm;
    }
    .fitxa-body ul,
    .fitxa-body ol {
      margin: 8px 0;
      padding-left: 22px;
    }
    .fitxa-body li {
      margin: 6px 0 14px 0;
    }
    .fitxa-body li p { margin: 0 0 6px 0; }
    .fitxa-body li + .write-line { margin-top: 4px; margin-bottom: 8px; }
    .write-line {
      height: 28px;
      border-bottom: 2px solid #7d90ba;
      margin: 6px 0 12px 0;
    }
    .write-line.tall {
      height: 34px;
      margin-bottom: 14px;
    }
    .inline-blank {
      display: inline-block;
      min-width: 65mm;
      border-bottom: 2px solid #7d90ba;
      height: 22px;
      vertical-align: bottom;
    }
    .fitxa-body p:has(strong:first-child) { margin-top: 10px; }
    .fitxa-recorda {
      margin-top: 12px;
      padding: 10px 12px;
      background: #fffdf4;
      border: 1px solid #eadfb6;
      border-radius: 8px;
      font-size: 13px;
    }
    .fitxa-body .reading-text {
      font-size: 14px;
      line-height: 1.5;
      margin: 6px 0 12px 0;
    }
    .footer-line {
      flex-shrink: 0;
      margin-top: 8px;
      padding-top: 5px;
      border-top: 1px solid #e2e8f4;
      color: #7a869e;
      font-size: 11px;
    }
    .area-cover {
      text-align: center;
      padding: 30mm 10mm;
      height: 281mm;
    }
    .area-cover h1 { font-size: 32px; }
    .area-cover p { color: #55627a; font-size: 16px; }
    @media print {
      body { background: #fff; }
      .page { border: none; border-radius: 0; box-shadow: none; }
      .page.fitxa-page { width: auto; margin: 0; }
    }
    """
    )


def mezcla_css() -> str:
    return """
    .page.mezcla-page {
      width: 196mm;
      min-height: 279mm;
      padding: 7mm 9mm 5mm 9mm;
      page-break-after: always;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .mezcla-page-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      padding-bottom: 7px;
      border-bottom: 2px solid #c9d2e5;
    }
    .mezcla-page-head .chapter-pill { margin: 0; }
    .mezcla-page-num {
      font-size: 13px;
      font-weight: 700;
      color: #1e4db7;
    }
    .mezcla-stack {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      justify-content: stretch;
    }
    .exercise-card {
      border: 1.5px solid #d5ddec;
      border-radius: 10px;
      padding: 9px 11px 10px 11px;
      background: linear-gradient(180deg, #fafcff 0%, #fff 100%);
      flex: 1 1 0;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .exercise-card .fitxa-body {
      flex: 1;
    }
    .exercise-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .exercise-badge {
      display: inline-block;
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 0.4px;
      padding: 3px 9px;
      border-radius: 999px;
      color: #fff;
    }
    .exercise-ref {
      font-size: 11px;
      color: #6a7894;
      font-weight: 600;
    }
    .exercise-card h2 {
      font-size: 15px;
      margin: 0 0 6px 0;
      color: #1f2530;
      line-height: 1.25;
    }
    .exercise-card .fitxa-body p,
    .exercise-card .fitxa-body li,
    .exercise-card .fitxa-body td,
    .exercise-card .fitxa-body th {
      font-size: 13.5px;
      line-height: 1.4;
      margin: 3px 0;
    }
    .exercise-card .fitxa-body h2 { display: none; }
    .exercise-card .fitxa-body table {
      margin: 5px 0;
    }
    .exercise-card .fitxa-body th,
    .exercise-card .fitxa-body td {
      padding: 6px 7px;
      font-size: 12.5px;
    }
    .exercise-card .fitxa-body img.fitxa-illustration {
      max-height: 36mm !important;
      max-width: 40% !important;
      float: right;
      margin: 0 0 6px 8px;
    }
    .exercise-card .fitxa-body img.fitxa-illustration-small {
      max-height: 16mm !important;
      max-width: 20% !important;
    }
    .exercise-card .fitxa-body pre {
      min-height: 42mm;
      font-size: 12px;
      padding: 8px;
      margin: 6px 0 0 0;
    }
    .exercise-card .fitxa-body .reading-text {
      font-size: 13px;
      line-height: 1.45;
    }
    .exercise-card .fitxa-body .write-line {
      height: 24px;
      margin: 4px 0 8px 0;
    }
    .exercise-card .fitxa-body ol > li {
      margin-bottom: 8px;
    }
    .mezcla-page .footer-line {
      margin-top: 6px;
      flex-shrink: 0;
    }
    """


def wrap_fichas_document(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="utf-8">
  <title>{escape(title)}</title>
  <style>{fichas_css()}</style>
</head>
<body>
{body}
</body>
</html>
"""


def header_bar_html(fitxa_num: str, use_english: bool = False) -> str:
    aray_uri = (IMAGES / "aray.png").resolve().as_uri()
    nom = "Name" if use_english else "Nom"
    data = "Date" if use_english else "Data"
    fitxa = "Worksheet" if use_english else "Fitxa"
    return f"""
<div class="fitxa-header-bar">
  <img src="{aray_uri}" class="aray-avatar" alt="Aray">
  <div class="fitxa-fields">
    <div class="field-group"><span>{nom}:</span><span class="field-line field-nom"></span></div>
    <div class="field-group"><span>{data}:</span><span class="field-line field-date"></span></div>
    <span class="fitxa-num">{fitxa} {escape(fitxa_num)}</span>
  </div>
</div>
"""


def preprocess_md(md_text: str, use_english: bool = False, *, skip_header: bool = False) -> str:
    """Neteja el markdown abans de convertir-lo: capçalera, línies resposta, sense ---."""
    text = md_text.replace("\r\n", "\n")

    # Unir metadades trencades (línia Àrea + BEX en dues línies)
    text = re.sub(
        r"(\*\*Àrea:\*\*[^\n]+)\n(\*\*BEX:\*\*[^\n]+)",
        r"\1 · \2",
        text,
    )
    text = re.sub(
        r"(\*\*Area:\*\*[^\n]+)\n(\*\*BEX:\*\*[^\n]+)",
        r"\1 · \2",
        text,
    )
    text = re.sub(
        r"(\*\*Àrea:\*\*[^\n]+)\n(\*\*Difficulty:\*\*[^\n]+)",
        r"\1 · \2",
        text,
    )
    # Arreglar negreta trencada "3r primària  \n**BEX:"
    text = re.sub(r"(\*\*3r primària)\s*\n", r"\1** · ", text)
    text = re.sub(r"(\*\*Difficulty:\*\* [^\n]+)\s*\n\*\*", r"\1 · **", text)

    fitxa_num = "?"
    m_nom = NOM_DATA_RE.search(text)
    if m_nom:
        fitxa_num = m_nom.group(1).lstrip("0") or m_nom.group(1)
        text = NOM_DATA_RE.sub("", text)

    # Treure imatge aray solta (ja va a la barra)
    text = ARAY_IMG_RE.sub("", text)

    # Treure separadors ---
    text = re.sub(r"^---\s*$", "", text, flags=re.MULTILINE)

    # Metadades → paràgraf compacte
    def meta_repl(match: re.Match[str]) -> str:
        line = match.group(0).strip()
        line = re.sub(r"\*\*", "", line)
        line = re.sub(r"\s+", " ", line)
        return f'<p class="fitxa-meta">{escape(line)}</p>'

    text = re.sub(
        r"^\*\*(?:Àrea|Area):.*(?:primària|Difficulty).*$",
        meta_repl,
        text,
        flags=re.MULTILINE,
    )

    # Capçalera nom/data amb camps per escriure (només mode fitxa sencera)
    header = header_bar_html(fitxa_num, use_english=use_english)

    # Línies de resposta amb guions baixos
    def underscore_line_repl(match: re.Match[str]) -> str:
        indent = match.group(1) or ""
        return f"{indent}<div class=\"write-line\"></div>"

    text = re.sub(r"^(\s*)_{8,}\s*$", underscore_line_repl, text, flags=re.MULTILINE)

    # Guions baixos al final d'una línia de pregunta
    text = re.sub(
        r"([^\n]*?\?)\s+_{5,}\s*$",
        r"\1\n<div class=\"write-line\"></div>",
        text,
        flags=re.MULTILINE,
    )
    text = re.sub(
        r"([^\n]*?:)\s+_{5,}([^\n]*)$",
        r"\1 <span class=\"inline-blank\"></span>\2",
        text,
        flags=re.MULTILINE,
    )

    # Treure width/height de les imatges al markdown
    text = re.sub(r"\s+width=\"\d+\"", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+height=\"\d+\"", "", text, flags=re.IGNORECASE)
    text = re.sub(r'\s+width="\d+"', "", text, flags=re.IGNORECASE)
    text = re.sub(r'\s+align="[^"]*"', "", text, flags=re.IGNORECASE)

    # Inserir capçalera després del títol h1 (mode fitxa sencera)
    if not skip_header:
        if text.lstrip().startswith("# "):
            text = re.sub(r"^(# [^\n]+\n)", r"\1\n" + header + "\n", text, count=1)
        else:
            text = header + "\n" + text

    # Blocs de text de lectura compactes (després del títol en negreta)
    text = re.sub(
        r"(<p><strong>[^<]+</strong></p>\n)(<p>(?!</))([^<]{40,}?)</p>",
        r'\1<p class="reading-text">\3</p>',
        text,
        count=0,
    )

    return text.strip()


def fix_image_src(html: str) -> str:
    small_images = {"cat_08_rr.png"}

    def repl(match: re.Match[str]) -> str:
        before, src, after = match.group(1), match.group(2), match.group(3)
        name = Path(src.replace("\\", "/")).name
        path = IMAGES / name
        if not path.exists():
            return match.group(0)
        uri = path.resolve().as_uri()
        if "aray.png" in name.lower():
            before = re.sub(r'\s+width="[^"]*"', "", before, flags=re.I)
            after = re.sub(r'\s+width="[^"]*"', "", after, flags=re.I)
            if "class=" in (before + after).lower():
                return f"<img{before}src=\"{uri}\"{after}>"
            return f'<img{before}src="{uri}" class="aray-avatar"{after}>'
        css_class = "fitxa-illustration"
        if name.lower() in small_images:
            css_class += " fitxa-illustration-small"
        # Eliminar width/height/align residuals
        before = re.sub(r'\s+width="[^"]*"', "", before, flags=re.I)
        before = re.sub(r'\s+height="[^"]*"', "", before, flags=re.I)
        after = re.sub(r'\s+width="[^"]*"', "", after, flags=re.I)
        after = re.sub(r'\s+height="[^"]*"', "", after, flags=re.I)
        after = re.sub(r'\s+align="[^"]*"', "", after, flags=re.I)
        return f'<img{before}src="{uri}" class="{css_class}"{after}>'

    html = re.sub(
        r"<img([^>]*?)src=[\"']([^\"']+)[\"']([^>]*)>",
        repl,
        html,
        flags=re.IGNORECASE,
    )
    return html


def postprocess_html(html: str, *, mezcla: bool = False) -> str:
    html = re.sub(r"<hr\s*/?>", "", html)
    html = re.sub(r"<p>\s*</p>", "", html)
    # Línies buides extra entre llistes numerades
    html = re.sub(r"</ol>\s*<ol start=", "</ol><ol start=", html)
    # Recorda amb estil
    html = re.sub(
        r"<p><strong>Recorda:</strong>",
        r'<p class="fitxa-recorda"><strong>Recorda:</strong>',
        html,
    )
    html = re.sub(
        r"<p><strong>Remember:</strong>",
        r'<p class="fitxa-recorda"><strong>Remember:</strong>',
        html,
    )
    # Notes opcionals imatge
    html = re.sub(
        r"<blockquote>[\s\S]*?Si encara no hi ha la imatge[\s\S]*?</blockquote>",
        "",
        html,
        flags=re.IGNORECASE,
    )
    html = re.sub(
        r"<blockquote>[\s\S]*?If the image is not ready[\s\S]*?</blockquote>",
        "",
        html,
        flags=re.IGNORECASE,
    )
    # Treure write-line dins de <p> (invalid HTML)
    html = re.sub(
        r"<br\s*/?>\s*<br\s*/?>\s*<div class=\"write-line\"></div></p>",
        r'</p><div class="write-line"></div>',
        html,
    )
    html = re.sub(
        r"<div class=\"write-line\"></div></p>",
        r'</p><div class="write-line"></div>',
        html,
    )
    # Doble espai només en fitxes senceres (no en mezcla)
    if not mezcla:
        html = re.sub(
            r'(<li>\s*<p>[^<]+\?</p>)<div class="write-line"></div>',
            r'\1<div class="write-line tall"></div><div class="write-line"></div>',
            html,
        )
    return html


def md_to_html(md_text: str, use_english: bool = False, *, skip_header: bool = False, mezcla: bool = False) -> str:
    prepared = preprocess_md(md_text, use_english=use_english, skip_header=skip_header)
    html = markdown.markdown(
        prepared,
        extensions=["tables", "sane_lists"],
        output_format="html5",
    )
    html = fix_image_src(html)
    return postprocess_html(html, mezcla=mezcla)


def extract_title(md_text: str) -> str:
    for line in md_text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return "Fitxa"


def render_fitxa_page(md_path: Path, area_label: str, index: int) -> str:
    md_text = md_path.read_text(encoding="utf-8")
    use_english = "05_angles" in md_path.as_posix()
    body_html = md_to_html(md_text, use_english=use_english)
    fitxa_num = md_path.stem.split("_")[1] if "_" in md_path.stem else str(index)
    return f"""
    <article class="page fitxa-page">
      <div class="fitxa-body">
        {body_html}
      </div>
      <footer class="footer-line">{escape(area_label)} · Fitxa {escape(fitxa_num.lstrip('0') or fitxa_num)} · Repàs verano Aray</footer>
    </article>
    """


def render_area_cover(area_folder: str, area_label: str) -> str:
    return f"""
    <article class="page area-cover">
      <div class="chapter-pill">Fichas de repaso</div>
      <h1>{escape(area_label)}</h1>
      <p>3r primària · Escola Sant Jordi · Temàtica Roblox</p>
      <p><strong>{escape(area_folder)}</strong></p>
    </article>
    """


def collect_fitxa_files(area_dir: Path) -> list[Path]:
    files = sorted(area_dir.glob("fitxa_*.md"))
    return sorted(files, key=lambda p: int(re.search(r"fitxa_(\d+)", p.stem).group(1)))


def estimate_weight(md_body: str) -> float:
    w = 1.2
    w += len(re.findall(r"\|", md_body)) * 0.11
    w += (len(re.findall(r"!\[", md_body)) + len(re.findall(r"<img", md_body, re.I))) * 2.0
    w += len(re.findall(r"^\d+\.\s", md_body, re.M)) * 0.38
    w += len(re.findall(r"_{6,}", md_body)) * 0.32
    w += len(re.findall(r"^[-*]\s+\[[ x]\]", md_body, re.M)) * 0.28
    if "```" in md_body or "┌─" in md_body:
        w += 3.8
    n_chars = len(md_body)
    if n_chars > 320:
        w += (n_chars - 320) / 380
    if n_chars > 650:
        w += 0.8
    return round(w, 1)


def parse_fitxa_blocks(md_path: Path, area_folder: str, area_label: str) -> list[ExerciseBlock]:
    raw = md_path.read_text(encoding="utf-8")
    m = re.search(r"fitxa_(\d+)", md_path.stem)
    fitxa_num = (m.group(1).lstrip("0") or m.group(1)) if m else "?"
    fitxa_title = extract_title(raw)
    use_english = area_folder == "05_angles"
    short, color = AREA_SHORT[area_folder]

    text = raw
    text = re.sub(r"^# .+\n", "", text)
    text = re.sub(r"^\*\*(?:Àrea|Area):.*$", "", text, flags=re.M)
    text = re.sub(r"^\*\*BEX:\*\*.*$", "", text, flags=re.M)
    text = re.sub(r"^\*\*Difficulty:\*\*.*$", "", text, flags=re.M)
    text = re.sub(r"^\*\*Dificultat:\*\*.*$", "", text, flags=re.M)
    text = re.sub(r"^\*\*Idioma:\*\*.*$", "", text, flags=re.M)
    text = NOM_DATA_RE.sub("", text)
    text = ARAY_IMG_RE.sub("", text)
    text = re.sub(r"^---\s*$", "", text, flags=re.M)
    text = re.sub(r"\n\*\*(?:Recorda|Remember):\*\*.*\Z", "", text, flags=re.S)
    text = re.sub(r"> \*\(Si encara.*?\)\*\n?", "", text, flags=re.I)
    text = re.sub(r"> \*\(If the image.*?\)\*\n?", "", text, flags=re.I)
    text = text.strip()

    parts = re.split(r"^## ", text, flags=re.MULTILINE)
    parts = [p.strip() for p in parts if p.strip()]

    blocks: list[ExerciseBlock] = []
    if not parts:
        return blocks

    pending_prefix = ""

    for part in parts:
        lines = part.split("\n", 1)
        section_title = lines[0].strip()
        body = lines[1].strip() if len(lines) > 1 else ""

        if section_title.startswith("!["):
            pending_prefix = section_title + ("\n\n" + body if body else "")
            continue
        if not section_title or section_title.startswith("**"):
            if body:
                pending_prefix += ("\n\n" if pending_prefix else "") + section_title + "\n" + body
            continue
        if section_title.lower().startswith("bex:"):
            continue

        if pending_prefix:
            body = pending_prefix + ("\n\n" + body if body else "")
            pending_prefix = ""

        if not body and estimate_weight(section_title) < 1.5:
            continue
        weight = estimate_weight(body if body else section_title)
        blocks.append(
            ExerciseBlock(
                area_folder=area_folder,
                area_label=area_label,
                area_short=short,
                area_color=color,
                fitxa_num=fitxa_num,
                fitxa_title=fitxa_title,
                section_title=section_title,
                md_body=body,
                weight=weight,
                use_english=use_english,
            )
        )
    return merge_tiny_blocks(blocks)


def merge_tiny_blocks(blocks: list[ExerciseBlock]) -> list[ExerciseBlock]:
    """Fusiona seccions buides (p. ex. «Rodea els adjectius») amb l'anterior."""
    if not blocks:
        return blocks
    out: list[ExerciseBlock] = [blocks[0]]
    for block in blocks[1:]:
        if block.weight <= 1.6 and len(block.md_body) < 180:
            prev = out[-1]
            combined = f"{prev.md_body}\n\n### {block.section_title}\n\n{block.md_body}"
            out[-1] = ExerciseBlock(
                area_folder=prev.area_folder,
                area_label=prev.area_label,
                area_short=prev.area_short,
                area_color=prev.area_color,
                fitxa_num=prev.fitxa_num,
                fitxa_title=prev.fitxa_title,
                section_title=prev.section_title,
                md_body=combined,
                weight=estimate_weight(combined),
                use_english=prev.use_english,
            )
        else:
            out.append(block)
    return out


def build_mezcla_pages() -> list[list[ExerciseBlock]]:
    """Per cada número de fitxa (1–10), agrupa exercicis de les 5 àrees i empaqueta."""
    all_pages: list[list[ExerciseBlock]] = []
    for n in range(1, 11):
        batch: list[ExerciseBlock] = []
        for area_folder, area_label, _ in AREAS:
            area_dir = FICHAS / area_folder
            for md_path in collect_fitxa_files(area_dir):
                m = re.search(r"fitxa_(\d+)", md_path.stem)
                if m and int(m.group(1)) == n:
                    batch.extend(parse_fitxa_blocks(md_path, area_folder, area_label))
                    break
        if batch:
            all_pages.extend(pack_exercises(batch))
    return all_pages


def pack_exercises(blocks: list[ExerciseBlock]) -> list[list[ExerciseBlock]]:
    """Agrupa 2–3 exercicis per pàgina; manté junts els de la mateixa fitxa."""
    if not blocks:
        return []

    units: list[list[ExerciseBlock]] = []
    current: list[ExerciseBlock] = [blocks[0]]
    for block in blocks[1:]:
        if (
            block.area_folder == current[0].area_folder
            and block.fitxa_num == current[0].fitxa_num
        ):
            current.append(block)
        else:
            units.append(current)
            current = [block]
    units.append(current)

    pages: list[list[ExerciseBlock]] = []
    page: list[ExerciseBlock] = []
    total = 0.0

    for unit in units:
        unit_weight = sum(b.weight for b in unit)

        if unit_weight >= HEAVY_EXERCISE:
            if page:
                pages.append(page)
                page = []
                total = 0.0
            pages.append(unit)
            continue

        if page and (
            total + unit_weight > PAGE_MAX_WEIGHT + 1.8
            or len(page) + len(unit) > 3
        ):
            pages.append(page)
            page = []
            total = 0.0

        page.extend(unit)
        total += unit_weight

        if len(page) >= 3 or total >= PAGE_MAX_WEIGHT:
            pages.append(page)
            page = []
            total = 0.0

    if page:
        pages.append(page)

    return pages


def header_bar_page_html(page_num: int) -> str:
    aray_uri = (IMAGES / "aray.png").resolve().as_uri()
    return f"""
<div class="fitxa-header-bar">
  <img src="{aray_uri}" class="aray-avatar" alt="Aray">
  <div class="fitxa-fields">
    <div class="field-group"><span>Nom:</span><span class="field-line field-nom"></span></div>
    <div class="field-group"><span>Data:</span><span class="field-line field-date"></span></div>
  </div>
</div>
<div class="mezcla-page-head">
  <span class="chapter-pill">Repàs mesclat · Roblox</span>
  <span class="mezcla-page-num">Pàgina {page_num}</span>
</div>
"""


def render_exercise_card(ex: ExerciseBlock) -> str:
    body_html = md_to_html(ex.md_body, use_english=ex.use_english, skip_header=True, mezcla=True)
    heavy = " heavy-card" if ex.weight >= HEAVY_EXERCISE else ""
    return f"""
<section class="exercise-card{heavy}">
  <div class="exercise-card-header">
    <span class="exercise-badge" style="background:{ex.area_color}">{escape(ex.area_short)}</span>
    <span class="exercise-ref">{escape(ex.area_label)} · Fitxa {escape(ex.fitxa_num)}</span>
  </div>
  <h2>{escape(ex.section_title)}</h2>
  <div class="fitxa-body">{body_html}</div>
</section>
"""


def render_mezcla_page(page_blocks: list[ExerciseBlock], page_num: int) -> str:
    cards = "\n".join(render_exercise_card(ex) for ex in page_blocks)
    areas = " · ".join(dict.fromkeys(ex.area_short for ex in page_blocks))
    return f"""
<article class="page mezcla-page">
  {header_bar_page_html(page_num)}
  <div class="mezcla-stack">
    {cards}
  </div>
  <footer class="footer-line">Repàs mesclat · Pàgina {page_num} · {escape(areas)}</footer>
</article>
"""


def wrap_mezcla_document(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="utf-8">
  <title>{escape(title)}</title>
  <style>{fichas_css()}{mezcla_css()}</style>
</head>
<body>
{body}
</body>
</html>
"""


def build_mezcla_html() -> str:
    packed = build_mezcla_pages()
    cover = """
<article class="page area-cover">
  <div class="chapter-pill">Fichas de repaso</div>
  <h1>Repàs mesclat</h1>
  <p>2–3 exercicis per pàgina · Mates, Castellano, Català, Medi, Anglès</p>
  <p>3r primària · Aray · Temàtica Roblox</p>
</article>
"""
    pages = [cover]
    for num, page_blocks in enumerate(packed, start=1):
        pages.append(render_mezcla_page(page_blocks, num))
    return wrap_mezcla_document("Fichas repaso · Mezcla", "\n".join(pages))


def build_area_html(area_folder: str, area_label: str) -> str:
    area_dir = FICHAS / area_folder
    pages = [render_area_cover(area_folder, area_label)]
    for idx, md_path in enumerate(collect_fitxa_files(area_dir), start=1):
        pages.append(render_fitxa_page(md_path, area_label, idx))
    return wrap_fichas_document(f"Fitxes · {area_label}", "\n".join(pages))


def build_all_html() -> str:
    pages: list[str] = [
        """
    <article class="page area-cover">
      <div class="chapter-pill">Pack complet</div>
      <h1>Fichas de repaso · Verano Aray</h1>
      <p>50 fitxes · 5 àrees · 3r primària</p>
      <p>Mates · Castellano · Català · Medi · Anglès</p>
    </article>
    """
    ]
    for area_folder, area_label, _ in AREAS:
        pages.append(render_area_cover(area_folder, area_label))
        area_dir = FICHAS / area_folder
        for idx, md_path in enumerate(collect_fitxa_files(area_dir), start=1):
            pages.append(render_fitxa_page(md_path, area_label, idx))
    return wrap_fichas_document("Fichas de repaso · Pack complet", "\n".join(pages))


def build_solucionari_html() -> str:
    md_path = FICHAS / "solucionari_adults.md"
    body = md_to_html(md_path.read_text(encoding="utf-8"))
    page = f"""
    <article class="page fitxa-page" style="height:auto;max-height:none;overflow:visible;">
      <div class="chapter-pill">Només adults</div>
      <div class="fitxa-body">{body}</div>
      <footer class="footer-line">Solucionari · No imprimir amb les fitxes d'Aray</footer>
    </article>
    """
    return wrap_fichas_document("Solucionari adults · Fichas repaso", page)


def html_to_pdf(html_path: Path, pdf_path: Path) -> bool:
    edge = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
    if not edge.exists():
        edge = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    if not edge.exists():
        return False
    url = html_path.resolve().as_uri()
    cmd = [
        str(edge),
        "--headless=new",
        "--disable-gpu",
        f"--print-to-pdf={pdf_path.resolve()}",
        "--no-pdf-header-footer",
        url,
    ]
    subprocess.run(cmd, check=True, capture_output=True, timeout=120)
    return pdf_path.exists()


def write_pdf(html_content: str, html_path: Path, pdf_path: Path) -> bool:
    html_path.write_text(html_content, encoding="utf-8")
    print(f"HTML -> {html_path}")
    if html_to_pdf(html_path, pdf_path):
        print(f"PDF  -> {pdf_path}")
        return True
    print(f"PDF  -> (manual) Obre {html_path} i Imprimir > Guardar com PDF")
    return False


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    generated: list[Path] = []

    for area_folder, area_label, pdf_name in AREAS:
        html_content = build_area_html(area_folder, area_label)
        html_path = OUT / f"{area_folder}.html"
        pdf_path = OUT / pdf_name
        write_pdf(html_content, html_path, pdf_path)
        if pdf_path.exists():
            generated.append(pdf_path)

    all_html = build_all_html()
    all_html_path = OUT / "fichas_repaso_completo.html"
    all_pdf_path = OUT / "fichas_repaso_completo.pdf"
    write_pdf(all_html, all_html_path, all_pdf_path)
    if all_pdf_path.exists():
        generated.append(all_pdf_path)

    sol_html = build_solucionari_html()
    sol_html_path = OUT / "solucionari_adults.html"
    sol_pdf_path = OUT / "solucionari_adults.pdf"
    write_pdf(sol_html, sol_html_path, sol_pdf_path)
    if sol_pdf_path.exists():
        generated.append(sol_pdf_path)

    mezcla_html = build_mezcla_html()
    mezcla_html_path = OUT / "fichas_mezcla.html"
    mezcla_pdf_path = OUT / "fichas_mezcla.pdf"
    write_pdf(mezcla_html, mezcla_html_path, mezcla_pdf_path)
    if mezcla_pdf_path.exists():
        generated.append(mezcla_pdf_path)

    packed = build_mezcla_pages()
    print(f"Mezcla: {len(packed)} pàgines d'exercicis (+ portada)")
    print(f"\nFet: {len(generated)} PDF(s) a {OUT}")


if __name__ == "__main__":
    main()
