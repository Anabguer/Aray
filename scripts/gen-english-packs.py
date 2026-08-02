"""Generate feinetas/ingles/*.json from frozen editorial Markdown."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EDITORIAL = ROOT / "feinetas" / "editorial"
OUT = ROOT / "feinetas" / "ingles"

FREQ = {
    "Muy frecuente": "muy_frecuente",
    "Frecuente": "frecuente",
    "Menos frecuente": "poco_frecuente",
    "Poco frecuente": "poco_frecuente",
}


def parse_bank(
    path: Path,
    pack_id: str,
    title: str,
    owner: str,
    topic_family: str,
    categories: set[str],
) -> dict:
    text = path.read_text(encoding="utf-8")
    parts = re.split(r"\n## Inglés\n", text)[1:]
    lemmas: list[dict] = []
    for part in parts:
        lines = part.splitlines()
        i = 0
        while i < len(lines) and not lines[i].strip():
            i += 1
        lemma = lines[i].strip()
        i += 1
        blocks: dict[str, str] = {}
        key: str | None = None
        buf: list[str] = []

        def flush() -> None:
            nonlocal key, buf
            if key is not None:
                blocks[key] = "\n".join(buf).strip()
            buf = []

        for line in lines[i:]:
            if line.startswith("## "):
                flush()
                key = line[3:].strip()
                if key == "Inglés":
                    break
                continue
            if key is not None:
                buf.append(line)
        flush()

        gloss = blocks.get("Glosa", "")
        cat = blocks.get("Categoría", "")
        freq_raw = blocks.get("Frecuencia", "")
        freq = FREQ.get(freq_raw)
        img_raw = blocks.get("Imagen recomendable", "").strip().lower()
        notes = blocks.get("Observaciones") or None
        if not freq:
            raise SystemExit(f"bad freq for {lemma!r}: {freq_raw!r}")
        if cat not in categories:
            raise SystemExit(f"bad cat {cat!r} for {lemma!r}")
        slug = lemma.lower().replace(" ", "-")
        short = pack_id.replace("ingles-", "")
        lid = f"{short}-{slug}"
        item: dict = {
            "id": lid,
            "lemma": lemma,
            "glossEs": gloss,
            "category": cat,
            "frequency": freq,
            "image": {"recommended": img_raw.startswith("s"), "ref": None},
        }
        if notes:
            item["notes"] = notes
        lemmas.append(item)

    return {
        "schemaVersion": 1,
        "pack": {
            "id": pack_id,
            "title": title,
            "ownerBank": owner,
            "topicFamily": topic_family,
            "level": "3-primaria",
            "locale": "en-GB",
            "revisionStatus": "frozen",
            "contentVersion": 1,
            "sourceEditorialPhase": "ingles-editorial-v1",
        },
        "lemmas": lemmas,
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    banks = [
        (
            EDITORIAL / "INGLES_COLOURS_NUMBERS.md",
            "ingles-colours-numbers",
            "Colours & Numbers",
            "INGLES_COLOURS_NUMBERS.md",
            "colours-numbers",
            {"Colours", "Numbers"},
            "colours-numbers.json",
        ),
        (
            EDITORIAL / "INGLES_SCHOOL.md",
            "ingles-school",
            "School",
            "INGLES_SCHOOL.md",
            "school",
            {"Places", "People", "Objects"},
            "school.json",
        ),
        (
            EDITORIAL / "INGLES_FAMILY.md",
            "ingles-family",
            "Family",
            "INGLES_FAMILY.md",
            "family",
            {"Family group", "Core family", "Extended family"},
            "family.json",
        ),
    ]
    total = 0
    for path, pid, title, owner, topic, cats, fname in banks:
        pack = parse_bank(path, pid, title, owner, topic, cats)
        (OUT / fname).write_text(
            json.dumps(pack, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        n = len(pack["lemmas"])
        total += n
        print(fname, n)
    print("TOTAL", total)


if __name__ == "__main__":
    main()
