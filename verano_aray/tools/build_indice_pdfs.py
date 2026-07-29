import json
from pathlib import Path

summary = json.loads(
    Path("banc_exercicis/_extraccio_raw/summary.json").read_text(encoding="utf-8")
)
lines = [
    "# Índice de PDFs en documentos/Temas",
    "",
    "Generado automáticamente. **30 PDFs** procesados.",
    "",
    "| Área | Archivo | Páginas | Tipos detectados |",
    "|------|---------|----------|------------------|",
]
for e in summary:
    types = ", ".join(e["types"]) if e["types"] else "—"
    note = f" ⚠️ {e['error']}" if e["error"] else ""
    lines.append(f"| {e['area']} | `{e['file']}` | {e['pages']} | {types}{note} |")

lines += [
    "",
    "## Carpetas",
    "",
    "| Carpeta | PDFs |",
    "|---------|------|",
]
from collections import Counter
c = Counter(e["area"] for e in summary)
for area, n in sorted(c.items()):
    lines.append(f"| {area} | {n} |")

lines += [
    "",
    "**Català:** carpeta `documentos/Temas/Catala/` creada — pendent que hi deixis els 4 PDFs.",
    "",
    "Regenerar: `python tools/extract_pdf_catalog.py`",
]

Path("banc_exercicis/indice_pdfs.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("written", len(summary))
