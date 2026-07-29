from __future__ import annotations

from html import escape
from pathlib import Path


PROFILE = {
    "child_name": "Aray",
    "age": 8,
    "school_stage": "3.º de primaria",
    "town": "Montmelo",
    "region": "Barcelona, Catalunya",
    "friends": ["Axel", "Eric", "Luca", "Marc", "Emma", "Alma"],
    "dogs": ["Cuba", "Penny"],
    "likes": [
        "Roblox",
        "Rivals",
        "My Hero Academia",
        "juegos de zombis",
        "skins de cuchillos",
        "retos por niveles",
    ],
}


WEEKS = [
    {
        "number": 1,
        "theme": "Academia Rivals",
        "badge": "Pase de novato",
        "story": "Aray empieza el verano entrando en una academia secreta de retos donde cada ficha suma experiencia.",
        "math_focus": "numeracion, valor posicional, sumas y restas",
        "spanish_scene": "Axel, Eric y Aray entrenan en una sala con cajas numeradas y cronometros.",
        "catalan_scene": "La colla prepara una cursa de pistes pel pati.",
        "medi_topic": "normas, rutinas saludables y organizacion del verano",
        "english_vocab": ["friend", "team", "bag", "dog", "park", "game"],
        "creative_prompt": "Diseña tu tarjeta de jugador de verano con nombre, poder y nivel.",
    },
    {
        "number": 2,
        "theme": "Hero Lab",
        "badge": "Guantes de energia",
        "story": "Los amigos descubren un laboratorio de heroes donde cada mision exige pensar antes de actuar.",
        "math_focus": "restas, multiplicacion como suma repetida y tablas",
        "spanish_scene": "Emma y Alma mezclan ideas para crear trajes con bolsillos secretos.",
        "catalan_scene": "En Marc i en Luca fan un cartell per anunciar una missio heroica.",
        "medi_topic": "cuerpo humano, higiene, descanso y alimentacion",
        "english_vocab": ["hero", "mask", "cape", "run", "jump", "strong"],
        "creative_prompt": "Inventa un heroe o heroina con un poder util para ayudar a los demas.",
    },
    {
        "number": 3,
        "theme": "Zombie Bakery",
        "badge": "Delantal anti-zombi",
        "story": "La panaderia del barrio se llena de recetas locas y zombis hambrientos que solo entienden los problemas bien resueltos.",
        "math_focus": "multiplicacion, reparto, dinero y calculo mental",
        "spanish_scene": "Cuba y Penny vigilan el horno mientras Luca cuenta magdalenas.",
        "catalan_scene": "L'Alma reparteix croissants i compta safates al taulell.",
        "medi_topic": "alimentos, origen de los productos y habitos de cocina seguros",
        "english_vocab": ["bread", "cake", "milk", "egg", "hungry", "shop"],
        "creative_prompt": "Escribe la receta mas disparatada de la panaderia zombi.",
    },
    {
        "number": 4,
        "theme": "Rescate de Cuba y Penny",
        "badge": "Silbato explorador",
        "story": "Cuba y Penny han salido tras unas pistas por el parque y el equipo debe seguir mapas, tiempos y señales.",
        "math_focus": "division, problemas de reparto, tiempo y medida",
        "spanish_scene": "Marc encuentra huellas cerca de una fuente y llama a Aray.",
        "catalan_scene": "L'Eric mira el rellotge mentre la colla segueix un cami pel bosc.",
        "medi_topic": "animales de compañia, cuidados, necesidades y responsabilidad",
        "english_vocab": ["pet", "water", "home", "food", "tree", "path"],
        "creative_prompt": "Dibuja un mapa sencillo para encontrar a Cuba y Penny en una mision.",
    },
    {
        "number": 5,
        "theme": "Montmelo Quest",
        "badge": "Mapa brillante",
        "story": "El equipo recorre su pueblo como si fuera un mapa de juego y cada parada tiene una prueba nueva.",
        "math_focus": "dinero, relojes, calendario y problemas de dos pasos",
        "spanish_scene": "Aray y Axel hacen compras para una fiesta en la plaza.",
        "catalan_scene": "L'Emma escriu pistes sobre llocs del poble.",
        "medi_topic": "barrio, servicios, planos, orientacion y convivencia",
        "english_vocab": ["street", "square", "school", "shop", "left", "right"],
        "creative_prompt": "Crea un anuncio para invitar a tus amigos a una ruta por Montmelo.",
    },
    {
        "number": 6,
        "theme": "Mercado de Skins",
        "badge": "Moneda legendaria",
        "story": "Ha abierto un mercado donde las skins se cambian por monedas, puntos y decisiones inteligentes.",
        "math_focus": "geometria, perimetro, fracciones sencillas y datos",
        "spanish_scene": "Eric compara cajas y envoltorios para guardar objetos raros.",
        "catalan_scene": "En Marc i l'Axel compten monedes i enganxines de colors.",
        "medi_topic": "materiales, reciclaje, consumo responsable y clasificacion",
        "english_vocab": ["coin", "box", "small", "big", "triangle", "square"],
        "creative_prompt": "Diseña una skin nueva y explica como se consigue.",
    },
    {
        "number": 7,
        "theme": "Isla Secreta",
        "badge": "Brújula pixelada",
        "story": "Una isla secreta aparece en el mapa del verano y solo los exploradores atentos encuentran sus recursos.",
        "math_focus": "medidas, capacidad, longitud, graficos y logica",
        "spanish_scene": "Alma anota pistas del mar mientras Emma recoge conchas.",
        "catalan_scene": "La colla observa el temps i fa una llista de material.",
        "medi_topic": "agua, tiempo atmosferico, plantas y ecosistemas",
        "english_vocab": ["sea", "sun", "cloud", "plant", "boat", "sand"],
        "creative_prompt": "Imagina que pasas un dia en una isla secreta: que llevas y por que.",
    },
    {
        "number": 8,
        "theme": "Torneo Final",
        "badge": "Copa maestra",
        "story": "Llega el torneo final: Aray repasa todo lo aprendido para desbloquear el rango maestro del verano.",
        "math_focus": "repaso general y problemas mixtos",
        "spanish_scene": "Todos los amigos preparan la gran final con carteles, horarios y normas.",
        "catalan_scene": "En Cuba i la Penny animen l'equip des de la grada.",
        "medi_topic": "repaso del entorno, habitos, ciencia cotidiana y observacion",
        "english_vocab": ["winner", "team", "finish", "today", "happy", "trophy"],
        "creative_prompt": "Escribe un mensaje para tu yo del futuro contando todo lo que has mejorado este verano.",
    },
]


DAY_LABELS = [
    ("Lunes", "Matemáticas", "Lengua castellana"),
    ("Martes", "Matemáticas", "Català"),
    ("Miércoles", "Matemáticas", "Medi"),
    ("Jueves", "Matemáticas", "English"),
    ("Viernes", "Repaso mixto", "Lectura y creatividad"),
]


def page(title: str, subtitle: str, subject: str, mission: str, sections: list[dict], answers: list[dict]) -> dict:
    return {
        "title": title,
        "subtitle": subtitle,
        "subject": subject,
        "mission": mission,
        "sections": sections,
        "answers": answers,
    }


def html_list(items: list[str]) -> str:
    parts = ["<ol>"]
    for item in items:
        parts.append(f"<li>{escape(item)}</li>")
    parts.append("</ol>")
    return "".join(parts)


def html_section(section: dict) -> str:
    title = escape(section["title"])
    body = ""
    if section.get("items"):
        body += html_list(section["items"])
    if section.get("text"):
        body += f"<p>{escape(section['text'])}</p>"
    if section.get("lines"):
        body += "".join('<div class="line"></div>' for _ in range(section["lines"]))
    return f'<section class="block"><h3>{title}</h3>{body}</section>'


def render_page_content(sheet: dict, week_theme: str, week_number: int) -> str:
    blocks = "".join(html_section(section) for section in sheet["sections"])
    return f"""
    <article class="page">
      <header class="sheet-header">
        <div class="eyebrow">Cuaderno de verano de {escape(PROFILE["child_name"])} · Semana {week_number}</div>
        <div class="subject-chip">{escape(sheet["subject"])}</div>
        <h1>{escape(sheet["title"])}</h1>
        <p class="subtitle">{escape(sheet["subtitle"])}</p>
        <p class="mission"><strong>Misión:</strong> {escape(sheet["mission"])}</p>
        <div class="theme-box"><strong>Temática:</strong> {escape(week_theme)}</div>
      </header>
      <main>{blocks}</main>
      <footer class="sheet-footer">Nombre: _________________________   Fecha: _________________________</footer>
    </article>
    """


def render_answer_page(sheet: dict, week_theme: str, week_number: int) -> str:
    answer_blocks = "".join(html_section(section) for section in sheet["answers"])
    return f"""
    <article class="page answer-page">
      <header class="sheet-header">
        <div class="eyebrow">Solucionario · Semana {week_number}</div>
        <div class="subject-chip">{escape(sheet["subject"])}</div>
        <h1>{escape(sheet["title"])}</h1>
        <p class="subtitle">{escape(sheet["subtitle"])}</p>
        <div class="theme-box"><strong>Temática:</strong> {escape(week_theme)}</div>
      </header>
      <main>{answer_blocks}</main>
    </article>
    """


def cover_page() -> str:
    likes = ", ".join(PROFILE["likes"])
    friends = ", ".join(PROFILE["friends"])
    dogs = " y ".join(PROFILE["dogs"])
    return f"""
    <article class="page cover-page">
      <div class="cover-card">
        <div class="eyebrow">Programa completo de 8 semanas</div>
        <h1>Cuaderno de verano de {escape(PROFILE["child_name"])}</h1>
        <p class="subtitle">Repaso de 3.º de primaria con narrativa de misiones, estilo Roblox y actividades listas para imprimir en A4.</p>
        <div class="cover-grid">
          <div>
            <h2>Perfil</h2>
            <p>{escape(PROFILE["child_name"])} tiene {PROFILE["age"]} años, ha terminado {escape(PROFILE["school_stage"])} en {escape(PROFILE["town"])}, {escape(PROFILE["region"])}.</p>
          </div>
          <div>
            <h2>Le motiva</h2>
            <p>{escape(likes)}</p>
          </div>
          <div>
            <h2>Personajes del verano</h2>
            <p>Amigos: {escape(friends)}.</p>
            <p>Perros: {escape(dogs)}.</p>
          </div>
          <div>
            <h2>Uso recomendado</h2>
            <p>Dos fichas al día, cinco días por semana. Una de matemáticas y otra de lengua, català, medi, inglés o repaso creativo.</p>
          </div>
        </div>
      </div>
    </article>
    """


def schedule_page() -> str:
    rows = "".join(
        f"<tr><td>{week['number']}</td><td>{escape(week['theme'])}</td><td>{escape(week['math_focus'])}</td><td>{escape(week['badge'])}</td></tr>"
        for week in WEEKS
    )
    return f"""
    <article class="page">
      <header class="sheet-header">
        <div class="eyebrow">Guía para la familia</div>
        <h1>Plan de 8 semanas</h1>
        <p class="subtitle">Base en castellano, con rotación de català, medi e inglés.</p>
      </header>
      <main>
        <section class="block">
          <h3>Reparto semanal</h3>
          <ol>
            <li>Lunes: matemáticas + lengua castellana.</li>
            <li>Martes: matemáticas + català.</li>
            <li>Miércoles: matemáticas + medi.</li>
            <li>Jueves: matemáticas + inglés.</li>
            <li>Viernes: repaso mixto + lectura y creatividad.</li>
          </ol>
        </section>
        <section class="block">
          <h3>Objetivo del cuaderno</h3>
          <p>Repasar numeración, cálculo, problemas, lectura comprensiva, ortografía, expresión escrita, vocabulario, inglés funcional y contenidos básicos de conocimiento del medio al nivel esperado al final de 3.º de primaria.</p>
        </section>
        <section class="block">
          <h3>Resumen por semana</h3>
          <table>
            <thead>
              <tr><th>Semana</th><th>Tema</th><th>Foco matemático</th><th>Logro</th></tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </section>
      </main>
    </article>
    """


def reward_page() -> str:
    cards = "".join(
        f"<div class='reward-box'><strong>Semana {week['number']}</strong><span>{escape(week['badge'])}</span><div class='reward-line'></div></div>"
        for week in WEEKS
    )
    return f"""
    <article class="page">
      <header class="sheet-header">
        <div class="eyebrow">Extra imprimible</div>
        <h1>Panel de recompensas</h1>
        <p class="subtitle">Marca una casilla cuando Aray complete sus dos fichas del día.</p>
      </header>
      <main>
        <section class="block">
          <h3>Ritmo sugerido</h3>
          <p>Si completa 4 o 5 días de trabajo en una semana, gana el logro de esa misión. También puedes darle una recompensa sencilla: elegir postre, escoger peli, juego en familia o salida especial.</p>
        </section>
        <section class="block">
          <h3>Días completados</h3>
          <table>
            <thead>
              <tr><th>Semana</th><th>L</th><th>M</th><th>X</th><th>J</th><th>V</th></tr>
            </thead>
            <tbody>
              {''.join(f"<tr><td>{week['number']}</td><td></td><td></td><td></td><td></td><td></td></tr>" for week in WEEKS)}
            </tbody>
          </table>
        </section>
        <section class="block">
          <h3>Insignias desbloqueadas</h3>
          <div class="reward-grid">{cards}</div>
        </section>
      </main>
    </article>
    """


def build_math_sheet(week: dict, slot: int) -> dict:
    n = week["number"]
    names = PROFILE["friends"]
    dogs = PROFILE["dogs"]
    if n == 1:
        if slot == 0:
            sections = [
                {"title": "1. Coloca cada número en la caja correcta", "items": [
                    f"Escribe con cifras: tres mil {20 + n}, cuatrocientas {15 + n}, siete unidades.",
                    f"Descompón {4382 + n} en millares, centenas, decenas y unidades.",
                    f"Ordena de menor a mayor: {3012+n}, {3201+n}, {3120+n}, {3021+n}.",
                ]},
                {"title": "2. Calcula con cuidado", "items": [
                    f"{1425+n} + {236+n}",
                    f"{2680+n} + {147+n}",
                    f"{3904+n} - {281+n}",
                    f"{5000+n} - {1467+n}",
                ]},
                {"title": "3. Problemas de la academia", "items": [
                    f"Aray consigue {125+n} puntos por la mañana y {238+n} por la tarde. ¿Cuántos puntos gana en total?",
                    f"Axel tenía {940+n} monedas y gastó {215+n} en mejoras. ¿Cuántas le quedan?",
                ]},
                {"title": "4. Bonus rápido", "items": [
                    "Rodea la cifra de las centenas en 4.583.",
                    "Escribe el número anterior y posterior de 6.099.",
                ]},
            ]
            answers = [
                {"title": "Respuestas", "items": [
                    "3027; 4383 = 4.000 + 300 + 80 + 3; orden: 3013, 3022, 3121, 3202.",
                    "1662, 2828, 3622, 3532.",
                    "364 puntos; 726 monedas.",
                    "Centenas: 5; anterior 6.098 y posterior 6.100.",
                ]}
            ]
            return page("Zona de números", "Valor posicional y operaciones", "Matemáticas", "Activa tu pase de novato sin perder ninguna cifra.", sections, answers)
        if slot == 1:
            sections = [
                {"title": "1. Completa las series", "items": [
                    f"{1200+n}, {1300+n}, __, __, {1600+n}",
                    f"{2450+n}, {2460+n}, {2470+n}, __, __",
                    f"{5000+n}, {4900+n}, __, __, {4600+n}",
                ]},
                {"title": "2. Sumas en columna", "items": [
                    f"{375+n} + {486+n}",
                    f"{2908+n} + {875+n}",
                    f"{1634+n} + {1299+n}",
                ]},
                {"title": "3. Restas con llevadas", "items": [
                    f"{840+n} - {356+n}",
                    f"{3020+n} - {1789+n}",
                    f"{7000+n} - {2684+n}",
                ]},
                {"title": "4. Reto de amigos", "items": [
                    f"Emma reunió {230+n} gemas, Alma {215+n} y Marc {198+n}. ¿Cuántas gemas consiguieron entre los tres?",
                ]},
            ]
            answers = [{"title": "Respuestas", "items": [
                "1301, 1401, 1501; 2481, 2491; 4801, 4701.",
                "862, 3784, 2934.",
                "485, 1232, 4315.",
                "646 gemas.",
            ]}]
            return page("Series de energía", "Series, sumas y restas", "Matemáticas", "Completa las secuencias del entrenamiento.", sections, answers)
        if slot == 2:
            sections = [
                {"title": "1. Compara con >, < o =", "items": [
                    f"{3456+n} __ {3546+n}",
                    f"{4200+n} __ {4199+n}",
                    f"{5801+n} __ {5801+n}",
                ]},
                {"title": "2. Descompón y recompón", "items": [
                    f"3.000 + 500 + 40 + {n} = ____",
                    f"7.000 + 80 + 6 = ____",
                    f"Escribe 4.209 como suma de sus valores.",
                ]},
                {"title": "3. Problemas de puntos", "items": [
                    f"Eric gana {320+n} puntos en tres retos y luego pierde {95+n}. ¿Con cuántos termina?",
                    f"Luca tenía {2000+n} tickets. Compra una mejora de {675+n}. ¿Cuántos tickets le sobran?",
                ]},
                {"title": "4. Rincón mental", "items": [
                    "Calcula mentalmente: 300 + 90 + 7.",
                    "Calcula mentalmente: 2.000 + 400 + 30 + 8.",
                ]},
            ]
            answers = [{"title": "Respuestas", "items": [
                "<, >, =.",
                "3541, 7086, 4.000 + 200 + 9.",
                "226 puntos; 1326 tickets.",
                "397 y 2438.",
            ]}]
            return page("Comparadores Rivals", "Comparación y descomposición", "Matemáticas", "Decide qué cantidad es más fuerte en cada duelo.", sections, answers)
        sections = [
            {"title": "1. Cálculo rápido", "items": [
                "40 + 30 =",
                "90 - 50 =",
                "200 + 300 =",
                "700 - 200 =",
            ]},
            {"title": "2. Operaciones largas", "items": [
                f"{478+n} + {389+n}",
                f"{912+n} - {487+n}",
                f"{2765+n} + {124+n}",
                f"{4100+n} - {975+n}",
            ]},
            {"title": "3. Problema con Cuba y Penny", "items": [
                f"Cuba recorrió {245+n} metros y Penny {198+n}. ¿Cuántos metros recorrieron entre las dos?",
                f"Si después descansaron {120+n} metros antes de volver, ¿cuántos metros caminaron en total?",
            ]},
            {"title": "4. Piensa y escribe", "items": [
                "¿Qué operación usarías para saber cuántos puntos tienes en total si ganas en dos partidas diferentes?",
            ], "lines": 2},
        ]
        answers = [{"title": "Respuestas", "items": [
            "70, 40, 500, 500.",
            "868, 426, 2890, 3121.",
            "444 metros; 565 metros.",
            "Una suma.",
        ]}]
        return page("Misión de cierre 1", "Repaso de la semana", "Matemáticas", "Cierra la primera misión sin errores de cálculo.", sections, answers)

    if n == 2:
        tables = [2, 3, 4, 5]
        table = tables[slot]
        sections = [
            {"title": "1. Multiplicación como suma repetida", "items": [
                f"{table} + {table} + {table} = ____",
                f"Escribe {table} x 4 como suma repetida.",
                f"Completa: {table} x 5 = ____",
            ]},
            {"title": "2. Tabla de entrenamiento", "items": [
                f"{table} x 1 =",
                f"{table} x 2 =",
                f"{table} x 6 =",
                f"{table} x 9 =",
            ]},
            {"title": "3. Restas del laboratorio", "items": [
                f"{980 + 10*n} - {245 + slot*11} =",
                f"{1500 + 25*n} - {678 + slot*23} =",
                f"{3200 + 19*n} - {1499 + slot*13} =",
            ]},
            {"title": "4. Problema heroico", "items": [
                f"Emma coloca {table} baterías en cada uno de 6 trajes. ¿Cuántas baterías necesita?",
                f"Si ya tenía {7 + slot} baterías, ¿cuántas más necesita conseguir?",
            ]},
        ]
        answers = [{"title": "Respuestas", "items": [
            f"{table*3}; {table}+{table}+{table}+{table}; {table*5}.",
            f"{table}, {table*2}, {table*6}, {table*9}.",
            f"{980 + 10*n - (245 + slot*11)}, {1500 + 25*n - (678 + slot*23)}, {3200 + 19*n - (1499 + slot*13)}.",
            f"{table*6} baterías; {table*6 - (7 + slot)} más.",
        ]}]
        return page(
            f"Hero Lab · Tabla del {table}",
            "Restas y multiplicación básica",
            "Matemáticas",
            "Demuestra que ya controlas la tabla y el cálculo con energía de héroe.",
            sections,
            answers,
        )

    if n == 3:
        prices = [(3, 4), (5, 2), (4, 6), (7, 3)][slot]
        tray_price, juice_price = prices
        sections = [
            {"title": "1. Multiplica sin miedo", "items": [
                f"{3+slot} x 7 =",
                f"{4+slot} x 6 =",
                f"{8-slot} x 5 =",
                f"{6+slot} x 4 =",
            ]},
            {"title": "2. Problemas de bandejas", "items": [
                f"Luca prepara {4+slot} bandejas con 6 magdalenas en cada una. ¿Cuántas magdalenas hace?",
                f"Alma hornea 5 bandejas con {3+slot} galletas cada una. ¿Cuántas galletas son?",
            ]},
            {"title": "3. Dinero en la panadería", "items": [
                f"Un batido cuesta {juice_price} euros y un pastel cuesta {tray_price} euros. ¿Cuánto cuestan 2 batidos y 3 pasteles?",
                f"Si Aray paga con 20 euros, ¿cuánto cambio recibe?",
            ]},
            {"title": "4. Cálculo mental", "items": [
                "50 + 50 =",
                "120 - 20 =",
                "5 x 10 =",
                "60 / 10 =",
            ]},
        ]
        total_cost = 2 * juice_price + 3 * tray_price
        answers = [{"title": "Respuestas", "items": [
            f"{(3+slot)*7}, {(4+slot)*6}, {(8-slot)*5}, {(6+slot)*4}.",
            f"{(4+slot)*6} magdalenas; {5*(3+slot)} galletas.",
            f"{total_cost} euros; cambio {20 - total_cost} euros.",
            "100, 100, 50, 6.",
        ]}]
        return page("Zombie Bakery · Horno de cálculos", "Multiplicación, dinero y cálculo mental", "Matemáticas", "Ayuda a que la panadería funcione antes de que lleguen los zombis.", sections, answers)

    if n == 4:
        shares = [2, 3, 4, 5][slot]
        sections = [
            {"title": "1. Repartos iguales", "items": [
                f"Reparte {12 + 3*slot} galletas entre {shares} niños.",
                f"Reparte {20 + 4*slot} botellas de agua entre {shares} equipos.",
                f"Reparte {24 + 2*slot} premios entre {shares} grupos.",
            ]},
            {"title": "2. Relojes y tiempos", "items": [
                f"La búsqueda empieza a las {9+slot}:00 y dura 1 hora. ¿A qué hora termina?",
                f"Si descansan 30 minutos más, ¿qué hora será entonces?",
            ]},
            {"title": "3. Medimos el camino", "items": [
                f"Cuba camina {350 + 25*slot} m y Penny {280 + 20*slot} m. ¿Cuántos metros hacen en total?",
                "¿Son más o menos de 600 m?",
            ]},
            {"title": "4. Problema de rescate", "items": [
                f"Marc lleva {18 + slot} premios para repartir entre {shares} personas. ¿Cuántos tocan a cada una y cuántos sobran?",
            ]},
        ]
        answers = [{"title": "Respuestas", "items": [
            f"{(12 + 3*slot)//shares}, {(20 + 4*slot)//shares}, {(24 + 2*slot)//shares}.",
            f"Termina a las {10+slot}:00; luego serán las {10+slot}:30.",
            f"{350 + 25*slot + 280 + 20*slot} m; depende del cálculo, en todos los casos es más de 600 m.",
            f"{(18 + slot)//shares} cada uno y sobran {(18 + slot)%shares}.",
        ]}]
        return page("Rescate de Cuba y Penny", "División, tiempo y medida", "Matemáticas", "Sigue las pistas sin perder el ritmo ni el reparto.", sections, answers)

    if n == 5:
        sections = [
            {"title": "1. Dinero en la plaza", "items": [
                f"Un helado vale {2+slot} euros y un zumo {1+slot} euros. ¿Cuánto cuestan 3 helados y 2 zumos?",
                f"Si pagan con 20 euros, ¿cuánto cambio reciben?",
            ]},
            {"title": "2. Calendario de la ruta", "items": [
                "Escribe los 7 días de la semana en orden.",
                f"Si hoy es martes y quedan {3+slot} días para la ruta, ¿qué día será?",
            ]},
            {"title": "3. Problemas de dos pasos", "items": [
                f"Aray compra 2 mapas de {4+slot} euros y 3 pegatinas de 2 euros. ¿Cuánto gasta?",
                f"Después le quedan 15 euros. ¿Cuánto dinero tenía al principio?",
            ]},
            {"title": "4. Hora de salida", "items": [
                f"El equipo sale a las {8+slot}:30 y tarda 1 hora y 15 minutos. ¿A qué hora llega?",
            ]},
        ]
        total = 3 * (2+slot) + 2 * (1+slot)
        cost2 = 2 * (4+slot) + 3 * 2
        answers = [{"title": "Respuestas", "items": [
            f"{total} euros; cambio {20-total} euros.",
            "lunes, martes, miércoles, jueves, viernes, sábado, domingo; el día correcto depende del cálculo: viernes, sábado, domingo o lunes.",
            f"Gasta {cost2} euros; tenía {cost2 + 15} euros.",
            f"Llega a las {9+slot}:45.",
        ]}]
        return page("Montmelo Quest", "Dinero, calendario y problemas de dos pasos", "Matemáticas", "Organiza una ruta perfecta por el pueblo.", sections, answers)

    if n == 6:
        shapes = ["cuadrado", "rectángulo", "triángulo", "rectángulo"][slot]
        sections = [
            {"title": "1. Figuras del mercado", "items": [
                f"Dibuja un {shapes} y escribe cuántos lados tiene.",
                "Rodea la figura que tenga 4 vértices en una colección que dibujes tú.",
                "Escribe una diferencia entre un cuadrado y un triángulo.",
            ], "lines": 3},
            {"title": "2. Perímetros sencillos", "items": [
                f"Un cuadrado tiene lados de {3+slot} cm. ¿Cuál es su perímetro?",
                f"Un rectángulo mide {5+slot} cm de largo y 2 cm de ancho. ¿Cuál es su perímetro?",
            ]},
            {"title": "3. Fracciones de colección", "items": [
                "Si una caja tiene 8 objetos y 4 son azules, ¿qué fracción está coloreada?",
                "Si tienes 6 monedas y gastas 3, ¿qué fracción has gastado?",
            ]},
            {"title": "4. Datos rápidos", "items": [
                "En una tabla de ventas aparecen 4, 6, 3 y 7 objetos. ¿Cuál es el número mayor?",
                "¿Cuántos objetos se vendieron en total?",
            ]},
        ]
        answers = [{"title": "Respuestas", "items": [
            "Cuadrado 4 lados, rectángulo 4 lados, triángulo 3 lados; respuesta abierta en la diferencia.",
            f"{4*(3+slot)} cm; {2*((5+slot)+2)} cm.",
            "4/8 o 1/2; 3/6 o 1/2.",
            "El mayor es 7; total 20.",
        ]}]
        return page("Mercado de Skins", "Geometría, perímetro, fracciones y datos", "Matemáticas", "Haz cuentas de comerciante experto sin perder la forma.", sections, answers)

    if n == 7:
        sections = [
            {"title": "1. Medidas de explorador", "items": [
                f"Una cuerda mide {2+slot} m y otra {150 + 10*slot} cm. Escribe cuál es más larga.",
                f"Un cubo tiene {3+slot} litros y otro 2 litros. ¿Cuántos litros suman?",
            ]},
            {"title": "2. Gráfico de la isla", "items": [
                "Se recogen 3 conchas rojas, 5 blancas y 4 azules. ¿Qué color aparece más veces?",
                "¿Cuántas conchas hay en total?",
            ]},
            {"title": "3. Lógica del campamento", "items": [
                "Si hay 4 tiendas y en cada una caben 3 personas, ¿cuántas personas pueden dormir?",
                "Si van 10 personas, ¿sobran plazas o faltan? ¿Cuántas?",
            ]},
            {"title": "4. Problema de agua", "items": [
                f"El equipo gasta {2+slot} litros por la mañana y {3+slot} por la tarde. ¿Cuántos litros usan al día?",
                "¿Cuántos litros usarán en 2 días si gastan lo mismo?",
            ]},
        ]
        answers = [{"title": "Respuestas", "items": [
            "La comparación depende de pasar a la misma unidad; por ejemplo 2 m = 200 cm.",
            "Blancas; total 12.",
            "12 personas; sobran 2 plazas.",
            f"{5 + 2*slot} litros al día; {2*(5 + 2*slot)} litros en 2 días.",
        ]}]
        return page("Isla Secreta", "Medidas, capacidad, gráficos y lógica", "Matemáticas", "Explora la isla y registra bien todos tus datos.", sections, answers)

    sections = [
        {"title": "1. Operaciones mixtas", "items": [
            f"{1345 + 9*slot} + {278 + 7*slot} =",
            f"{2400 + 20*slot} - {987 + 3*slot} =",
            f"{6+slot} x 7 =",
            f"{24 + 4*slot} ÷ 4 =",
        ]},
        {"title": "2. Dinero y tiempo", "items": [
            f"Dos entradas cuestan {3+slot} euros cada una. ¿Cuánto cuestan en total?",
            f"El torneo empieza a las {10+slot}:15 y dura 45 minutos. ¿A qué hora termina?",
        ]},
        {"title": "3. Problema final", "items": [
            f"El equipo consigue {120 + 10*slot} puntos en la primera ronda, {95 + 8*slot} en la segunda y pierde {30 + slot} en la tercera. ¿Con cuántos puntos termina?",
        ]},
        {"title": "4. Reto maestro", "items": [
            "Escribe una cosa de matemáticas que te sale mucho mejor ahora que al principio del verano.",
        ], "lines": 2},
    ]
    answers = [{"title": "Respuestas", "items": [
        f"{1345 + 9*slot + 278 + 7*slot}, {2400 + 20*slot - (987 + 3*slot)}, {(6+slot)*7}, {(24 + 4*slot)//4}.",
        f"{2*(3+slot)} euros; termina a las {11+slot}:00.",
        f"{120 + 10*slot + 95 + 8*slot - (30 + slot)} puntos.",
        "Respuesta abierta.",
    ]}]
    return page("Torneo Final", "Repaso general", "Matemáticas", "Usa todo tu entrenamiento para subir a rango maestro.", sections, answers)


def build_spanish_sheet(week: dict) -> dict:
    n = week["number"]
    names = PROFILE["friends"]
    passage = (
        f"Aray y {names[n % len(names)]} llegaron a la {week['theme'].lower()} con una libreta llena de retos. "
        f"Allí encontraron a {names[(n + 1) % len(names)]}, que había escrito pistas en una pizarra. "
        f"Cada vez que resolvían una prueba, ganaban una llave para abrir una caja sorpresa. "
        f"Antes de irse, Cuba y Penny movieron la cola porque sabían que el equipo había trabajado con calma y atención."
    )
    sections = [
        {"title": "1. Lee con atención", "text": passage},
        {"title": "2. Responde", "items": [
            "¿Quiénes aparecen en la historia?",
            "¿Qué ganaban cuando resolvían una prueba?",
            "¿Cómo sabían Cuba y Penny que el equipo había trabajado bien?",
        ], "lines": 3},
        {"title": "3. Vocabulario", "items": [
            "Escribe un sinónimo de calma.",
            "Escribe un antónimo de abrir.",
            "Busca en el texto un sustantivo y un verbo.",
        ], "lines": 2},
        {"title": "4. Gramática", "items": [
            "Rodea los nombres propios del texto.",
            "Copia una oración del texto y subraya el verbo.",
        ], "lines": 2},
        {"title": "5. Escritura breve", "items": [
            f"Escribe 4 o 5 líneas contando una misión nueva para Aray en {week['theme']}.",
        ], "lines": 5},
    ]
    answers = [
        {"title": "Comprensión y lengua", "items": [
            "Aparecen Aray, dos de sus amigos, Cuba y Penny.",
            "Ganaban una llave para abrir una caja sorpresa.",
            "Porque habían trabajado con calma y atención.",
            "Sinónimo posible: tranquilidad. Antónimo posible: cerrar. Respuesta abierta para sustantivo y verbo.",
            "Nombres propios: Aray, nombres de amigos, Cuba y Penny. Escritura breve abierta.",
        ]}
    ]
    return page(f"Lectura de la semana {n}", "Comprensión lectora y escritura", "Lengua castellana", "Lee, comprende y escribe como si estuvieras dentro de la misión.", sections, answers)


def build_catalan_sheet(week: dict) -> dict:
    text = (
        f"L'Aray i els seus amics han preparat una missio de {week['theme'].lower()}. "
        f"Primer fan una llista de material, despres llegeixen les pistes i finalment parlen per decidir el millor cami. "
        f"En Cuba i la Penny observen tot des del costat i s'alegren quan l'equip coopera."
    )
    sections = [
        {"title": "1. Llegeix el text", "text": text},
        {"title": "2. Comprensio", "items": [
            "Que fan primer?",
            "Que fan despres de llegir les pistes?",
            "Com reaccionen en Cuba i la Penny?",
        ], "lines": 3},
        {"title": "3. Vocabulari", "items": [
            "Escriu una paraula del text que sigui un animal.",
            "Escriu una paraula del text que indiqui ordre.",
        ], "lines": 2},
        {"title": "4. Ortografia", "items": [
            "Copia dues paraules amb lletres dobles o sons forts.",
            "Escriu una frase curta amb la paraula missio.",
        ], "lines": 3},
        {"title": "5. Expressio escrita", "items": [
            "Explica en 3 o 4 linies quina prova t'agradaria fer amb la colla.",
        ], "lines": 4},
    ]
    answers = [
        {"title": "Respostes orientatives", "items": [
            "Primer fan una llista de material.",
            "Parlen per decidir el millor cami.",
            "S'alegren quan l'equip coopera.",
            "Animal: Penny o Cuba. Ordre: primer, despres, finalment.",
            "La produccio escrita es oberta.",
        ]}
    ]
    return page(f"Missio en català {week['number']}", "Comprensio, vocabulari i escriptura", "Català", "Treballa en català amb pistes curtes i clares.", sections, answers)


def build_medi_sheet(week: dict) -> dict:
    topic = week["medi_topic"]
    sections = [
        {"title": "1. Piensa en el tema", "text": f"Esta semana el tema de medi es: {topic}."},
        {"title": "2. Observa y responde", "items": [
            "Escribe 3 ideas que recuerdes sobre este tema.",
            "¿Por qué es importante en la vida diaria?",
        ], "lines": 4},
        {"title": "3. Clasifica o enumera", "items": [
            "Haz una lista de cosas que ayudan a cuidar mejor nuestro entorno o nuestro cuerpo.",
            "Haz otra lista de cosas que lo empeoran.",
        ], "lines": 5},
        {"title": "4. Mini reto científico", "items": [
            "Observa durante un minuto algo real de casa, del balcón, de la calle o del parque y escribe dos detalles.",
            "Escribe una pregunta que te gustaría investigar sobre este tema.",
        ], "lines": 4},
        {"title": "5. Conecta con la misión", "items": [
            f"Explica cómo ayudaría este tema a Aray en la aventura de {week['theme']}.",
        ], "lines": 3},
    ]
    answers = [
        {"title": "Corrección orientativa", "items": [
            "Las respuestas dependen de lo que el niño recuerde y observe.",
            "Se puede valorar si identifica hábitos correctos, vocabulario básico y una relación sensata con la temática.",
        ]}
    ]
    return page(f"Medi · Semana {week['number']}", "Observación, hábitos y explicación", "Medi", "Conecta la aventura con el mundo real y observa como un pequeño científico.", sections, answers)


def build_english_sheet(week: dict) -> dict:
    vocab = week["english_vocab"]
    pairings = ", ".join(vocab)
    sections = [
        {"title": "1. Vocabulary", "text": f"Words of the week: {pairings}."},
        {"title": "2. Match or translate", "items": [
            "Choose 4 words and write them in Spanish.",
            "Choose 2 words and draw them in the margin.",
        ], "lines": 3},
        {"title": "3. Complete the sentences", "items": [
            f"I have got a {vocab[0]}.",
            f"There is a {vocab[1]} in the game.",
            f"My team is {vocab[-1]}.",
        ]},
        {"title": "4. Short reading", "text": f"Aray is in a team with Axel and Emma. They have got a {vocab[0]} and a {vocab[3]}. Today they play a {vocab[5]} in the park."},
        {"title": "5. Answer in English", "items": [
            "Who is in the team?",
            "What have they got?",
            "Where do they play?",
        ], "lines": 3},
    ]
    answers = [
        {"title": "Suggested answers", "items": [
            "The exact translations depend on the words chosen.",
            "Team members: Aray, Axel and Emma.",
            f"They have got a {vocab[0]} and a {vocab[3]}.",
            "They play in the park.",
        ]}
    ]
    return page(f"English quest {week['number']}", "Vocabulary and simple sentences", "English", "Use easy English to stay inside the mission.", sections, answers)


def build_mixed_sheet(week: dict) -> dict:
    sections = [
        {"title": "1. Mini cálculo", "items": [
            f"{12 + week['number']} + {15 + week['number']} =",
            f"{30 + week['number']} - {8 + week['number']} =",
            f"{3 + week['number'] % 4} x 4 =",
        ]},
        {"title": "2. Lengua exprés", "items": [
            "Escribe una frase con mayúscula y punto final.",
            "Escribe un nombre propio de la aventura y un nombre común.",
        ], "lines": 3},
        {"title": "3. Català ràpid", "items": [
            "Escriu dos dies de la setmana en català.",
            "Escriu una frase curta amb la paraula amic.",
        ], "lines": 3},
        {"title": "4. Medi", "items": [
            f"Escribe una cosa importante que has recordado esta semana sobre {week['medi_topic']}.",
        ], "lines": 2},
        {"title": "5. Bonus gamer", "items": [
            "Pinta una estrella si has trabajado con atención.",
            "Pinta dos estrellas si además has revisado tus errores.",
        ]},
    ]
    answers = [
        {"title": "Respuestas", "items": [
            f"{27 + 2*week['number']}, 22, {(3 + week['number'] % 4) * 4}.",
            "Las demás respuestas son abiertas.",
        ]}
    ]
    return page(f"Viernes de repaso {week['number']}", "Repaso corto de varias áreas", "Repaso mixto", "Haz una vuelta rápida por todo lo entrenado en la semana.", sections, answers)


def build_creative_sheet(week: dict) -> dict:
    names = ", ".join(PROFILE["friends"][:3])
    sections = [
        {"title": "1. Lectura breve", "text": f"Al final de la semana {week['number']}, Aray reunió a {names} para contarles que había desbloqueado la insignia {week['badge']}. Todos celebraron el esfuerzo, no solo porque había resuelto retos, sino porque cada día había leído, pensado y revisado mejor."},
        {"title": "2. Comprensión", "items": [
            "¿Qué celebraron los amigos?",
            "¿Qué mejoró Aray durante la semana?",
        ], "lines": 2},
        {"title": "3. Creatividad", "items": [
            week["creative_prompt"],
        ], "lines": 6},
        {"title": "4. Autoevaluación", "items": [
            "Marca con una X: He trabajado con calma / He necesitado ayuda / He revisado mis respuestas.",
        ]},
    ]
    answers = [
        {"title": "Respuestas orientativas", "items": [
            f"Celebraron que Aray desbloqueó la insignia {week['badge']}.",
            "Mejoró en leer, pensar y revisar.",
            "La parte creativa y la autoevaluación son abiertas.",
        ]}
    ]
    return page(f"Lectura y creatividad {week['number']}", "Cierre semanal", "Lectura y creatividad", "Cierra la semana expresando lo que has aprendido.", sections, answers)


def render_document(title: str, pages_html: list[str]) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>{escape(title)}</title>
  <style>
    @page {{
      size: A4;
      margin: 10mm;
    }}
    * {{
      box-sizing: border-box;
    }}
    body {{
      margin: 0;
      background: #f4f6fb;
      color: #1f2530;
      font-family: Arial, Helvetica, sans-serif;
    }}
    .page {{
      width: 190mm;
      min-height: 277mm;
      margin: 8mm auto;
      padding: 12mm;
      background: white;
      border: 1px solid #d8deea;
      border-radius: 10px;
      page-break-after: always;
      position: relative;
    }}
    .sheet-header {{
      margin-bottom: 10px;
    }}
    .eyebrow {{
      font-size: 12px;
      letter-spacing: 0.4px;
      color: #55627a;
      text-transform: uppercase;
      margin-bottom: 6px;
    }}
    h1 {{
      font-size: 28px;
      margin: 0 0 8px 0;
    }}
    h2 {{
      font-size: 18px;
      margin: 0 0 8px 0;
    }}
    h3 {{
      font-size: 16px;
      margin: 0 0 8px 0;
    }}
    p, li, td, th {{
      font-size: 15px;
      line-height: 1.45;
    }}
    ol {{
      margin: 0;
      padding-left: 20px;
    }}
    .subtitle {{
      margin: 0 0 8px 0;
      color: #3d4a60;
    }}
    .mission {{
      margin: 0 0 10px 0;
      padding: 8px 10px;
      background: #eef3ff;
      border-radius: 8px;
    }}
    .theme-box {{
      display: inline-block;
      margin-bottom: 10px;
      padding: 6px 10px;
      background: #fff4d8;
      border-radius: 999px;
      font-size: 14px;
    }}
    .subject-chip {{
      display: inline-block;
      margin-bottom: 8px;
      padding: 6px 10px;
      background: #1e4db7;
      color: white;
      border-radius: 999px;
      font-size: 14px;
    }}
    .block {{
      margin: 0 0 12px 0;
      padding: 10px;
      background: #f8faff;
      border: 1px solid #dfe6f5;
      border-radius: 8px;
    }}
    .line {{
      height: 18px;
      border-bottom: 1px solid #b5c0d8;
      margin-top: 4px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
    }}
    th, td {{
      border: 1px solid #c7d0e3;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }}
    .sheet-footer {{
      position: absolute;
      left: 12mm;
      right: 12mm;
      bottom: 10mm;
      font-size: 14px;
      color: #4f5b73;
    }}
    .cover-page {{
      display: flex;
      align-items: stretch;
    }}
    .cover-card {{
      width: 100%;
      padding: 16px;
      background: linear-gradient(180deg, #eef3ff 0%, #fff8ea 100%);
      border: 1px solid #d7e1f8;
      border-radius: 16px;
    }}
    .cover-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 18px;
    }}
    .reward-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }}
    .reward-box {{
      padding: 10px;
      border: 1px solid #c7d0e3;
      border-radius: 8px;
      min-height: 70px;
      background: #fffef7;
    }}
    .reward-box span {{
      display: block;
      margin-top: 4px;
    }}
    .reward-line {{
      margin-top: 12px;
      border-bottom: 1px dashed #8f9ab3;
    }}
    .answer-page .subject-chip {{
      background: #4b7a2a;
    }}
    @media print {{
      body {{
        background: white;
      }}
      .page {{
        margin: 0;
        border: none;
        border-radius: 0;
      }}
    }}
  </style>
</head>
<body>
{''.join(pages_html)}
</body>
</html>
"""


def answer_text_for_section(sheet: dict, section_index: int) -> str:
    answer_groups = sheet.get("answers", [])
    if not answer_groups:
        return "Sin respuesta registrada."

    if len(answer_groups) == 1:
        answer_items = answer_groups[0].get("items", [])
        if section_index < len(answer_items):
            return answer_items[section_index]
        return " / ".join(answer_items) if answer_items else "Respuesta abierta."

    group = answer_groups[min(section_index, len(answer_groups) - 1)]
    items = group.get("items", [])
    return " / ".join(items) if items else "Respuesta abierta."


def build_search_entries(week: dict, sheets: list[dict]) -> list[dict]:
    entries: list[dict] = []
    for sheet in sheets:
        for section_index, section in enumerate(sheet["sections"], start=1):
            prompt_parts: list[str] = []
            if section.get("text"):
                prompt_parts.append(section["text"])
            if section.get("items"):
                prompt_parts.extend(section["items"])

            entries.append(
                {
                    "week": week["number"],
                    "theme": week["theme"],
                    "subject": sheet["subject"],
                    "sheet_title": sheet["title"],
                    "section_title": section["title"],
                    "exercise_label": f"{sheet['title']} · {section['title']}",
                    "prompt": " ".join(prompt_parts).strip(),
                    "answer": answer_text_for_section(sheet, section_index - 1),
                }
            )
    return entries


def render_searchable_answers(entries: list[dict]) -> str:
    cards_html: list[str] = []
    for entry in entries:
        search_blob = " ".join(
            [
                str(entry["week"]),
                entry["theme"],
                entry["subject"],
                entry["sheet_title"],
                entry["section_title"],
                entry["prompt"],
                entry["answer"],
            ]
        ).lower()
        cards_html.append(
            f"""
            <article class="result-card" data-week="{entry['week']}" data-subject="{escape(entry['subject'])}" data-search="{escape(search_blob)}">
              <div class="result-top">
                <span class="week-chip">Semana {entry['week']}</span>
                <span class="subject-tag">{escape(entry['subject'])}</span>
              </div>
              <h2>{escape(entry['sheet_title'])}</h2>
              <p class="result-meta">{escape(entry['theme'])} · {escape(entry['section_title'])}</p>
              <section class="result-block">
                <h3>Ejercicio</h3>
                <p>{escape(entry['prompt'])}</p>
              </section>
              <section class="result-block answer-block">
                <h3>Corrección orientativa</h3>
                <p>{escape(entry['answer'])}</p>
              </section>
            </article>
            """
        )

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Buscador de correcciones de Aray</title>
  <style>
    * {{
      box-sizing: border-box;
    }}
    body {{
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: #f4f6fb;
      color: #1f2530;
    }}
    .shell {{
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }}
    .hero {{
      background: linear-gradient(180deg, #eef3ff 0%, #fff8ea 100%);
      border: 1px solid #d7e1f8;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 18px;
    }}
    .hero h1 {{
      margin: 0 0 8px 0;
      font-size: 32px;
    }}
    .hero p {{
      margin: 0;
      line-height: 1.5;
    }}
    .controls {{
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 18px;
    }}
    .control {{
      background: white;
      border: 1px solid #d8deea;
      border-radius: 12px;
      padding: 12px;
    }}
    label {{
      display: block;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #55627a;
      text-transform: uppercase;
    }}
    input, select {{
      width: 100%;
      padding: 10px 12px;
      font-size: 15px;
      border-radius: 8px;
      border: 1px solid #bcc8df;
      background: #fff;
    }}
    .summary {{
      margin: 0 0 14px 0;
      color: #44506a;
    }}
    .results {{
      display: grid;
      gap: 14px;
    }}
    .result-card {{
      background: white;
      border: 1px solid #d8deea;
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 1px 2px rgba(31, 37, 48, 0.05);
    }}
    .result-top {{
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }}
    .week-chip, .subject-tag {{
      display: inline-block;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
    }}
    .week-chip {{
      background: #e9efff;
      color: #1e4db7;
    }}
    .subject-tag {{
      background: #edf8eb;
      color: #36611c;
    }}
    .result-card h2 {{
      margin: 0 0 6px 0;
      font-size: 22px;
    }}
    .result-meta {{
      margin: 0 0 12px 0;
      color: #55627a;
    }}
    .result-block {{
      padding: 12px;
      border-radius: 10px;
      background: #f8faff;
      border: 1px solid #dfe6f5;
      margin-bottom: 10px;
    }}
    .answer-block {{
      background: #f4fbf1;
      border-color: #d6e8cc;
    }}
    .result-block h3 {{
      margin: 0 0 8px 0;
      font-size: 16px;
    }}
    .result-block p {{
      margin: 0;
      line-height: 1.5;
      white-space: pre-wrap;
    }}
    .hidden {{
      display: none;
    }}
    @media (max-width: 900px) {{
      .controls {{
        grid-template-columns: 1fr;
      }}
    }}
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <h1>Buscador de correcciones</h1>
      <p>Busca por semana, materia, título de ficha, sección o texto del ejercicio. Ejemplos: <strong>semana 3</strong>, <strong>división</strong>, <strong>Cuba</strong>, <strong>inglés</strong>, <strong>Montmelo</strong>.</p>
    </section>

    <section class="controls">
      <div class="control">
        <label for="searchBox">Buscar</label>
        <input id="searchBox" type="text" placeholder="Ejemplo: Cuba, semana 4, dinero, vocabulario..." />
      </div>
      <div class="control">
        <label for="weekFilter">Semana</label>
        <select id="weekFilter">
          <option value="">Todas</option>
          {''.join(f'<option value="{week}">Semana {week}</option>' for week in sorted({entry["week"] for entry in entries}))}
        </select>
      </div>
      <div class="control">
        <label for="subjectFilter">Materia</label>
        <select id="subjectFilter">
          <option value="">Todas</option>
          {''.join(f'<option value="{escape(subject)}">{escape(subject)}</option>' for subject in sorted({entry["subject"] for entry in entries}))}
        </select>
      </div>
    </section>

    <p id="summary" class="summary"></p>
    <section id="results" class="results">
      {''.join(cards_html)}
    </section>
  </div>

  <script>
    const searchBox = document.getElementById('searchBox');
    const weekFilter = document.getElementById('weekFilter');
    const subjectFilter = document.getElementById('subjectFilter');
    const summary = document.getElementById('summary');
    const cards = Array.from(document.querySelectorAll('.result-card'));

    function applyFilters() {{
      const text = searchBox.value.trim().toLowerCase();
      const week = weekFilter.value;
      const subject = subjectFilter.value;
      let visible = 0;

      for (const card of cards) {{
        const matchesText = !text || card.dataset.search.includes(text);
        const matchesWeek = !week || card.dataset.week === week;
        const matchesSubject = !subject || card.dataset.subject === subject;
        const show = matchesText && matchesWeek && matchesSubject;
        card.classList.toggle('hidden', !show);
        if (show) visible += 1;
      }}

      summary.textContent = `${{visible}} ejercicios visibles de ${{cards.length}}.`;
    }}

    searchBox.addEventListener('input', applyFilters);
    weekFilter.addEventListener('change', applyFilters);
    subjectFilter.addEventListener('change', applyFilters);
    applyFilters();
  </script>
</body>
</html>
"""


def build_all_sheets() -> tuple[list[str], list[str], dict[int, list[str]]]:
    workbook_pages = [cover_page(), schedule_page(), reward_page()]
    answer_pages = []
    weekly_files: dict[int, list[str]] = {}
    search_entries: list[dict] = []

    for week in WEEKS:
        week_number = week["number"]
        pages_for_week = []
        sheets = [
            build_math_sheet(week, 0),
            build_spanish_sheet(week),
            build_math_sheet(week, 1),
            build_catalan_sheet(week),
            build_math_sheet(week, 2),
            build_medi_sheet(week),
            build_math_sheet(week, 3),
            build_english_sheet(week),
            build_mixed_sheet(week),
            build_creative_sheet(week),
        ]
        search_entries.extend(build_search_entries(week, sheets))
        for sheet in sheets:
            rendered = render_page_content(sheet, week["theme"], week_number)
            workbook_pages.append(rendered)
            pages_for_week.append(rendered)
            answer_pages.append(render_answer_page(sheet, week["theme"], week_number))
        weekly_files[week_number] = pages_for_week
    return workbook_pages, answer_pages, weekly_files, search_entries


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    output_dir = base_dir / "salida"
    output_dir.mkdir(exist_ok=True)

    workbook_pages, answer_pages, weekly_files, search_entries = build_all_sheets()

    (output_dir / "cuaderno_verano_aray.html").write_text(
        render_document("Cuaderno de verano de Aray", workbook_pages),
        encoding="utf-8",
    )
    (output_dir / "solucionario_verano_aray.html").write_text(
        render_document("Solucionario del cuaderno de verano de Aray", answer_pages),
        encoding="utf-8",
    )
    (output_dir / "portada_cuaderno.html").write_text(
        render_document("Portada del cuaderno de verano de Aray", [cover_page()]),
        encoding="utf-8",
    )
    (output_dir / "extras_imprimibles.html").write_text(
        render_document("Extras imprimibles del verano de Aray", [schedule_page(), reward_page()]),
        encoding="utf-8",
    )
    (output_dir / "buscador_correcciones.html").write_text(
        render_searchable_answers(search_entries),
        encoding="utf-8",
    )
    for week_number, pages in weekly_files.items():
        (output_dir / f"semana_{week_number:02d}.html").write_text(
            render_document(f"Semana {week_number} · Verano de Aray", pages),
            encoding="utf-8",
        )


if __name__ == "__main__":
    main()
