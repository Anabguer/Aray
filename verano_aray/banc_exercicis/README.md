# Banc d'exercicis (BEX)

Catàleg reutilitzable d'exercicis extrets de `documentos/Temas/`, materials reals d'Aray i MDS.

**Objectiu:** varietat — no repetir sempre el mateix tipus (p. ex. «escriu el signe > < =») sense perdre el nivell de 3r.

---

## Com funciona

| Fitxer | Funció |
|--------|--------|
| [`indice_pdfs.md`](indice_pdfs.md) | Inventari de tots els PDFs i tipus detectats |
| [`01_catala.md`](01_catala.md) | Exercicis català (pendent: 4 PDFs que passaràs) |
| [`02_castellano.md`](02_castellano.md) | Exercicis castellà |
| [`03_angles.md`](03_angles.md) | Exercicis anglès |
| [`04_mates.md`](04_mates.md) | Exercicis mates |
| [`05_medi.md`](05_medi.md) | Exercicis medi / ciències |
| [`guia_estil_problemes.md`](guia_estil_problemes.md) | Problemes llargs estil cole vs matmat16 |
| [`registre_us.md`](registre_us.md) | Què s'ha usat en cada missió / pàgina |
| `_extraccio_raw/` | Text brut extret dels PDFs (automàtic) |

---

## Format de cada exercici

```markdown
### MAT-012 · comparar_nombres · ⭐⭐
- **Font:** RefmatesSm3.pdf · p.1 · SM 3r
- **Tema:** numeració / comparació
- **Estat:** `disponible` | `usat` | `reservat`
- **Usat a:** cap03_m02_reto2 *(si aplica)*
- **Enunciat (resum):** Compara 561 i 651; 87999 i 88989…
- **Per què és bo:** context carrera bicicletes / taula descomposició — no només graella buida
```

### Estats

| Estat | Significat |
|-------|------------|
| `disponible` | Es pot usar en una fitxa nova |
| `usat` | Ja ha sortit en un capítol / missió |
| `reservat` | Tipus ja repetit massa — buscar alternativa abans de reutilitzar |

---

## Regles de varietat

1. **No repetir el mateix tipus** en dues missions seguides del mateix capítol (si es pot).
2. Si ja vam fer **comparar signes** → prioritzar **carrera/ordinals**, **taula descomposició**, **problema**, **unir operacions iguals**.
3. Si ja vam fer **càlcul mental en graella** → provar **completar sumand**, **doble/triple**, **cadena amb parentesi**.
4. Marcar `usat` **sempre** que un ID entri en una missió.
5. Els exercicis es **adapten** al ganxo (Arena Cuchillos), però el **nucli** ve del banc.

---

## Actualitzar el banc

```bash
python tools/extract_pdf_catalog.py
```

Això regenera `_extraccio_raw/summary.json` i mostres de text per PDF.

Després: afegir entrades noves als fitxers `0X_*.md` amb ID correlatiu.

---

## Relació amb MDS

- **MDS** = fitxes ja adaptades per Aray (plantilles curtes).
- **BEX** = inventari ampli de fonts PDF per triar i marcar.

Quan un exercici del BEX entra en una missió, es crea la versió adaptada i es marca al `registre_us.md`.

## Carpeta Temas

PDFs de referència: `documentos/Temas/` (Castellano, Mates, Medi, Anglès, **Catala** pendent).

