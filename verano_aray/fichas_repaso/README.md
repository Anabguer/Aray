# Fichas de repaso · Verano Aray

Repaso de **3.º primaria** (Escola Sant Jordi), estilo **ficha del cole**, sin narrativa dominante.

## Idiomes (com al cole — `regles_temari.md`)

| Carpeta | Àrea | Idioma de la fitxa |
|---------|------|-------------------|
| `01_mates/` | Matemàtiques | **Català** |
| `02_castellano/` | Llengua castellana | **Castellà** |
| `03_catala/` | Llengua catalana | **Català** |
| `04_medi/` | Coneixement del medi | **Català** |
| `05_angles/` | Llengua estrangera | **Anglès** |

**No** barregem idiomes dins la mateixa fitxa (excepte anglès, que és la matèria).

## Objectiu

- **~10 fitxes per àrea** (50 en total), varietat de tipus d'exercici
- Contingut adaptat del banc **BEX** (`banc_exercicis/`) — números i textos nous, no còpia literal
- Il·lustracions: les generes tu amb els prompts de [`prompts_imatges.md`](prompts_imatges.md)
- Imatges guardades a: `imatges/`

## Estructura d'una fitxa

```
Capçalera: Nom · Data · Fitxa N
Recorda: (regla breu, estil Voramar/SM)
2–4 exercicis variats
Espai per respondre (línies / caselles / taula)
Peu opcional: dificultat ⭐
```

## Estat

| Àrea | Fitxes previstes | Fitxes escrites | Imatges |
|------|------------------|-----------------|---------|
| Mates | 10 | **10** | ✅ |
| Castellano | 10 | **10** | ✅ |
| Català | 10 | **10** | ✅ |
| Medi | 10 | **10** | ✅ |
| Anglès | 10 | **10** | ✅ |

Índex detallat: [`indice_fitxes.md`](indice_fitxes.md)  
Solucions i explicacions (només adults): [`solucionari_adults.md`](solucionari_adults.md)

## Capçalera Aray

Totes les fitxes inclouen `aray.png` (avatar Roblox d'Aray) a la part superior. Imatge a: `imatges/aray.png`.

## Flux de treball

1. ~~Generar imatges~~ → `imatges/` ✅
2. ~~Escriure fitxes `.md`~~ → carpetes `01_mates/` … `05_angles/` ✅
3. **PDF per imprimir:** `python generate_fichas_repaso.py` → `salida/fichas_repaso/`

### PDFs generats

| Fitxer | Contingut |
|--------|-----------|
| `01_mates.pdf` | 10 fitxes mates + portada |
| `02_castellano.pdf` | 10 fitxes castellano |
| `03_catala.pdf` | 10 fitxes català |
| `04_medi.pdf` | 10 fitxes medi |
| `05_angles.pdf` | 10 fitxes anglès |
| `fichas_mezcla.pdf` | **Recomanat per imprimir** · 2–3 exercicis/pàgina, àrees mesclades |
| `fichas_repaso_completo.pdf` | Les 50 fitxes senceres (1 fitxa = 1 pàgina) |
| `solucionari_adults.pdf` | Respostes i explicacions (només per tu) |

Per regenerar després d'editar una fitxa: `python generate_fichas_repaso.py` des de `verano_aray/`.

### Word editable (per moure exercicis tu mateix)

```bash
python generate_fichas_word.py
```

| Fitxer | Contingut |
|--------|-----------|
| `fichas_mezcla.docx` | **Recomanat** · 2–3 exercicis/pàgina, àrees mesclades |
| `fichas_por_asignatura.docx` | Les 50 fitxes agrupades per matèria |

Els `.docx` surten a la mateixa carpeta `salida/fichas_repaso/`. Pots canviar l'ordre, afegir salts de pàgina i ajustar mides d'imatge lliurement.
