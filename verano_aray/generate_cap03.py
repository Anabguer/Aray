"""Genera HTML/PDF imprimible del Capítulo 3 · Pack Legendario (pág. 0 + misiones 1 y 2)."""
from __future__ import annotations

import subprocess
from html import escape
from pathlib import Path

from generate_week1_special import document_css, render_boxes, render_lines, wrap_document


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "salida" / "cap03"

KNIVES = [
    ("Nebula Blade", "1"),
    ("Crystal Fang", "2"),
    ("Shadow Edge", "3"),
    ("Inferno Strike", "4"),
    ("Pixel Storm", "5"),
]

STORY_LINES = [
    "Aray se despertó un sábado por la mañana con la cabeza llena de imágenes confusas.",
    "En su sueño aparecían cuchillos de muchos colores, pruebas misteriosas y Luca corriendo delante de él por un pasillo brillante.",
    "Miró el reloj de la pared: eran las nueve en punto.",
    "Se levantó, se vistió con ropa cómoda y bajó a la cocina.",
    "Su madre le había dejado el desayuno preparado: leche, tostadas y una pieza de fruta.",
    "A las nueve y media terminó de desayunar, se lavó los dientes y ayudó a recoger la mesa.",
    "A las nueve y cuarenta y cinco hizo la cama y ordenó los libros de su estantería.",
    "Después sacó la basura y regó las plantas del balcón.",
    "A las once en punto encendió el ordenador y entró en Roblox.",
    "Vio un aviso grande: un nuevo evento en Arena de Cuchillos.",
    "El evento se llamaba Pack Legendario de los Cinco Cuchillos.",
    "En pantalla brillaban: Nebula Blade, Crystal Fang, Shadow Edge, Inferno Strike y Pixel Storm.",
    "Para conseguirlos había que superar cinco pruebas muy difíciles.",
    "Aray llamó a Luca, que sabe mucho sobre cuchillos raros en el juego.",
    "A las once y diez entraron juntos al evento.",
    "La pantalla mostró un mapa con cinco salas, una para cada cuchillo.",
    "Aray y Luca se prepararon para empezar la primera prueba.",
]


def pack_cover_art() -> str:
    rooms = ""
    colors = ["#6b8cff", "#4dd4ff", "#4a4a5a", "#ff6b3d", "#7ecbff"]
    for i, color in enumerate(colors):
        x = 48 + i * 168
        rooms += f'<rect x="{x}" y="120" width="130" height="90" rx="14" fill="{color}" opacity="0.85"/>'
        rooms += f'<text x="{x + 65}" y="172" text-anchor="middle" font-size="13" font-family="Arial" fill="#fff">Sala {i + 1}</text>'
    return f"""
    <svg viewBox="0 0 920 260" class="cover-art" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="bg3" x1="0" x2="1">
          <stop offset="0%" stop-color="#dfe8ff"/>
          <stop offset="100%" stop-color="#ffe8d4"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="920" height="260" rx="24" fill="url(#bg3)"/>
      <rect x="40" y="36" width="200" height="56" rx="16" fill="#1e4db7"/>
      <text x="58" y="72" font-size="22" font-family="Arial" fill="#fff" font-weight="700">Pack Legendario</text>
      {rooms}
      <rect x="314" y="42" width="170" height="182" rx="26" fill="#24355a"/>
      <circle cx="399" cy="92" r="32" fill="#ffd7b5"/>
      <path d="M368 86 Q399 36 430 86" fill="#1a2440"/>
      <rect x="369" y="124" width="60" height="78" rx="16" fill="#3f74ff"/>
      <rect x="430" y="124" width="44" height="78" rx="16" fill="#2d9cff"/>
      <circle cx="620" cy="200" r="22" fill="#f0d0ac"/>
      <circle cx="670" cy="200" r="22" fill="#f0d0ac"/>
      <rect x="720" y="48" width="160" height="72" rx="16" fill="#fff"/>
      <text x="740" y="78" font-size="20" font-family="Arial" fill="#1f2530">Capítulo 3</text>
      <text x="740" y="102" font-size="15" font-family="Arial" fill="#55627a">Arena de Cuchillos</text>
    </svg>
    """


def knife_progress(done: int) -> str:
    rows = []
    for idx, (name, _) in enumerate(KNIVES, start=1):
        mark = "✅" if idx <= done else "⬜"
        bold = " font-weight:700;" if idx == done else ""
        rows.append(f"<tr><td style='{bold}'>{escape(name)}</td><td class='vf-cell'>{mark}</td></tr>")
    return f"""
    <table class="suspect-table">
      <thead><tr><th>Cuchillo</th><th>Estado</th></tr></thead>
      <tbody>{''.join(rows)}</tbody>
    </table>
    <p><strong>CUCHILLOS CONSEGUIDOS:</strong> {done} / 5</p>
    """


def mission_banner(num: int, title: str, knife: str, intro: str) -> str:
    return f"""
    <section class="hero">
      <div class="section-badge">Prueba {num}</div>
      <h3>🗡️ {escape(title)}</h3>
      <p>{escape(intro)}</p>
      <p><strong>Cuchillo:</strong> {escape(knife)}</p>
    </section>
    """


def reto_header(num: int, title: str) -> str:
    return f'<h3 style="margin-top:12px;">RETO {num} · {escape(title)}</h3>'


def write_lines(count: int = 1) -> str:
    return "".join('<div class="write-line"></div>' for _ in range(count))


def vf_table(statements: list[str]) -> str:
    rows = "".join(
        f"<tr><td>{escape(s)}</td><td class='vf-cell'></td></tr>" for s in statements
    )
    return f"<table class='vf-table'><thead><tr><th>Enunciado</th><th>V/F</th></tr></thead><tbody>{rows}</tbody></table>"


def choice_options(options: list[str]) -> str:
    opts = "".join(
        f'<div class="choice-option"><span class="choice-mark"></span><span>{escape(o)}</span></div>'
        for o in options
    )
    return f'<div class="choice-group">{opts}</div>'


def render_intro_page() -> str:
    sala_rows = "".join(
        f"<tr><td>Sala {n}</td><td>{escape(name)}</td><td class='vf-cell'></td></tr>"
        for n, (name, _) in enumerate(KNIVES, start=1)
    )
    return f"""
    <article class="page cover-page">
      <section class="hero">
        <div class="chapter-pill">Capítulo 3</div>
        <h1>El Pack Legendario de los Cinco Cuchillos</h1>
        <p class="subtitle">Operación Arena de Cuchillos · Roblox · Aray y Luca · 3.º primaria</p>
        {pack_cover_art()}
      </section>
      <section class="panel">
        <h3>Página 0 · La historia</h3>
        <p class="section-intro">Lee el texto con calma. Después harás las pruebas del pack (fichas del cole con temática del juego).</p>
        {render_lines(STORY_LINES, numbered=True)}
      </section>
      <section class="panel">
        <h3>Mapa del pack · cinco salas</h3>
        <table class="suspect-table">
          <thead><tr><th>Sala</th><th>Cuchillo</th><th>Conseguido</th></tr></thead>
          <tbody>{sala_rows}</tbody>
        </table>
      </section>
      <section class="panel decoder-panel">
        <h3>Panel de progreso</h3>
        {knife_progress(0)}
        <p>Cada misión te ayuda a conseguir <strong>un cuchillo</strong>. Repasamos mates, castellano, català, medi e inglés.</p>
      </section>
      <footer class="footer-line">Página 0 · Lectura inicial · Cuchillos: ☆☆☆☆☆</footer>
    </article>
    """


def render_mission1_page1() -> str:
    orden_rows = [
        "Ven en pantalla el mapa con las cinco pruebas del pack.",
        "Aray se despierta y mira el reloj.",
        "Termina el desayuno y ayuda a recoger la mesa.",
        "Enciende el ordenador y ve el aviso del evento.",
        "Hace la cama, saca la basura y riega las plantas.",
        "Llama a Luca y entran juntos al evento.",
    ]
    orden_html = "".join(
        f"<tr><td class='vf-cell'></td><td>{escape(t)}</td></tr>" for t in orden_rows
    )
    questions = [
        "¿Qué día de la semana ocurre la historia?",
        "¿Qué vio Aray en su sueño? (al menos dos cosas)",
        "¿Cómo se llama el juego de Roblox donde aparece el evento?",
        "¿Cómo se llama el evento del Pack Legendario?",
        "Escribe los cinco nombres de los cuchillos.",
        "¿Por qué Aray llamó a Luca?",
        "¿Qué aparece en la pantalla cuando entran al evento?",
    ]
    q_html = "".join(
        f'<p><strong>{i}.</strong> {escape(q)}</p>{write_lines(1 if i < 5 else 2)}'
        for i, q in enumerate(questions, start=1)
    )
    return f"""
    <article class="page">
      <header class="page-head">
        <div class="chapter-pill">Misión 1</div>
        <h1>¿Qué ha pasado esta mañana?</h1>
        <p class="subtitle">Castellano · Comprensión lectora. Primero lee la página anterior.</p>
      </header>
      {mission_banner(1, "ANTES DE EMPEZAR", "Nebula Blade", "Importante: lee «La historia» de la página 0 antes de responder.")}
      <section class="panel">
        <div class="section-badge">Castellano</div>
        {reto_header(1, "COMPRENSIÓN LECTORA ⭐⭐")}
        <p class="section-intro">Responde leyendo el texto. Puedes volver a la página anterior.</p>
        {q_html}
      </section>
      <section class="panel">
        {reto_header(2, "ORDENA LOS ACONTECIMIENTOS ⭐⭐")}
        <p class="section-intro">Escribe del 1 al 6 en la columna de orden.</p>
        <table class="suspect-table">
          <thead><tr><th>N.º</th><th>Acontecimiento</th></tr></thead>
          <tbody>{orden_html}</tbody>
        </table>
      </section>
      <footer class="footer-line">Misión 1 · Página 1 de 2 · Cuchillos: ☆☆☆☆☆</footer>
    </article>
    """


def render_mission1_page2() -> str:
    clocks = [
        "Aray se despierta",
        "Termina de desayunar",
        "Hace la cama y ordena",
        "Enciende el ordenador",
        "Entran al evento con Luca",
    ]
    clock_html = "".join(
        f"<p><strong>{i}.</strong> {escape(label)} → "
        f'{render_boxes(2, "28px")} : {render_boxes(2, "28px")}</p>'
        for i, label in enumerate(clocks, start=1)
    )
    return f"""
    <article class="page">
      <header class="page-head">
        <div class="chapter-pill">Misión 1</div>
        <h1>Relojes y prueba final</h1>
        <p class="subtitle">Busca las horas en el texto de la página 0.</p>
      </header>
      <section class="panel">
        {reto_header(3, "LOS RELOJES DE LA MAÑANA ⭐⭐")}
        {clock_html}
        <p class="section-intro">Opcional: dibuja las manecillas en 3 relojes (despertar, desayuno, entrada al evento).</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px;">
          <div style="border:2px solid #aeb9cf;border-radius:50%;aspect-ratio:1;max-width:90px;"></div>
          <div style="border:2px solid #aeb9cf;border-radius:50%;aspect-ratio:1;max-width:90px;"></div>
          <div style="border:2px solid #aeb9cf;border-radius:50%;aspect-ratio:1;max-width:90px;"></div>
        </div>
      </section>
      <section class="panel">
        {reto_header(4, "¿A QUÉ HORA EMPIEZA LA PRUEBA? ⭐⭐⭐")}
        <p>Si a las <strong>11:10</strong> entran al evento y la primera prueba empieza <strong>20 minutos</strong> después, ¿a qué hora comienza?</p>
        <p>{render_boxes(2, "28px")} : {render_boxes(2, "28px")}</p>
        <p><strong>Marca la respuesta correcta:</strong></p>
        {choice_options(["A) 11:20", "B) 11:30", "C) 11:40"])}
      </section>
      <section class="panel">
        {reto_header(5, "VERDADERO O FALSO ⭐")}
        {vf_table([
            "La historia ocurre un domingo por la mañana.",
            "Aray ayuda a recoger la mesa después del desayuno.",
            "El evento tiene cinco pruebas para conseguir los cuchillos.",
            "Aray entra solo al evento sin llamar a nadie.",
            "En el sueño de Aray aparecía Luca.",
        ])}
      </section>
      <section class="panel decoder-panel">
        <h3>¡Primer cuchillo conseguido!</h3>
        {knife_progress(1)}
        <p><em>«Primera prueba superada. Nebula Blade es tuyo.»</em> — Mensaje del juego</p>
      </section>
      <footer class="footer-line">Misión 1 · Página 2 de 2 · Cuchillos: ★☆☆☆☆</footer>
    </article>
    """


def render_mission2_page1() -> str:
    return f"""
    <article class="page">
      <header class="page-head">
        <div class="chapter-pill">Misión 2</div>
        <h1>La arena numérica</h1>
        <p class="subtitle">Matemátiques · català · Crystal Fang</p>
      </header>
      {mission_banner(2, "ARENA NUMÉRICA", "Crystal Fang", "Segunda sala del mapa: els números del Pack estan bloquejats.")}
      <section class="panel">
        {reto_header(1, "DOBLE I TRIPLE ⭐")}
        <p>A la botiga de l'arena, cada moneda d'or val 2 punts i cada cristall val el triple d'una moneda.</p>
        <table class="suspect-table">
          <thead><tr><th>Nombre</th><th>El doble</th><th>El triple</th></tr></thead>
          <tbody>
            <tr><td>3</td><td class="vf-cell"></td><td class="vf-cell"></td></tr>
            <tr><td>5</td><td class="vf-cell"></td><td class="vf-cell"></td></tr>
            <tr><td>7</td><td class="vf-cell"></td><td class="vf-cell"></td></tr>
          </tbody>
        </table>
        <p>Raonament: Si una moneda val 2 punts, quant val el <strong>doble</strong> d'una moneda? {render_boxes(2, "24px")} punts</p>
      </section>
      <section class="panel">
        {reto_header(2, "COMPARA ELS NOMBRES ⭐")}
        <p>Escriu el signe correcte: &gt; , &lt; o =</p>
        <p>1. 4.218 {render_boxes(1, "28px")} 4.281</p>
        <p>2. 7.050 {render_boxes(1, "28px")} 7.005</p>
        <p>3. 3.999 {render_boxes(1, "28px")} 4.000</p>
        <p>4. 6.340 {render_boxes(1, "28px")} 6.340</p>
        <p>5. 8.912 {render_boxes(1, "28px")} 8.921</p>
      </section>
      <section class="panel">
        {reto_header(3, "LA CARRERA DE L'ARENA ⭐⭐⭐")}
        <p>En una carrera dins del joc, tres jugadors arriben a la meta en aquest ordre: <strong>1. Eric · 2. Sara · 3. Axel</strong></p>
        <p>1. Quin lloc ocupa Eric? {render_boxes(2, "24px")}</p>
        <p>2. Quin lloc ocupa Sara? {render_boxes(2, "24px")}</p>
        <p>3. Quin lloc ocupa Axel? {render_boxes(2, "24px")}</p>
        <p>4. Qui va davant d'Axel? {write_lines(1)}</p>
        <p>5. Qui va darrere de Sara? {write_lines(1)}</p>
      </section>
      <footer class="footer-line">Misión 2 · Página 1 de 2 · Cuchillos: ★☆☆☆☆</footer>
    </article>
    """


def render_mission2_page2() -> str:
    return f"""
    <article class="page">
      <header class="page-head">
        <div class="chapter-pill">Misión 2</div>
        <h1>Valor posicional i problema</h1>
        <p class="subtitle">Estil «Llegeix i comprèn» del cole.</p>
      </header>
      <section class="panel">
        {reto_header(4, "VALOR POSICIONAL ⭐⭐")}
        <p><strong>A) Descomposa (UM, C, D, U)</strong></p>
        <p>1. 3.518 = {render_boxes(1)} UM + {render_boxes(1)} C + {render_boxes(1)} D + {render_boxes(1)} U</p>
        <p>2. 6.204 = {render_boxes(1)} UM + {render_boxes(1)} C + {render_boxes(1)} D + {render_boxes(1)} U</p>
        <p>3. 9.070 = {render_boxes(1)} UM + {render_boxes(1)} C + {render_boxes(1)} D + {render_boxes(1)} U</p>
        <p><strong>B) Quin valor té la xifra en negreta?</strong></p>
        <table class="suspect-table">
          <thead><tr><th>Nombre</th><th>La xifra val…</th></tr></thead>
          <tbody>
            <tr><td>5.<strong>4</strong>82</td><td class="vf-cell"></td></tr>
            <tr><td><strong>3</strong>.716</td><td class="vf-cell"></td></tr>
            <tr><td>8.2<strong>9</strong>5</td><td class="vf-cell"></td></tr>
          </tbody>
        </table>
      </section>
      <section class="panel">
        {reto_header(5, "L'APARCAMENT DE L'ARENA ⭐⭐⭐")}
        <p>A les onze del matí hi ha <strong>155</strong> cotxes. Marxen <strong>34</strong> i entren <strong>18</strong> nous amb Luca i Aray.</p>
        <table class="suspect-table">
          <thead><tr><th></th><th>Dades</th><th>Operació</th><th>Resposta</th></tr></thead>
          <tbody>
            <tr><td><strong>1.</strong> Cotxes després que marxen 34</td><td>155 − 34</td><td class="vf-cell"></td><td class="vf-cell"></td></tr>
            <tr><td><strong>2.</strong> Cotxes quan entren 18 nous</td><td></td><td class="vf-cell"></td><td class="vf-cell"></td></tr>
            <tr><td><strong>3.</strong> Persones màxim (4 per cotxe)</td><td></td><td class="vf-cell"></td><td class="vf-cell"></td></tr>
            <tr><td><strong>4.</strong> Aray té raó? Explica.</td><td>Compara 155 i final</td><td colspan="2">{write_lines(1)}</td></tr>
          </tbody>
        </table>
      </section>
      <section class="panel decoder-panel">
        <h3>¡Segundo cuchillo conseguido!</h3>
        {knife_progress(2)}
        <p><em>«Crystal Fang desbloqueado. La arena numérica queda atrás.»</em></p>
      </section>
      <footer class="footer-line">Misión 2 · Página 2 de 2 · Cuchillos: ★★☆☆☆</footer>
    </article>
    """


def build_html() -> str:
    pages = [
        render_intro_page(),
        render_mission1_page1(),
        render_mission1_page2(),
        render_mission2_page1(),
        render_mission2_page2(),
    ]
    return wrap_document("Capítulo 3 · Pack Legendario (pág. 0 + misiones 1-2)", "\n".join(pages))


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
  subprocess.run(cmd, check=True, capture_output=True, timeout=60)
  return pdf_path.exists()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    html_path = OUT / "cap03_pag0_mision1_mision2.html"
    pdf_path = OUT / "cap03_pag0_mision1_mision2.pdf"
    html_path.write_text(build_html(), encoding="utf-8")
    print(f"HTML -> {html_path}")
    if html_to_pdf(html_path, pdf_path):
        print(f"PDF  -> {pdf_path}")
    else:
        print("PDF no generado automaticamente. Abre el HTML y usa Imprimir > Guardar como PDF.")


if __name__ == "__main__":
    main()
