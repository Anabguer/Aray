from __future__ import annotations

from html import escape
from pathlib import Path


SUSPECTS = [
    {"name": "Axel", "cape": "roja", "likes": "escudos de fuego y jugadas rapidas"},
    {"name": "Eric", "cape": "azul clara", "likes": "mascotas raras y cuidar a Cuba y Penny"},
    {"name": "Luca", "cape": "azul oscura", "likes": "cuchillos, skins raras y protecciones de sombra"},
    {"name": "Emma", "cape": "violeta", "likes": "alas, gemas y acertijos"},
]


DAYS = [
    {
        "day": "Lunes",
        "chapter": "Capitulo 1",
        "title": "El cuchillo que falta",
        "subtitle": "Aray descubre que ha desaparecido su Frost Fang y decide investigar antes de acusar.",
        "story_lines": [
            "El lunes, Aray se desperto a las 8:10.",
            "Desayuno rapido y a las 8:25 encendio la tablet.",
            "Primero miro su inventario de Roblox con mucha ilusion.",
            "El domingo por la noche tenia 18 cuchillos guardados.",
            "Aquella mañana solo le aparecian 17 en pantalla.",
            "El que faltaba era su favorito, Frost Fang.",
            "Era un cuchillo azul con brillo de hielo.",
            "Aray decidio no acusar a nadie todavia.",
            "Primero reviso el historial y los mensajes del chat.",
            "Axel habia enviado una oferta de 24 monedas.",
            "Emma habia enviado otra oferta de 35 gemas.",
            "Luca habia mandado 42 monedas y 18 gemas.",
            "En el chat aparecia una pregunta: Sigues teniendo el azul.",
        ],
        "reading_tasks": [
            {"code": "C1", "prompt": "¿Que problema descubrio Aray al abrir su inventario?", "answer": "Que le faltaba su cuchillo favorito.", "response": {"kind": "lines", "count": 1}},
            {"code": "C2", "prompt": "Marca la opcion correcta. ¿A que hora encendio la tablet?", "answer": "8:25", "response": {"kind": "choice", "options": ["8:10", "8:25", "8:40"]}},
            {"code": "C3", "prompt": "Verdadero o falso.", "answer": "V, V, F", "response": {"kind": "vf", "statements": ["Frost Fang era azul.", "Aray prefirio revisar pruebas antes de acusar.", "Emma envio 42 monedas y 18 gemas."]}},
            {"code": "C4", "prompt": "¿Por que crees que Aray decide mirar el historial antes de hablar con sus amigos?", "answer": "Porque quiere comprobar las pistas antes de decidir.", "response": {"kind": "lines", "count": 2}},
            {"code": "C5", "prompt": "En este texto, inventario significa...", "answer": "la lista de objetos que tiene en el juego", "response": {"kind": "choice", "options": ["la lista de objetos que tiene en el juego", "el nombre del servidor", "el tiempo que tarda en jugar"]}},
            {"code": "C6", "prompt": "Escribe que hizo Aray justo despues de desayunar.", "answer": "Encendio la tablet.", "response": {"kind": "lines", "count": 1}},
            {"code": "C7", "prompt": "¿Que detalle del chat parece importante y por que?", "answer": "La palabra azul, porque coincide con el cuchillo desaparecido.", "response": {"kind": "lines", "count": 2}},
        ],
        "math_tasks": [
            {"code": "M1", "prompt": "Desde las 8:10 hasta las 8:25 pasaron ____ minutos.", "answer": "15", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
            {"code": "M2", "prompt": "Si el domingo tenia 18 cuchillos y ahora ve 17, ¿cuantos faltan?", "answer": "1", "response": {"kind": "boxes", "count": 1, "width": "22px"}},
            {"code": "M3", "prompt": "Suma las cantidades principales de las tres ofertas: 24 + 35 + 42.", "answer": "101", "response": {"kind": "boxes", "count": 3, "width": "22px"}},
            {"code": "M4", "prompt": "Aray tenia 150 monedas. Si una mejora de seguridad costaba 45, ¿cuantas monedas le quedaban?", "answer": "105", "response": {"kind": "boxes", "count": 3, "width": "22px"}},
            {"code": "M5", "prompt": "Aray ordena 17 cuchillos en 3 filas. En dos filas pone 5 cuchillos en cada una. ¿Cuantos pone en la tercera fila?", "answer": "7", "response": {"kind": "boxes", "count": 1, "width": "22px"}},
        ],
        "extra_area": {
            "area": "English",
            "title": "English clue",
            "intro": "En el chat aparece un mensaje corto en ingles. Leelo y usa vocabulario basico del caso.",
            "support_title": "Chat message",
            "support_lines": [
                "I saw the blue knife near the trade window at eight twenty-five.",
                "It was shiny and very cold.",
            ],
            "tasks": [
                {"code": "EN1", "prompt": "Marca la opcion correcta. Blue knife significa...", "answer": "cuchillo azul", "response": {"kind": "choice", "options": ["cuchillo azul", "ventana azul", "escudo frio"]}},
                {"code": "EN2", "prompt": "¿Que hora aparece en el mensaje?", "answer": "8:25", "response": {"kind": "lines", "count": 1}},
                {"code": "EN3", "prompt": "Verdadero o falso.", "answer": "V, V, F", "response": {"kind": "vf", "statements": ["El mensaje habla de un cuchillo azul.", "El cuchillo estaba cerca de la ventana de intercambio.", "El cuchillo era rojo."]}},
            ],
        },
        "final_tasks": [
            {"code": "P1", "prompt": "Escribe la pista comun entre el texto en castellano y el mensaje en ingles.", "answer": "azul", "response": {"kind": "boxes", "count": 4, "width": "22px"}},
            {"code": "P2", "prompt": "¿Que sospechoso lleva capa azul oscura en el tablero?", "answer": "Luca", "response": {"kind": "boxes", "count": 4, "width": "22px"}},
            {"code": "P3", "prompt": "¿Por que todavia no se puede acusar a nadie con seguridad?", "answer": "Porque solo hay una primera pista y faltan mas pruebas.", "response": {"kind": "lines", "count": 2}},
        ],
        "decoder": {
            "title": "Prueba final del capitulo",
            "intro": "Vuelve al texto de lectura y saca una palabra-pista usando solo las lineas numeradas del caso.",
            "steps": [
                "Posicion 1: escribe la 1.ª letra de la 1.ª palabra de la linea 7.",
                "Posicion 2: escribe la 2.ª letra de la 6.ª palabra de la linea 13.",
                "Posicion 3: escribe la 3.ª letra de la 4.ª palabra de la linea 7.",
                "Posicion 4: escribe la 2.ª letra de la 4.ª palabra de la linea 7.",
            ],
            "word": "AZUL",
            "student_prompt": "Escribe la palabra-pista en las casillas.",
            "evidence": "Pista del capitulo 1: el robo esta relacionado con el color azul.",
        },
    },
    {
        "day": "Martes",
        "chapter": "Capitulo 2",
        "title": "El mercado de skins",
        "subtitle": "Una compra rara y una nota en catalan ayudan a descartar a una sospechosa.",
        "story_lines": [
            "El martes, Aray y Alma fueron al Mercado de Skins.",
            "La vendedora recordaba una compra hecha justo despues de la alarma.",
            "Un jugador pidio dos protecciones de sombra y un cuchillo raro.",
            "Tambien dijo una frase muy clara delante del mostrador.",
            "No quiero alas ni mascotas; solo cuchillos para revender.",
            "Cada proteccion costaba 6 monedas y el cuchillo costaba 8.",
            "El comprador pago con 25 monedas y salio deprisa hacia el estadio.",
            "Alma penso que esas preferencias no encajaban con todos los sospechosos.",
        ],
        "reading_tasks": [
            {"code": "C1", "prompt": "¿Que dos cosas dijo el comprador que no queria?", "answer": "alas y mascotas", "response": {"kind": "lines", "count": 1}},
            {"code": "C2", "prompt": "Marca la opcion correcta. ¿Que queria revender?", "answer": "cuchillos", "response": {"kind": "choice", "options": ["gemas", "cuchillos", "mascotas"]}},
            {"code": "C3", "prompt": "Verdadero o falso.", "answer": "V, V, F", "response": {"kind": "vf", "statements": ["Pidio dos protecciones de sombra.", "Pago con 25 monedas.", "Se llevo una mascota rara."]}},
            {"code": "C4", "prompt": "¿Que sospechosa encaja peor con alguien que rechaza alas y mascotas?", "answer": "Emma", "response": {"kind": "boxes", "count": 5, "width": "22px"}},
            {"code": "C5", "prompt": "Explica con tus palabras que significa revender.", "answer": "Volver a vender algo.", "response": {"kind": "lines", "count": 2}},
        ],
        "math_tasks": [
            {"code": "M1", "prompt": "Calcula el precio de las dos protecciones: 2 x 6.", "answer": "12", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
            {"code": "M2", "prompt": "Ahora suma el cuchillo raro: 12 + 8.", "answer": "20", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
            {"code": "M3", "prompt": "Si pago con 25 monedas y gasto 20, ¿cuantas monedas le sobraron?", "answer": "5", "response": {"kind": "boxes", "count": 1, "width": "22px"}},
            {"code": "M4", "prompt": "Si quisiera 2 cuchillos y 2 protecciones, ¿cuanto pagaria en total?", "answer": "28", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
        ],
        "extra_area": {
            "area": "Català",
            "title": "Nota curta en català",
            "intro": "A la parada hi havia una nota escrita de pressa. Llegeix-la i respon.",
            "support_title": "Nota trobada",
            "support_lines": [
                "No vull ales ni mascotes.",
                "Busco ganivets rars i proteccions fosques.",
            ],
            "tasks": [
                {"code": "CA1", "prompt": "Marca l'opcio correcta. No vull significa...", "answer": "no quiero", "response": {"kind": "choice", "options": ["no quiero", "no veo", "no llevo"]}},
                {"code": "CA2", "prompt": "Escriu dues coses que la nota rebutja.", "answer": "ales i mascotes", "response": {"kind": "lines", "count": 1}},
                {"code": "CA3", "prompt": "Ganivets s'assembla mes a la paraula...", "answer": "cuchillos", "response": {"kind": "choice", "options": ["alas", "cuchillos", "gemas"]}},
            ],
        },
        "final_tasks": [
            {"code": "P1", "prompt": "¿Que sospechosa puedes descartar al juntar la lectura y la nota en catalan?", "answer": "Emma", "response": {"kind": "boxes", "count": 5, "width": "22px"}},
            {"code": "P2", "prompt": "Escribe por que queda descartada.", "answer": "Porque a Emma le gustan alas y gemas, y la pista las rechaza.", "response": {"kind": "lines", "count": 2}},
        ],
        "decoder": {
            "title": "Prueba final del capitulo",
            "intro": "Copia las 4 primeras letras del nombre que has escrito en P1. Ese nombre es la sospechosa descartada.",
            "steps": [
                "Posicion 1: copia la 1.ª letra de P1.",
                "Posicion 2: copia la 2.ª letra de P1.",
                "Posicion 3: copia la 3.ª letra de P1.",
                "Posicion 4: copia la 4.ª letra de P1.",
            ],
            "word": "EMMA",
            "student_prompt": "Escribe el nombre descartado.",
            "evidence": "Pista del capitulo 2: Emma queda fuera del caso.",
        },
    },
    {
        "day": "Miercoles",
        "chapter": "Capitulo 3",
        "title": "El archivo del estadio",
        "subtitle": "Las cuentas del entrenamiento y una prueba de medi refuerzan la idea de sombra.",
        "story_lines": [
            "El miercoles, Marc llevo a Aray al Archivo del Estadio.",
            "En la hoja del entrenamiento habia 4 rondas de 6 pases.",
            "Tambien aparecian 3 goles en cada uno de 5 ejercicios.",
            "A un lado de la hoja alguien habia escrito una nota corta.",
            "No uso fuego ni hielo. Hoy necesito sombra.",
            "Axel protesto al leerla porque el siempre usa fuego.",
            "Marc añadio otro dato: habia 28 conos colocados en 4 lineas iguales.",
            "Aray vio que las cuentas y la nota iban en la misma direccion.",
        ],
        "reading_tasks": [
            {"code": "C1", "prompt": "¿Que proteccion necesitaba el jugador segun la nota?", "answer": "sombra", "response": {"kind": "boxes", "count": 6, "width": "20px"}},
            {"code": "C2", "prompt": "Marca la opcion correcta. ¿Que dice Axel que usa siempre?", "answer": "fuego", "response": {"kind": "choice", "options": ["hielo", "fuego", "sombra"]}},
            {"code": "C3", "prompt": "Verdadero o falso.", "answer": "V, F, V", "response": {"kind": "vf", "statements": ["La nota dice que no usa hielo.", "Habia 28 conos en 5 lineas.", "Marc enseño la hoja de entrenamientos."]}},
            {"code": "C4", "prompt": "¿Por que esta nota hace sospechar menos de Axel?", "answer": "Porque Axel usa fuego y la nota habla de sombra.", "response": {"kind": "lines", "count": 2}},
            {"code": "C5", "prompt": "Completa: moverse sin llamar la atencion se parece mas a actuar con...", "answer": "sombra", "response": {"kind": "boxes", "count": 6, "width": "20px"}},
        ],
        "math_tasks": [
            {"code": "M1", "prompt": "Calcula los pases: 4 x 6.", "answer": "24", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
            {"code": "M2", "prompt": "Calcula los goles: 3 x 5.", "answer": "15", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
            {"code": "M3", "prompt": "Suma pases y goles para saber cuantas acciones hizo en total.", "answer": "39", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
            {"code": "M4", "prompt": "Reparte 28 conos en 4 lineas iguales. ¿Cuantos hay en cada linea?", "answer": "7", "response": {"kind": "boxes", "count": 1, "width": "22px"}},
        ],
        "extra_area": {
            "area": "Medi",
            "title": "Medi · Luz y sombra",
            "intro": "Aray hace una prueba simple con una linterna para entender mejor la palabra sombra.",
            "support_title": "Observacion",
            "support_lines": [
                "Cuando una cartulina tapa la luz de la linterna, en la pared aparece una sombra.",
                "Cuanto mas clara es la luz, mas se nota la forma oscura.",
            ],
            "tasks": [
                {"code": "ME1", "prompt": "¿Que aparece en la pared cuando un objeto tapa la luz?", "answer": "una sombra", "response": {"kind": "lines", "count": 1}},
                {"code": "ME2", "prompt": "Verdadero o falso.", "answer": "V, F, V", "response": {"kind": "vf", "statements": ["La sombra aparece cuando algo tapa la luz.", "La sombra es una fuente de luz.", "La observacion ayuda a entender la pista del caso."]}},
                {"code": "ME3", "prompt": "Relaciona la observacion de medi con la nota del estadio. ¿Que palabra coincide?", "answer": "sombra", "response": {"kind": "boxes", "count": 6, "width": "20px"}},
            ],
        },
        "final_tasks": [
            {"code": "P1", "prompt": "¿Que tipo de proteccion aparece repetida en lectura y medi?", "answer": "sombra", "response": {"kind": "boxes", "count": 6, "width": "20px"}},
            {"code": "P2", "prompt": "¿Por que Axel encaja menos ahora?", "answer": "Porque usa fuego y la pista insiste en sombra.", "response": {"kind": "lines", "count": 2}},
        ],
        "decoder": {
            "title": "Prueba final del capitulo",
            "intro": "Copia la palabra que has escrito en P1. Esa es la pista que se repite en este capitulo.",
            "steps": [
                "Posicion 1: copia la 1.ª letra de P1.",
                "Posicion 2: copia la 2.ª letra de P1.",
                "Posicion 3: copia la 3.ª letra de P1.",
                "Posicion 4: copia la 4.ª letra de P1.",
                "Posicion 5: copia la 5.ª letra de P1.",
                "Posicion 6: copia la 6.ª letra de P1.",
            ],
            "word": "SOMBRA",
            "student_prompt": "Escribe la palabra-pista.",
            "evidence": "Pista del capitulo 3: el culpable esta unido a la sombra.",
        },
    },
    {
        "day": "Jueves",
        "chapter": "Capitulo 4",
        "title": "La coartada de Eric",
        "subtitle": "La camara de seguridad y un aviso en catalan descartan a otro sospechoso.",
        "story_lines": [
            "El jueves, Cuba siguio un rastro de 240 metros y Penny otro de 180.",
            "Los dos rastros terminaban en el patio oeste, junto a una camara.",
            "En la grabacion se veia a Eric llenando agua para Penny.",
            "Eso ocurria justo cuando la alarma del cofre ya habia sonado.",
            "El vigilante mostro otra escena del pasillo norte.",
            "El ladron habia dejado 18 huellas repartidas en 3 charcos.",
            "Tambien aparecia una funda vacia de cuchillo en el suelo.",
            "Aray entendio que Eric tenia una coartada muy fuerte.",
        ],
        "reading_tasks": [
            {"code": "C1", "prompt": "¿Donde estaba Eric cuando ya habia sonado la alarma?", "answer": "en el patio oeste", "response": {"kind": "lines", "count": 1}},
            {"code": "C2", "prompt": "¿Que estaba haciendo Eric en la grabacion?", "answer": "llenando agua para Penny", "response": {"kind": "lines", "count": 1}},
            {"code": "C3", "prompt": "Verdadero o falso.", "answer": "V, F, V", "response": {"kind": "vf", "statements": ["Cuba y Penny siguieron un rastro.", "La camara no grabo nada.", "El ladron dejo una funda vacia de cuchillo."]}},
            {"code": "C4", "prompt": "¿Por que la grabacion sirve como coartada?", "answer": "Porque demuestra que Eric estaba haciendo otra cosa en ese momento.", "response": {"kind": "lines", "count": 2}},
            {"code": "C5", "prompt": "Marca la opcion correcta. ¿Que objeto sigue apareciendo en el caso?", "answer": "cuchillo", "response": {"kind": "choice", "options": ["ala", "gema", "cuchillo"]}},
        ],
        "math_tasks": [
            {"code": "M1", "prompt": "Suma los dos rastros: 240 + 180.", "answer": "420", "response": {"kind": "boxes", "count": 3, "width": "22px"}},
            {"code": "M2", "prompt": "Despues recorrieron 60 metros mas. ¿Cuantos metros fueron en total?", "answer": "480", "response": {"kind": "boxes", "count": 3, "width": "22px"}},
            {"code": "M3", "prompt": "Reparte 18 huellas en 3 charcos. ¿Cuantas huellas hay en cada charco?", "answer": "6", "response": {"kind": "boxes", "count": 1, "width": "22px"}},
            {"code": "M4", "prompt": "Si el vigilante reviso 4 veces la grabacion y cada revision duro 12 minutos, ¿cuantos minutos reviso?", "answer": "48", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
        ],
        "extra_area": {
            "area": "Català",
            "title": "Avís del vigilant",
            "intro": "Al costat de la camara hi havia un avís curt en català.",
            "support_title": "Text de l'avís",
            "support_lines": [
                "A l'hora de l'alarma, l'Eric donava aigua a la Penny.",
                "La camara ho va gravar tot.",
            ],
            "tasks": [
                {"code": "CA1", "prompt": "Marca l'opcio correcta. A l'hora de l'alarma vol dir...", "answer": "a la hora de la alarma", "response": {"kind": "choice", "options": ["a la hora de la alarma", "antes de dormir", "despues del recreo"]}},
                {"code": "CA2", "prompt": "Que feia l'Eric segons l'avís?", "answer": "donava aigua a la Penny", "response": {"kind": "lines", "count": 1}},
                {"code": "CA3", "prompt": "La camara ho va gravar tot significa que...", "answer": "la camara lo grabo todo", "response": {"kind": "lines", "count": 1}},
            ],
        },
        "final_tasks": [
            {"code": "P1", "prompt": "¿A que sospechoso puedes tachar con seguridad despues de lectura y catalan?", "answer": "Eric", "response": {"kind": "boxes", "count": 4, "width": "22px"}},
            {"code": "P2", "prompt": "Escribe que prueba lo descarta.", "answer": "La grabacion muestra que estaba con Penny cuando ya habia sonado la alarma.", "response": {"kind": "lines", "count": 2}},
        ],
        "decoder": {
            "title": "Prueba final del capitulo",
            "intro": "Copia las cuatro letras del nombre escrito en P1.",
            "steps": [
                "Posicion 1: copia la 1.ª letra de P1.",
                "Posicion 2: copia la 2.ª letra de P1.",
                "Posicion 3: copia la 3.ª letra de P1.",
                "Posicion 4: copia la 4.ª letra de P1.",
            ],
            "word": "ERIC",
            "student_prompt": "Escribe el nombre descartado.",
            "evidence": "Pista del capitulo 4: Eric queda descartado por su coartada.",
        },
    },
    {
        "day": "Viernes",
        "chapter": "Capitulo 5",
        "title": "La resolucion final",
        "subtitle": "Aray junta todas las pruebas, repasa los descartes y cierra el misterio.",
        "story_lines": [
            "El viernes, Aray coloco sobre la mesa todas las pruebas del caso.",
            "Tenia la pista del color azul, la compra del mercado y la palabra sombra.",
            "Tambien tenia la grabacion que descartaba a Eric.",
            "Emma ya habia sido descartada por sus gustos de alas y gemas.",
            "Axel encajaba peor porque siempre juega con fuego.",
            "Solo quedaba alguien con capa azul oscura y gusto por cuchillos raros.",
            "Cuba y Penny se sentaron a su lado mientras repasaba.",
            "Si ordenaba bien los datos, podria escribir el nombre final.",
        ],
        "reading_tasks": [
            {"code": "C1", "prompt": "¿Que tres ideas importantes debe recordar Aray antes de acusar?", "answer": "azul, sombra y cuchillos raros", "response": {"kind": "lines", "count": 2}},
            {"code": "C2", "prompt": "Marca la opcion correcta. ¿Quien estaba descartada por gustarle alas y gemas?", "answer": "Emma", "response": {"kind": "choice", "options": ["Emma", "Luca", "Axel"]}},
            {"code": "C3", "prompt": "Verdadero o falso.", "answer": "V, V, F", "response": {"kind": "vf", "statements": ["Eric quedo descartado por la grabacion.", "El culpable esta relacionado con cuchillos.", "Axel usa sombra y cuchillos."]}},
            {"code": "C4", "prompt": "¿Por que ya solo queda practicamente un sospechoso?", "answer": "Porque los demas fueron descartados o no encajan con las pistas.", "response": {"kind": "lines", "count": 2}},
            {"code": "C5", "prompt": "Escribe el nombre del culpable final.", "answer": "Luca", "response": {"kind": "boxes", "count": 4, "width": "22px"}},
        ],
        "math_tasks": [
            {"code": "M1", "prompt": "Si Aray ha reunido 4 pruebas y cada una vale 3 puntos, ¿cuantos puntos tiene?", "answer": "12", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
            {"code": "M2", "prompt": "Si necesita 20 puntos para cerrar el caso y ya tiene 12, ¿cuantos le faltan?", "answer": "8", "response": {"kind": "boxes", "count": 1, "width": "22px"}},
            {"code": "M3", "prompt": "Habia 4 sospechosos y 3 quedaron descartados. ¿Cuantos quedan?", "answer": "1", "response": {"kind": "boxes", "count": 1, "width": "22px"}},
            {"code": "M4", "prompt": "Si un cuchillo raro vale 8 monedas y el culpable queria vender 3, ¿cuantas monedas conseguiria?", "answer": "24", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
        ],
        "extra_area": {
            "area": "English",
            "title": "Final note in English",
            "intro": "Antes de cerrar el caso, Aray relee una ultima nota breve en ingles.",
            "support_title": "Final note",
            "support_lines": [
                "The thief likes rare knives.",
                "The thief wears a dark blue cape.",
            ],
            "tasks": [
                {"code": "EN1", "prompt": "Marca la opcion correcta. Rare knives significa...", "answer": "cuchillos raros", "response": {"kind": "choice", "options": ["cuchillos raros", "mascotas azules", "gemas oscuras"]}},
                {"code": "EN2", "prompt": "¿De que color es la capa segun la nota?", "answer": "dark blue", "response": {"kind": "lines", "count": 1}},
                {"code": "EN3", "prompt": "Escribe en castellano una pista que da esta nota.", "answer": "Que el ladron lleva una capa azul oscura.", "response": {"kind": "lines", "count": 1}},
            ],
        },
        "final_tasks": [
            {"code": "P1", "prompt": "Escribe el nombre del unico sospechoso que encaja con todas las pistas.", "answer": "Luca", "response": {"kind": "boxes", "count": 4, "width": "22px"}},
            {"code": "P2", "prompt": "Resume en una frase por que Luca encaja con el caso.", "answer": "Porque le gustan los cuchillos, encaja con sombra y lleva capa azul oscura.", "response": {"kind": "lines", "count": 2}},
        ],
        "decoder": {
            "title": "Codigo final",
            "intro": "Copia las cuatro letras del nombre que has escrito en P1. Si coincide con C5, has cerrado el caso.",
            "steps": [
                "Posicion 1: copia la 1.ª letra de P1.",
                "Posicion 2: copia la 2.ª letra de P1.",
                "Posicion 3: copia la 3.ª letra de P1.",
                "Posicion 4: copia la 4.ª letra de P1.",
            ],
            "word": "LUCA",
            "student_prompt": "Escribe el nombre final.",
            "evidence": "Resolucion final: Luca robo la Nebula Blade.",
        },
        "bonus_words": ["LUCA", "SOMBRA", "CUBA", "PENNY", "SKINS", "RIVALS"],
        "bonus_grid": [
            "SLUCAQTR",
            "OKMSPENY",
            "MOBRAXZI",
            "BRCUBAAN",
            "RIVALSPT",
            "AKNIFSQU",
        ],
    },
]


PROTOTYPE_DAY = {
    "day": "Lunes",
    "chapter": "Capitulo 1",
    "title": "El cuchillo desaparecido",
    "subtitle": "Investiga con Aray: mismas tareas que en el cole, pero dentro del caso.",
    "case_name": "CASO 1: El cuchillo desaparecido",
    "case_intro": (
        "Aray abrio su inventario de Roblox y vio que faltaba Frost Fang, su cuchillo azul favorito. "
        "No quiso acusar todavia. Solo anoto lo esencial: el robo parece haber pasado el domingo por la noche "
        "y en el chat alguien pregunto por un cuchillo azul."
    ),
    "initial_clue": "Pista inicial: el cuchillo desaparecido era azul.",
    "case_resolution": "El culpable no llevaba capa roja.",
    "next_clue": "Nueva pista para el CASO 2: alguien pregunto por cuchillos azules en el mercado de skins.",
    "school_reading": {
        "title": "Informe del lunes · lo que paso por la manana",
        "intro": "Este es el informe que Aray escribio despues de revisar su inventario. Lee el texto y responde como en una ficha de comprension.",
        "text_lines": [
            "El lunes, Aray se desperto a las 8:10.",
            "Desayuno rapido y a las 8:25 encendio la tablet.",
            "Abrio su inventario de Roblox con mucha ilusion.",
            "El domingo por la noche tenia 18 cuchillos guardados.",
            "Aquella manana solo le aparecian 17 en pantalla.",
            "El que faltaba era su favorito, Frost Fang.",
            "Era un cuchillo azul con brillo de hielo.",
            "Aray decidio no acusar a nadie todavia.",
            "Primero reviso el historial y los mensajes del chat.",
            "En el chat aparecia una pregunta: Sigues teniendo el azul.",
        ],
    },
    "reading_tasks": [
        {"code": "C1", "prompt": "¿Que descubrio Aray al abrir su inventario?", "answer": "Que faltaba un cuchillo de su coleccion.", "response": {"kind": "lines", "count": 1}},
        {"code": "C2", "prompt": "Marca la opcion correcta. ¿A que hora encendio la tablet?", "answer": "8:25", "response": {"kind": "choice", "options": ["8:10", "8:25", "8:40"]}},
        {"code": "C3", "prompt": "Verdadero o falso.", "answer": "V, V, F", "response": {"kind": "vf", "statements": ["Frost Fang era azul.", "Aray reviso pruebas antes de acusar.", "El domingo tenia 17 cuchillos."]}},
        {"code": "C4", "prompt": "Numera del 1 al 3 estas acciones segun pasan en el texto: revisa el historial, desayuna, mira el inventario.", "answer": "1 desayuna, 2 mira el inventario, 3 revisa el historial", "response": {"kind": "lines", "count": 2}},
        {"code": "C5", "prompt": "En este texto, inventario significa...", "answer": "la lista de objetos que tiene en el juego", "response": {"kind": "choice", "options": ["la lista de objetos que tiene en el juego", "el nombre del servidor", "una skin de capa"]}},
        {"code": "C6", "prompt": "¿Por que crees que Aray revisa el historial antes de hablar con sus amigos?", "answer": "Porque quiere comprobar pruebas antes de decidir.", "response": {"kind": "lines", "count": 2}},
    ],
    "math_tasks": [
        {"code": "M1", "prompt": "Del informe: Aray se desperto a las 8:10 y encendio la tablet a las 8:25. ¿Cuantos minutos pasaron?", "answer": "15", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
        {"code": "M2", "prompt": "El domingo tenia 18 cuchillos y esa manana ve 17. Marca la operacion para saber cuantos faltan.", "answer": "18 - 17", "response": {"kind": "choice", "options": ["18 + 17", "18 - 17", "17 - 18"]}},
        {"code": "M3", "prompt": "Resuelve la operacion anterior. ¿Cuantos cuchillos faltan?", "answer": "1", "response": {"kind": "boxes", "count": 1, "width": "22px"}},
        {"code": "M4", "prompt": "Calcula mentalmente: 24 + 35 + 42 (tres ofertas que aparecen en el chat).", "answer": "101", "response": {"kind": "boxes", "count": 3, "width": "22px"}},
        {"code": "M5", "prompt": "Aray tiene 150 monedas. Una mejora de seguridad cuesta 45. Marca la operacion correcta.", "answer": "150 - 45", "response": {"kind": "choice", "options": ["150 + 45", "150 - 45", "45 - 150"]}},
        {"code": "M6", "prompt": "Resuelve la operacion anterior. ¿Cuantas monedas le quedarian?", "answer": "105", "response": {"kind": "boxes", "count": 3, "width": "22px"}},
        {"code": "M7", "prompt": "Aray reparte 15 monedas iguales en 3 montones para comparar ofertas. Marca la operacion.", "answer": "15 : 3", "response": {"kind": "choice", "options": ["15 + 3", "15 - 3", "15 : 3"]}},
        {"code": "M8", "prompt": "Resuelve la operacion anterior. ¿Cuantas monedas hay en cada monton?", "answer": "5", "response": {"kind": "boxes", "count": 1, "width": "22px"}},
    ],
    "school_tasks": [
        {"code": "L1", "prompt": "Copia del informe una palabra que nombre un color.", "answer": "azul", "response": {"kind": "boxes", "count": 4, "width": "22px"}},
        {"code": "L2", "prompt": "Escribe el singular de cuchillos.", "answer": "cuchillo", "response": {"kind": "lines", "count": 1}},
        {"code": "L3", "prompt": "Escribe el plural de mensaje.", "answer": "mensajes", "response": {"kind": "lines", "count": 1}},
        {"code": "L4", "prompt": "Escribe en orden alfabetico: Luca, Axel, Emma.", "answer": "Axel, Emma, Luca", "response": {"kind": "lines", "count": 1}},
        {"code": "L5", "prompt": "Completa la frase del informe: Aray ______ el historial antes de acusar.", "answer": "reviso", "response": {"kind": "choice", "options": ["reviso", "vendio", "olvidó"]}},
        {"code": "L6", "prompt": "Marca la opcion correcta. La palabra favorito se parece mas a...", "answer": "preferido", "response": {"kind": "choice", "options": ["preferido", "escondido", "barato"]}},
    ],
    "extra_area": {
        "area": "Medi",
        "title": "Medi · Cuba y Penny en la investigacion",
        "intro": "Eric dice que le gustan las mascotas raras. Aray recuerda que sus perras Cuba y Penny son mamiferos. Clasifica como en clase.",
        "support_title": "Recuerda",
        "support_lines": [
            "Los vertebrados tienen columna vertebral o espinazo.",
            "Los mamiferos son vertebrados y tienen pelo.",
            "Cuba y Penny son perras de Aray.",
        ],
        "tasks": [
            {"code": "ME1", "prompt": "Marca la opcion correcta. Una perra como Penny es...", "answer": "un vertebrado", "response": {"kind": "choice", "options": ["un vertebrado", "un invertebrado", "un mineral"]}},
            {"code": "ME2", "prompt": "Verdadero o falso.", "answer": "V, F, V", "response": {"kind": "vf", "statements": ["Cuba y Penny tienen espinazo.", "Los insectos son mamiferos.", "Eric en el tablero dice que le gustan las mascotas."]}},
            {"code": "ME3", "prompt": "¿Que animal vertebrado aparece en la vida real de Aray segun el recuadro?", "answer": "Cuba o Penny (las perras)", "response": {"kind": "lines", "count": 1}},
        ],
    },
    "final_tasks": [
        {"code": "P1", "prompt": "Segun la pista inicial del caso, ¿de que color era el cuchillo desaparecido?", "answer": "azul", "response": {"kind": "boxes", "count": 4, "width": "22px"}},
        {"code": "P2", "prompt": "Mira el tablero de sospechosos. ¿Quien lleva capa roja?", "answer": "Axel", "response": {"kind": "boxes", "count": 4, "width": "22px"}},
        {"code": "P3", "prompt": "Copia la pista del caso que acabas de descubrir.", "answer": "El culpable no llevaba capa roja.", "response": {"kind": "lines", "count": 2}},
    ],
    "special_activity": {
        "title": "Actividad especial · Sopa de letras",
        "intro": "Busca estas palabras del caso: AZUL, AXEL, CUCHILLO, ROBLOX.",
        "kind": "wordsearch",
        "words": ["AZUL", "AXEL", "CUCHILLO", "ROBLOX"],
        "grid": [
            "AZULXKTR",
            "XAXELQMC",
            "BLUEROBO",
            "UCUCHILO",
            "CHILLOXZ",
            "ROBLOXAB",
        ],
    },
    "decoder": {
        "title": "Resolucion del caso",
        "intro": "Cuando termines las actividades, escribe aqui la pista clara del capitulo.",
        "steps": [
            "1. Recuerda la pista inicial: el cuchillo era azul.",
            "2. Mira quien lleva capa roja en el tablero.",
            "3. Escribe la conclusion del caso.",
        ],
        "word": "El culpable no llevaba capa roja.",
        "student_prompt": "Escribe la pista del caso:",
        "evidence": "El culpable no llevaba capa roja.",
    },
}


PROTOTYPE_DAY_2 = {
    "day": "Martes",
    "chapter": "Capitulo 2",
    "title": "El mercado de las skins",
    "subtitle": "Sigues la investigacion de Aray con tareas del cole dentro del caso.",
    "case_name": "CASO 2: El mercado de las skins",
    "case_intro": (
        "Aray va al mercado de skins para revisar ofertas raras. No va a memorizar veinte detalles: "
        "solo quiere comprobar si alguien preguntó por cuchillos azules antes del robo. "
        "Axel, Eric, Luca y Emma siguen en la lista."
    ),
    "initial_clue": "Pista inicial: en el mercado alguien preguntó por cuchillos azules.",
    "case_resolution": "La huella encontrada pertenece a alguien zurdo.",
    "next_clue": "Nueva pista para el CASO 3: en el estadio apareció una nota sobre sombra.",
    "school_reading": {
        "title": "Registro del mercado de skins",
        "intro": "Aray y Alma pidieron el registro del mercado. Lee el documento y responde como en comprension lectora.",
        "text_lines": [
            "Al dia siguiente, Aray fue al mercado de skins con Alma.",
            "La dependienta le enseno el registro de tres intercambios.",
            "Axel habia ofrecido 24 monedas por un cuchillo comun.",
            "Emma habia ofrecido 35 gemas por una funda brillante.",
            "Luca habia ofrecido 42 monedas y 18 gemas por un cuchillo raro.",
            "Ademas, alguien pregunto si aun quedaban cuchillos azules.",
            "Aray copio los datos antes de sacar conclusiones.",
            "Primero queria entender bien el registro y despues hacer las cuentas.",
        ],
    },
    "reading_tasks": [
        {"code": "C1", "prompt": "¿Donde fue Aray al principio del registro?", "answer": "Al mercado de skins.", "response": {"kind": "lines", "count": 1}},
        {"code": "C2", "prompt": "Marca la opcion correcta. ¿Cuantas ofertas aparecen en el registro?", "answer": "3", "response": {"kind": "choice", "options": ["2", "3", "4"]}},
        {"code": "C3", "prompt": "Verdadero o falso.", "answer": "V, F, V", "response": {"kind": "vf", "statements": ["Luca ofrecio 42 monedas y 18 gemas.", "Emma ofrecio monedas por un cuchillo raro.", "Alguien pregunto por cuchillos azules."]}},
        {"code": "C4", "prompt": "Numera del 1 al 3: copia los datos, va al mercado, hace las cuentas.", "answer": "1 va al mercado, 2 copia los datos, 3 hace las cuentas", "response": {"kind": "lines", "count": 2}},
        {"code": "C5", "prompt": "En este texto, registro significa...", "answer": "lista o anotacion de datos", "response": {"kind": "choice", "options": ["lista o anotacion de datos", "un tipo de skin", "una capa de fuego"]}},
        {"code": "C6", "prompt": "¿Que detalle del registro conecta con el cuchillo desaparecido de Aray?", "answer": "La pregunta por cuchillos azules.", "response": {"kind": "lines", "count": 1}},
    ],
    "math_tasks": [
        {"code": "M1", "prompt": "En el mercado, cada proteccion de sombra cuesta 6 monedas. ¿Cuantas cuestan 2 protecciones?", "answer": "12", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
        {"code": "M2", "prompt": "Marca la operacion para calcular 2 protecciones de 6 monedas.", "answer": "2 x 6", "response": {"kind": "choice", "options": ["2 + 6", "2 x 6", "6 - 2"]}},
        {"code": "M3", "prompt": "Un cuchillo raro cuesta 8 monedas. Si ya llevas 12 monedas de protecciones, ¿cuanto pagas en total?", "answer": "20", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
        {"code": "M4", "prompt": "El comprador pago con 25 monedas y gasto 20. Marca la operacion para saber cuanto sobra.", "answer": "25 - 20", "response": {"kind": "choice", "options": ["25 + 20", "25 - 20", "20 - 25"]}},
        {"code": "M5", "prompt": "Resuelve la operacion anterior. ¿Cuantas monedas sobraron?", "answer": "5", "response": {"kind": "boxes", "count": 1, "width": "22px"}},
        {"code": "M6", "prompt": "Emma ofrecio 35 gemas. Una mejora cuesta 20 gemas. ¿Cuantas gemas le sobrarian?", "answer": "15", "response": {"kind": "boxes", "count": 2, "width": "22px"}},
        {"code": "M7", "prompt": "Aray reparte 18 gemas en 3 bolsitas iguales. Marca la operacion correcta.", "answer": "18 : 3", "response": {"kind": "choice", "options": ["18 + 3", "18 - 3", "18 : 3"]}},
        {"code": "M8", "prompt": "Resuelve la operacion anterior. ¿Cuantas gemas hay en cada bolsita?", "answer": "6", "response": {"kind": "boxes", "count": 1, "width": "22px"}},
    ],
    "school_tasks": [
        {"code": "CA1", "prompt": "Llegeix la nota trobada al mercat: No vull ales ni mascotes.", "answer": "No vull ales ni mascotes.", "response": {"kind": "lines", "count": 1}},
        {"code": "CA2", "prompt": "Marca l'opcio correcta. No vull significa...", "answer": "no quiero", "response": {"kind": "choice", "options": ["no quiero", "no veo", "no juego"]}},
        {"code": "CA3", "prompt": "Escriu el plural de gema en catala.", "answer": "gemes", "response": {"kind": "lines", "count": 1}},
        {"code": "CA4", "prompt": "Completa: Busco ganivets rars i proteccions ______.", "answer": "fosques", "response": {"kind": "choice", "options": ["fosques", "foses", "fortes"]}},
        {"code": "CA5", "prompt": "Escriu en ordre alfabetic: Axel, Emma, Luca.", "answer": "Axel, Emma, Luca", "response": {"kind": "lines", "count": 1}},
    ],
    "extra_area": {
        "area": "English",
        "title": "English · Mensaje del mercado",
        "intro": "En el mostrador habia un mensaje corto en ingles. Lee y responde con vocabulario basico.",
        "support_title": "Chat message",
        "support_lines": [
            "I saw a blue knife near the trade window.",
            "It was shiny and very cold.",
        ],
        "tasks": [
            {"code": "EN1", "prompt": "Marca la opcion correcta. Blue knife significa...", "answer": "cuchillo azul", "response": {"kind": "choice", "options": ["cuchillo azul", "ventana azul", "gema fria"]}},
            {"code": "EN2", "prompt": "Verdadero o falso.", "answer": "V, V, F", "response": {"kind": "vf", "statements": ["El mensaje habla de un cuchillo azul.", "El cuchillo estaba cerca de la ventana de intercambio.", "El cuchillo era rojo."]}},
            {"code": "EN3", "prompt": "Escribe en castellano la primera frase del mensaje.", "answer": "Vi un cuchillo azul cerca de la ventana de intercambio.", "response": {"kind": "lines", "count": 1}},
        ],
    },
    "final_tasks": [
        {"code": "P1", "prompt": "Segun la pista inicial del caso, ¿que preguntaron en el mercado?", "answer": "por cuchillos azules", "response": {"kind": "lines", "count": 1}},
        {"code": "P2", "prompt": "En el mercado encontraron una huella. ¿De que mano parece ser?", "answer": "zurdo", "response": {"kind": "boxes", "count": 5, "width": "22px"}},
        {"code": "P3", "prompt": "Copia la pista del caso que acabas de descubrir.", "answer": "La huella encontrada pertenece a alguien zurdo.", "response": {"kind": "lines", "count": 2}},
    ],
    "special_activity": {
        "title": "Actividad especial · Mensaje secreto",
        "intro": "Copia solo las letras mayusculas para descubrir una palabra del caso.",
        "kind": "message",
        "content": "En el mercado alguien escribio: aZuLeS.",
    },
    "decoder": {
        "title": "Resolucion del caso",
        "intro": "Escribe la pista clara del capitulo cuando hayas terminado.",
        "steps": [
            "1. Recuerda la pista inicial del mercado.",
            "2. Piensa en la huella encontrada.",
            "3. Escribe la conclusion del caso.",
        ],
        "word": "La huella encontrada pertenece a alguien zurdo.",
        "student_prompt": "Escribe la pista del caso:",
        "evidence": "La huella encontrada pertenece a alguien zurdo.",
    },
}


def cover_art(case_number: int = 1) -> str:
    label = f"Caso {case_number}"
    return f"""
    <svg viewBox="0 0 920 260" class="cover-art" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="bg" x1="0" x2="1">
          <stop offset="0%" stop-color="#dfe8ff"/>
          <stop offset="100%" stop-color="#fff0d8"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="920" height="260" rx="24" fill="url(#bg)"/>
      <rect x="48" y="58" width="190" height="150" rx="22" fill="#1e4db7"/>
      <rect x="82" y="90" width="120" height="14" rx="7" fill="#8fb1ff"/>
      <rect x="82" y="118" width="88" height="14" rx="7" fill="#8fb1ff"/>
      <rect x="314" y="50" width="170" height="182" rx="26" fill="#24355a"/>
      <circle cx="399" cy="100" r="34" fill="#ffd7b5"/>
      <path d="M365 94 Q399 40 433 94" fill="#1a2440"/>
      <rect x="369" y="136" width="60" height="78" rx="16" fill="#3f74ff"/>
      <path d="M342 134 L368 214 L348 228 L316 162" fill="#5a77df"/>
      <path d="M456 134 L430 214 L450 228 L482 162" fill="#5a77df"/>
      <circle cx="620" cy="214" r="24" fill="#f0d0ac"/>
      <circle cx="678" cy="214" r="24" fill="#f0d0ac"/>
      <circle cx="613" cy="206" r="5" fill="#202020"/>
      <circle cx="627" cy="206" r="5" fill="#202020"/>
      <circle cx="671" cy="206" r="5" fill="#202020"/>
      <circle cx="685" cy="206" r="5" fill="#202020"/>
      <rect x="603" y="226" width="34" height="14" rx="7" fill="#c88f62"/>
      <rect x="661" y="226" width="34" height="14" rx="7" fill="#c88f62"/>
      <rect x="712" y="46" width="150" height="82" rx="18" fill="#fff"/>
      <text x="734" y="78" font-size="25" font-family="Arial" fill="#1f2530">{label}</text>
      <text x="734" y="108" font-size="18" font-family="Arial" fill="#55627a">Operacion Nebula Blade</text>
    </svg>
    """


def render_boxes(count: int, width: str = "22px") -> str:
    return "".join(f'<span class="box" style="width:{width}"></span>' for _ in range(count))


def render_response(response: dict) -> str:
    kind = response["kind"]
    if kind == "boxes":
        return f'<div class="response-boxes">{render_boxes(response["count"], response.get("width", "22px"))}</div>'
    if kind == "lines":
        return "".join('<div class="write-line"></div>' for _ in range(response["count"]))
    if kind == "choice":
        options = []
        for option in response["options"]:
            options.append(f'<div class="choice-option"><span class="choice-mark"></span><span>{escape(option)}</span></div>')
        return f'<div class="choice-group">{"".join(options)}</div>'
    if kind == "vf":
        rows = []
        for statement in response["statements"]:
            rows.append(f"<tr><td>{escape(statement)}</td><td class='vf-cell'></td><td class='vf-cell'></td></tr>")
        return f"""
        <table class="vf-table">
          <thead><tr><th>Enunciado</th><th>V</th><th>F</th></tr></thead>
          <tbody>{''.join(rows)}</tbody>
        </table>
        """
    raise ValueError(f"Tipo de respuesta no soportado: {kind}")


def render_task(task: dict) -> str:
    return f"""
    <div class="task-card">
      <div class="task-code">{escape(task['code'])}</div>
      <div class="task-body">
        <p class="task-prompt">{escape(task['prompt'])}</p>
        {render_response(task['response'])}
      </div>
    </div>
    """


def render_section(title: str, intro: str, tasks: list[dict], badge: str | None = None) -> str:
    badge_html = f'<div class="section-badge">{escape(badge)}</div>' if badge else ""
    return f"""
    <section class="panel">
      {badge_html}
      <h3>{escape(title)}</h3>
      <p class="section-intro">{escape(intro)}</p>
      {''.join(render_task(task) for task in tasks)}
    </section>
    """


def render_lines(lines: list[str], numbered: bool = False) -> str:
    if numbered:
        return (
            "<div class='story-lines'>"
            + "".join(
                f"<div class='story-line-row'><span class='story-line-num'>{idx}.</span><span>{escape(line)}</span></div>"
                for idx, line in enumerate(lines, start=1)
            )
            + "</div>"
        )
    return "<div class='support-lines'>" + "".join(f"<p>{escape(line)}</p>" for line in lines) + "</div>"


def render_support_panel(block: dict) -> str:
    if not block.get("support_lines"):
        return ""
    return f"""
    <section class="story-panel support-panel">
      <h3>{escape(block.get('support_title', 'Texto de apoyo'))}</h3>
      {render_lines(block['support_lines'])}
    </section>
    """


def render_decoder(decoder: dict) -> str:
    steps_html = "<ol class='decoder-steps'>" + "".join(f"<li>{escape(step)}</li>" for step in decoder["steps"]) + "</ol>"
    if len(decoder["word"]) <= 8:
        answer_html = f'<div class="response-boxes">{render_boxes(len(decoder["word"]), "24px")}</div>'
    else:
        answer_html = '<div class="write-line"></div><div class="write-line"></div>'
    return f"""
    <section class="panel decoder-panel">
      <h3>{escape(decoder['title'])}</h3>
      <p class="section-intro">{escape(decoder['intro'])}</p>
      {steps_html}
      <div class="decoder-word">
        <p><strong>{escape(decoder.get('student_prompt', 'Escribe aqui la pista.'))}</strong></p>
        {answer_html}
      </div>
    </section>
    """


def render_bonus(day: dict) -> str:
    if "bonus_grid" not in day:
        return ""
    rows = "".join(f"<div class='wordsearch-row'>{' '.join(list(row))}</div>" for row in day["bonus_grid"])
    return f"""
    <section class="panel bonus-panel">
      <h3>Bonus final</h3>
      <p class="section-intro">Busca estas palabras del caso: {', '.join(day['bonus_words'])}.</p>
      <div class="wordsearch-box">{rows}</div>
    </section>
    """


def render_case_intro_page(day: dict, progress: int) -> str:
    rows = "".join(
        f"<tr><td>{escape(s['name'])}</td><td>{escape(s['cape'])}</td><td>{escape(s['likes'])}</td><td class='vf-cell'></td></tr>"
        for s in SUSPECTS
    )
    return f"""
    <article class="page cover-page">
      <header class="page-head">
        <div class="chapter-pill">{escape(day['chapter'])}</div>
        <h1>{escape(day.get('case_name', day['title']))}</h1>
        <p class="subtitle">Historia breve · sospechosos · pista inicial. Luego investigas con fichas del cole.</p>
      </header>
      {cover_art(progress)}
      <section class="hero">
        <h3>{escape(day['title'])}</h3>
        <p>{escape(day['case_intro'])}</p>
      </section>
      <section class="panel">
        <h3>Sospechosos</h3>
        <table class="suspect-table">
          <thead><tr><th>Nombre</th><th>Capa</th><th>Le gusta</th><th>Tachar</th></tr></thead>
          <tbody>{rows}</tbody>
        </table>
      </section>
      <section class="panel decoder-panel">
        <h3>Pista inicial</h3>
        <p>{escape(day['initial_clue'])}</p>
      </section>
      <footer class="footer-line">Pagina 1 · Marco del caso (~10%) · Avance: {'★' * progress}{'☆' * (5 - progress)}</footer>
    </article>
    """


def render_comprehension_page(day: dict, progress: int) -> str:
    reading = day["school_reading"]
    return f"""
    <article class="page">
      <header class="page-head">
        <div class="chapter-pill">{escape(day['chapter'])}</div>
        <h1>Comprension lectora</h1>
        <p class="subtitle">Documento del caso. Lee el texto y responde como en el cole; las respuestas estan en la pagina.</p>
      </header>
      <section class="story-panel">
        <h3>{escape(reading['title'])}</h3>
        {render_lines(reading['text_lines'], numbered=True)}
      </section>
      {render_section("Actividades", escape(reading["intro"]), day["reading_tasks"], "Castellano")}
      <footer class="footer-line">Pagina 2 · Actividades escolares · Avance: {'★' * progress}{'☆' * (5 - progress)}</footer>
    </article>
    """


def render_special_activity(day: dict) -> str:
    activity = day.get("special_activity")
    if not activity:
        return ""
    if activity["kind"] == "wordsearch":
        rows = "".join(f"<div class='wordsearch-row'>{escape(row)}</div>" for row in activity["grid"])
        body = f"<div class='wordsearch-box'>{rows}</div>"
    elif activity["kind"] == "word_box":
        body = f"<div class='wordsearch-box'><div class='wordsearch-row'>{escape(activity['content'])}</div></div>"
    else:
        body = f"<div class='decoder-word'><p>{escape(activity['content'])}</p></div>"
    return f"""
    <section class="panel bonus-panel">
      <h3>{escape(activity['title'])}</h3>
      <p class="section-intro">{escape(activity['intro'])}</p>
      {body}
    </section>
    """


def render_cover() -> str:
    rows = "".join(
        f"<tr><td>{escape(s['name'])}</td><td>{escape(s['cape'])}</td><td>{escape(s['likes'])}</td><td class='vf-cell'></td></tr>"
        for s in SUSPECTS
    )
    return f"""
    <article class="page cover-page">
      <section class="hero">
        <div class="chapter-pill">Semana 1 especial</div>
        <h1>Operacion Nebula Blade</h1>
        <p class="subtitle">La historia engancha (~10%). Las actividades son del cole (~80%) dentro del caso. Las pistas cierran cada episodio (~10%).</p>
        {cover_art(0)}
      </section>
      <section class="panel">
        <h3>Pagina 0 · Inicio de la mision</h3>
        <p>Aray tiene una coleccion de cuchillos en Roblox y su favorito se llama <strong>Frost Fang</strong>. Anoche estaba en su inventario y hoy ha desaparecido. Antes de acusar a nadie, quiere revisar datos, leer con calma y conectar pistas de varias asignaturas.</p>
      </section>
      <section class="panel">
        <h3>Lo que sabemos al empezar</h3>
        <ul>
          <li>Anoche Aray tenia 18 cuchillos en el inventario.</li>
          <li>Hoy solo aparecen 17.</li>
          <li>El cuchillo que falta es azul.</li>
          <li>Hay cuatro sospechosos iniciales: Axel, Eric, Luca y Emma.</li>
        </ul>
      </section>
      <section class="panel">
        <h3>Como funciona cada capitulo</h3>
        <ol>
          <li>Portada del caso con historia breve, sospechosos y pista inicial.</li>
          <li>Comprension, mates, lengua, catala, medi o ingles: formato del cole, contenido del caso.</li>
          <li>Actividades especiales de investigacion de vez en cuando.</li>
          <li>Prueba final con una pista clara para el siguiente capitulo.</li>
        </ol>
      </section>
      <section class="panel">
        <h3>Tablero de sospechosos</h3>
        <table class="suspect-table">
          <thead><tr><th>Nombre</th><th>Capa</th><th>Le gusta</th><th>Tachar</th></tr></thead>
          <tbody>{rows}</tbody>
        </table>
      </section>
    </article>
    """


def render_reading_page(day: dict, progress: int) -> str:
    return f"""
    <article class="page">
      <header class="page-head">
        <div class="chapter-pill">{escape(day['chapter'])}</div>
        <h1>{escape(day['title'])}</h1>
        <p class="subtitle">{escape(day['subtitle'])}</p>
      </header>
      <section class="story-panel">
        <h3>Lectura del caso</h3>
        {render_lines(day['story_lines'], numbered=True)}
      </section>
      {render_section("Comprension lectora", "Lee con atencion, vuelve al texto y justifica con pistas concretas.", day["reading_tasks"], "Bloque 1")}
      <footer class="footer-line">Pagina 1 del capitulo · Avance semanal: {'★' * progress}{'☆' * (5 - progress)}</footer>
    </article>
    """


def render_math_page(day: dict, progress: int) -> str:
    return f"""
    <article class="page">
      <header class="page-head">
        <div class="chapter-pill">{escape(day['chapter'])}</div>
        <h1>Matematicas</h1>
        <p class="subtitle">Problemas del caso: monedas, gemas, horas y repartos. Mismo formato que en clase.</p>
      </header>
      {render_section("Problemas del caso", "Lee el enunciado, elige la operacion y calcula. Todo ocurre dentro de la investigacion.", day["math_tasks"], "Matematicas")}
      <footer class="footer-line">Pagina 3 · Actividades escolares · Avance: {'★' * progress}{'☆' * (5 - progress)}</footer>
    </article>
    """


def render_subjects_page(day: dict, progress: int) -> str:
    extra = day.get("extra_area")
    extra_html = ""
    if extra:
        extra_html = f"""
        {render_support_panel(extra)}
        {render_section(extra['title'], extra['intro'], extra['tasks'], extra['area'])}
        """
    subject_label = "Catala" if any(task["code"].startswith("CA") for task in day.get("school_tasks", [])) else "Lengua"
    return f"""
    <article class="page">
      <header class="page-head">
        <div class="chapter-pill">{escape(day['chapter'])}</div>
        <h1>Otras asignaturas</h1>
        <p class="subtitle">Lengua, catala, medi o ingles con pruebas y pistas del caso.</p>
      </header>
      {render_section(subject_label, "Trabaja como en clase, pero con documentos y datos de la investigacion.", day["school_tasks"], subject_label)}
      {extra_html}
      {render_special_activity(day)}
      <footer class="footer-line">Pagina 4 · Actividades escolares · Avance: {'★' * progress}{'☆' * (5 - progress)}</footer>
    </article>
    """


def render_case_closing(day: dict, progress: int) -> str:
    return f"""
    <article class="page">
      <header class="page-head">
        <div class="chapter-pill">{escape(day['chapter'])}</div>
        <h1>Prueba final del caso</h1>
        <p class="subtitle">Cierra el episodio con pistas claras. Solo aqui conectas con la investigacion.</p>
      </header>
      {render_section("Prueba final", "Responde y escribe la pista del caso.", day["final_tasks"], "Investigacion")}
      {render_decoder(day["decoder"])}
      <section class="panel decoder-panel">
        <h3>Pista del caso</h3>
        <p><strong>{escape(day['case_resolution'])}</strong></p>
      </section>
      <section class="panel">
        <h3>Siguiente capitulo</h3>
        <p>{escape(day['next_clue'])}</p>
      </section>
      <footer class="footer-line">Pagina 5 · Pistas y resolucion (~10%) · Avance: {'★' * progress}{'☆' * (5 - progress)}</footer>
    </article>
    """


def render_extra_page(day: dict, progress: int) -> str:
    extra = day["extra_area"]
    return f"""
    <article class="page">
      <header class="page-head">
        <div class="chapter-pill">{escape(day['chapter'])}</div>
        <h1>{escape(extra['title'])}</h1>
        <p class="subtitle">El cuarto bloque rota segun la logica del caso para mezclar asignaturas sin cortar la historia.</p>
      </header>
      {render_support_panel(extra)}
      {render_section(extra['title'], extra['intro'], extra['tasks'], f"Bloque 3 · {extra['area']}")}
      {render_section("Cruce de pistas", "Junta lectura, mates y el bloque rotativo para decidir que conclusion se puede sostener ya.", day["final_tasks"], "Bloque 4")}
      {render_decoder(day["decoder"])}
      {render_bonus(day)}
      <footer class="footer-line">Pagina 3 del capitulo · Avance semanal: {'★' * progress}{'☆' * (5 - progress)}</footer>
    </article>
    """


def render_school_page(day: dict, progress: int) -> str:
    return f"""
    <article class="page">
      <header class="page-head">
        <div class="chapter-pill">{escape(day['chapter'])}</div>
        <h1>Lengua a partir del texto</h1>
        <p class="subtitle">Vocabulario, orden alfabetico, singular y plural, y una prueba final muy breve.</p>
      </header>
      {render_section("Lengua", "Trabaja como en una ficha de clase: copia, clasifica, completa y escribe solo lo necesario.", day["school_tasks"], "Bloque 3")}
      {render_section("Prueba final", "Resume la pista importante del capitulo sin inventar nada que no aparezca en el texto.", day["final_tasks"], "Bloque 4")}
      {render_decoder(day["decoder"])}
      {render_special_activity(day)}
      <section class="panel decoder-panel">
        <h3>Nueva pista</h3>
        <p>{escape(day['next_clue'])}</p>
      </section>
      <footer class="footer-line">Pagina 3 del capitulo · Avance semanal: {'★' * progress}{'☆' * (5 - progress)}</footer>
    </article>
    """


def render_solution_page(day: dict) -> str:
    rows = []
    for area, tasks in [
        ("Comprension", day["reading_tasks"]),
        ("Mates", day["math_tasks"]),
        ("Prueba final", day["final_tasks"]),
    ]:
        for task in tasks:
            rows.append(
                f"<tr><td>{escape(area)}</td><td>{escape(task['code'])}</td><td>{escape(task['prompt'])}</td><td>{escape(task['answer'])}</td></tr>"
            )
    if day.get("school_tasks"):
        subject = "Catala" if any(task["code"].startswith("CA") for task in day["school_tasks"]) else "Lengua"
        for task in day["school_tasks"]:
            rows.append(
                f"<tr><td>{subject}</td><td>{escape(task['code'])}</td><td>{escape(task['prompt'])}</td><td>{escape(task['answer'])}</td></tr>"
            )
    if day.get("extra_area"):
        for task in day["extra_area"]["tasks"]:
            rows.append(
                f"<tr><td>{escape(day['extra_area']['area'])}</td><td>{escape(task['code'])}</td><td>{escape(task['prompt'])}</td><td>{escape(task['answer'])}</td></tr>"
            )
    return f"""
    <article class="page solution-page">
      <header class="page-head">
        <div class="chapter-pill">Soluciones · {escape(day['chapter'])}</div>
        <h1>{escape(day.get('case_name', day['title']))}</h1>
        <p class="subtitle">{escape(day['subtitle'])}</p>
      </header>
      <section class="panel">
        <h3>Correccion del capitulo</h3>
        <table class="solution-table">
          <thead><tr><th>Area</th><th>Codigo</th><th>Ejercicio</th><th>Respuesta</th></tr></thead>
          <tbody>{''.join(rows)}</tbody>
        </table>
      </section>
      <section class="panel decoder-panel">
        <h3>Resolucion del caso</h3>
        <p><strong>Pista del caso:</strong> {escape(day['case_resolution'])}</p>
        <p><strong>Siguiente capitulo:</strong> {escape(day['next_clue'])}</p>
      </section>
    </article>
    """


def search_entries() -> list[dict]:
    entries = []
    for day in DAYS:
        area_sets = [
            ("Comprension", day["reading_tasks"]),
            ("Mates", day["math_tasks"]),
            (day["extra_area"]["area"], day["extra_area"]["tasks"]),
            ("Prueba final", day["final_tasks"]),
        ]
        for area, tasks in area_sets:
            for task in tasks:
                entries.append(
                    {
                        "day": day["day"],
                        "chapter": day["chapter"],
                        "title": day["title"],
                        "area": area,
                        "code": task["code"],
                        "prompt": task["prompt"],
                        "answer": task["answer"],
                        "evidence": day["decoder"]["evidence"],
                    }
                )
        entries.append(
            {
                "day": day["day"],
                "chapter": day["chapter"],
                "title": day["title"],
                "area": "Codigo",
                "code": "COD",
                "prompt": day["decoder"]["title"],
                "answer": day["decoder"]["word"],
                "evidence": day["decoder"]["evidence"],
            }
        )
    return entries


def render_search_page() -> str:
    entries = search_entries()
    areas = sorted({entry["area"] for entry in entries})
    cards = []
    for entry in entries:
        blob = " ".join(
            [entry["day"], entry["chapter"], entry["title"], entry["area"], entry["code"], entry["prompt"], entry["answer"], entry["evidence"]]
        ).lower()
        cards.append(
            f"""
            <article class="search-card" data-day="{escape(entry['day'])}" data-area="{escape(entry['area'])}" data-search="{escape(blob)}">
              <div class="search-top">
                <span class="chip">{escape(entry['day'])}</span>
                <span class="chip alt">{escape(entry['area'])}</span>
              </div>
              <h2>{escape(entry['title'])}</h2>
              <p class="search-meta">{escape(entry['code'])}</p>
              <section class="search-block">
                <h3>Ejercicio</h3>
                <p>{escape(entry['prompt'])}</p>
              </section>
              <section class="search-block answer">
                <h3>Respuesta</h3>
                <p>{escape(entry['answer'])}</p>
              </section>
              <section class="search-block clue">
                <h3>Prueba del capitulo</h3>
                <p>{escape(entry['evidence'])}</p>
              </section>
            </article>
            """
        )

    area_options = "".join(f'<option value="{escape(area)}">{escape(area)}</option>' for area in areas)
    day_options = "".join(f'<option value="{escape(day["day"])}">{escape(day["day"])}</option>' for day in DAYS)

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Buscador · Operacion Nebula Blade</title>
  <style>{search_css()}</style>
</head>
<body>
  <div class="shell">
    <section class="search-hero">
      <div class="chapter-pill">Semana 1 especial</div>
      <h1>Buscador de ejercicios y pruebas</h1>
      <p>Busca por capitulo, tipo de tarea, palabra del texto, sospechoso, respuesta o asignatura.</p>
    </section>
    <section class="controls">
      <div class="control">
        <label for="searchBox">Buscar</label>
        <input id="searchBox" type="text" placeholder="Ejemplo: sombra, Luca, EN2, coartada, Emma..." />
      </div>
      <div class="control">
        <label for="dayFilter">Dia</label>
        <select id="dayFilter">
          <option value="">Todos</option>
          {day_options}
        </select>
      </div>
      <div class="control">
        <label for="areaFilter">Area</label>
        <select id="areaFilter">
          <option value="">Todas</option>
          {area_options}
        </select>
      </div>
    </section>
    <p id="summary" class="summary"></p>
    <section id="results" class="search-results">{''.join(cards)}</section>
  </div>
  <script>
    const searchBox = document.getElementById('searchBox');
    const dayFilter = document.getElementById('dayFilter');
    const areaFilter = document.getElementById('areaFilter');
    const summary = document.getElementById('summary');
    const cards = Array.from(document.querySelectorAll('.search-card'));

    function applyFilters() {{
      const text = searchBox.value.trim().toLowerCase();
      const day = dayFilter.value;
      const area = areaFilter.value;
      let visible = 0;
      for (const card of cards) {{
        const matchesText = !text || card.dataset.search.includes(text);
        const matchesDay = !day || card.dataset.day === day;
        const matchesArea = !area || card.dataset.area === area;
        const show = matchesText && matchesDay && matchesArea;
        card.classList.toggle('hidden', !show);
        if (show) visible += 1;
      }}
      summary.textContent = `${{visible}} ejercicios visibles de ${{cards.length}}.`;
    }}

    searchBox.addEventListener('input', applyFilters);
    dayFilter.addEventListener('change', applyFilters);
    areaFilter.addEventListener('change', applyFilters);
    applyFilters();
  </script>
</body>
</html>
"""


def document_css() -> str:
    return """
    @page { size: A4; margin: 8mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #edf2fb; color: #1f2530; font-family: Arial, Helvetica, sans-serif; }
    .page { width: 196mm; min-height: 279mm; margin: 6mm auto; padding: 8mm 9mm; background: #fff; border: 1px solid #d5ddec; border-radius: 12px; page-break-after: always; }
    .hero, .panel, .story-panel { border-radius: 12px; border: 1px solid #d7e1f8; padding: 12px; margin-bottom: 10px; }
    .hero { background: linear-gradient(180deg, #eef3ff 0%, #fff7ea 100%); }
    .story-panel { background: #f8fbff; }
    .support-panel { background: #fffdfa; border-color: #eadfb6; }
    .decoder-panel { background: #f5fff2; border-color: #d6e8cc; }
    .bonus-panel { background: #fffdf4; border-color: #eadfb6; }
    .chapter-pill { display: inline-block; padding: 6px 10px; background: #e8efff; color: #1e4db7; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
    .section-badge { display: inline-block; margin-bottom: 8px; padding: 4px 9px; background: #eef2ff; color: #314f98; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    h1 { margin: 8px 0 6px 0; font-size: 28px; }
    h3 { margin: 0 0 8px 0; font-size: 17px; }
    p, li, td, th { font-size: 13.6px; line-height: 1.42; }
    .subtitle { margin: 0; color: #4b5871; }
    .cover-art { width: 100%; height: auto; margin-top: 10px; }
    .suspect-table, .solution-table, .vf-table { width: 100%; border-collapse: collapse; }
    .suspect-table th, .suspect-table td, .solution-table th, .solution-table td, .vf-table th, .vf-table td { border: 1px solid #c9d2e5; padding: 6px; text-align: left; vertical-align: top; }
    .vf-cell { width: 34px; text-align: center; }
    .vf-cell::before { content: ""; display: inline-block; width: 16px; height: 16px; border: 2px solid #7d90ba; border-radius: 4px; }
    .task-card { display: grid; grid-template-columns: 48px 1fr; gap: 10px; margin-bottom: 9px; }
    .task-code { background: #1e4db7; color: #fff; border-radius: 10px; text-align: center; padding: 8px 0; font-size: 14px; font-weight: 700; }
    .task-prompt { margin: 0 0 6px 0; }
    .section-intro { margin: 0 0 8px 0; color: #5a6882; }
    .response-boxes { display: flex; flex-wrap: wrap; gap: 4px; }
    .box { display: inline-block; height: 28px; border: 2px solid #93a7d4; border-radius: 6px; background: #fff; }
    .write-line { height: 24px; border-bottom: 2px solid #aeb9cf; margin-top: 5px; }
    .choice-group { display: grid; gap: 5px; }
    .choice-option { display: flex; align-items: center; gap: 8px; min-height: 24px; }
    .choice-mark { width: 16px; height: 16px; border: 2px solid #8396be; border-radius: 4px; display: inline-block; }
    .story-lines { margin-top: 6px; }
    .story-line-row { display: grid; grid-template-columns: 26px 1fr; gap: 6px; margin: 3px 0; font-size: 14px; }
    .story-line-num { font-weight: 700; color: #1e4db7; }
    .support-lines p { margin: 0 0 6px 0; }
    .decoder-word { margin-top: 10px; padding: 10px; background: #fff; border: 1px dashed #88a370; border-radius: 10px; }
    .decoder-steps { margin: 8px 0 10px 20px; padding: 0; }
    .evidence-box { margin-top: 10px; padding: 10px; background: #fff; border: 1px dashed #88a370; border-radius: 10px; }
    .wordsearch-box { margin-top: 8px; padding: 10px; border: 2px solid #9bb0da; border-radius: 10px; background: #fff; }
    .wordsearch-row { font-family: "Courier New", monospace; font-size: 20px; letter-spacing: 4px; line-height: 1.25; }
    .footer-line { margin-top: 10px; color: #55627a; font-size: 13px; }
    @media print {
      body { background: #fff; }
      .page { width: auto; margin: 0; border: none; border-radius: 0; }
    }
    """


def search_css() -> str:
    return """
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: #f4f6fb; color: #1f2530; }
    .shell { max-width: 1180px; margin: 0 auto; padding: 24px; }
    .search-hero { background: linear-gradient(180deg, #eef3ff 0%, #fff7ea 100%); border: 1px solid #d7e1f8; border-radius: 16px; padding: 20px; margin-bottom: 16px; }
    .search-hero h1 { margin: 8px 0 6px 0; font-size: 30px; }
    .chapter-pill { display: inline-block; padding: 6px 10px; background: #e8efff; color: #1e4db7; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .controls { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .control { background: #fff; border: 1px solid #d8deea; border-radius: 12px; padding: 12px; }
    label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #55627a; text-transform: uppercase; }
    input, select { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #bcc8df; font-size: 15px; }
    .summary { margin: 0 0 14px 0; color: #44506a; }
    .search-results { display: grid; gap: 14px; }
    .search-card { background: #fff; border: 1px solid #d8deea; border-radius: 14px; padding: 16px; }
    .search-top { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
    .chip { display: inline-block; padding: 5px 10px; border-radius: 999px; background: #e9efff; color: #1e4db7; font-size: 13px; font-weight: 700; }
    .chip.alt { background: #edf8eb; color: #36611c; }
    .search-card h2 { margin: 0 0 6px 0; font-size: 22px; }
    .search-meta { margin: 0 0 10px 0; color: #55627a; }
    .search-block { padding: 12px; border-radius: 10px; background: #f8faff; border: 1px solid #dfe6f5; margin-bottom: 10px; }
    .search-block.answer { background: #f4fbf1; border-color: #d6e8cc; }
    .search-block.clue { background: #fffdf1; border-color: #eadfb6; }
    .search-block h3 { margin: 0 0 8px 0; font-size: 16px; }
    .search-block p { margin: 0; line-height: 1.5; }
    .hidden { display: none; }
    @media (max-width: 900px) { .controls { grid-template-columns: 1fr; } }
    """


def wrap_document(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>{escape(title)}</title>
  <style>{document_css()}</style>
</head>
<body>
{body}
</body>
</html>
"""


def build_prototype_pages(day: dict, progress: int) -> list[str]:
    return [
        render_case_intro_page(day, progress),
        render_comprehension_page(day, progress),
        render_math_page(day, progress),
        render_subjects_page(day, progress),
        render_case_closing(day, progress),
    ]


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    output_dir = base_dir / "salida"
    output_dir.mkdir(exist_ok=True)

    prototype_day = PROTOTYPE_DAY
    prototype_pages = build_prototype_pages(prototype_day, 1)
    prototype_solutions = [render_solution_page(prototype_day)]
    prototype_day_2 = PROTOTYPE_DAY_2
    prototype_pages_2 = build_prototype_pages(prototype_day_2, 2)
    prototype_solutions_2 = [render_solution_page(prototype_day_2)]

    outputs = {
        "caso_01_el_cuchillo_desaparecido.html": [render_cover(), *prototype_pages],
        "caso_01_soluciones.html": prototype_solutions,
        "caso_02_el_mercado_de_las_skins.html": prototype_pages_2,
        "caso_02_soluciones.html": prototype_solutions_2,
    }
    for filename, pages in outputs.items():
        title = filename.replace("_", " ").replace(".html", "")
        (output_dir / filename).write_text(
            wrap_document(title, "".join(pages)),
            encoding="utf-8",
        )

    legacy_files = [
        "dia_01_prototipo_escolar.html",
        "dia_01_prototipo_escolar_v2.html",
        "dia_01_prototipo_escolar_soluciones.html",
        "dia_01_prototipo_escolar_soluciones_v2.html",
        "dia_02_prototipo_escolar.html",
        "dia_02_prototipo_escolar_v2.html",
        "dia_02_prototipo_escolar_soluciones.html",
        "dia_02_prototipo_escolar_soluciones_v2.html",
        "semana_01_mision_especial.html",
        "semana_01_mision_especial_soluciones.html",
        "buscador_mision_semana1.html",
    ]
    for legacy in legacy_files:
        path = output_dir / legacy
        if path.exists():
            path.unlink()


if __name__ == "__main__":
    main()
