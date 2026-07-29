"""Extrae muestras de texto y tipos de ejercicio de PDFs en documentos/Temas."""
import json
import re
from pathlib import Path

import pypdf

ROOT = Path(__file__).resolve().parents[1] / "documentos" / "Temas"
OUT = Path(__file__).resolve().parents[1] / "banc_exercicis" / "_extraccio_raw"
OUT.mkdir(parents=True, exist_ok=True)

AREA_MAP = {
    "Ingles": "angles",
    "Lengua": "castellano",
    "Mates": "mates",
    "Medi y social": "medi",
    "Catala": "catala",
    "Català": "catala",
}

PATTERNS = [
    (r"completa", "completar"),
    (r"relaciona", "relacionar"),
    (r"marca", "marcar"),
    (r"rode(a|o)", "rodear"),
    (r"verdader|v o f|v/f", "verdadero_falso"),
    (r"ordena", "ordenar"),
    (r"escribe|escriu", "escriure"),
    (r"calcula|calcul", "calcul"),
    (r"problema", "problema"),
    (r"comprensi", "comprensio"),
    (r"lee|llegeix", "lectura"),
    (r"observa", "observar"),
    (r"dibuja|dibuix", "dibuixar"),
    (r"encerc", "encercar"),
    (r"sublin", "subratllar"),
    (r"opción|opcio", "opcio_multiple"),
    (r"signe correcte|>\s*<\s*=", "comparar"),
]


def guess_types(text: str) -> list[str]:
    found = []
    for pat, label in PATTERNS:
        if re.search(pat, text, re.I):
            found.append(label)
    return list(dict.fromkeys(found))


def main() -> None:
    summary = []
    for area_dir in sorted(ROOT.iterdir()):
        if not area_dir.is_dir():
            continue
        area = AREA_MAP.get(area_dir.name, area_dir.name.lower())
        for pdf in sorted(area_dir.glob("*.pdf")):
            entry = {
                "file": str(pdf.relative_to(ROOT)),
                "area": area,
                "pages": 0,
                "samples": [],
                "types": [],
                "error": None,
            }
            try:
                reader = pypdf.PdfReader(str(pdf))
                entry["pages"] = len(reader.pages)
                indices = list(range(min(30, len(reader.pages))))
                if len(reader.pages) > 30:
                    indices += list(range(30, min(60, len(reader.pages))))
                for i in indices:
                    text = re.sub(r"\s+", " ", (reader.pages[i].extract_text() or "")).strip()
                    if len(text) < 40:
                        continue
                    types = guess_types(text)
                    entry["types"] = sorted(set(entry["types"]) | set(types))
                    if len(entry["samples"]) < 12 and len(text) > 80:
                        entry["samples"].append(
                            {"page": i + 1, "types": types, "preview": text[:400]}
                        )
            except Exception as exc:
                entry["error"] = str(exc)

            summary.append(entry)

            try:
                reader = pypdf.PdfReader(str(pdf))
                chunks = []
                for i in range(min(15, len(reader.pages))):
                    t = reader.pages[i].extract_text() or ""
                    if t.strip():
                        chunks.append(f"--- PAGE {i + 1} ---\n{t}")
                safe = re.sub(r"[^\w\-]+", "_", pdf.stem)[:60]
                (OUT / f"{area}_{safe}.txt").write_text(
                    "\n\n".join(chunks), encoding="utf-8", errors="replace"
                )
            except Exception:
                pass

    (OUT / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Processed {len(summary)} PDFs -> {OUT}")


if __name__ == "__main__":
    main()
