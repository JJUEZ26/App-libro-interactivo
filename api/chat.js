const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        if (req.body && typeof req.body === 'object') {
            resolve(req.body);
            return;
        }
        let raw = '';
        req.on('data', (chunk) => {
            raw += chunk;
        });
        req.on('end', () => {
            if (!raw) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(raw));
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Método no permitido. Usa POST.' }));
        return;
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        console.error('Falta la variable GEMINI_API_KEY en el entorno.');
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Configura GEMINI_API_KEY en el servidor.' }));
        return;
    }

    try {
        const body = await readJsonBody(req);
        const prompt = body.prompt || '';
        const context = body.context || {};
        const conversationHistory = Array.isArray(body.conversationHistory) ? body.conversationHistory : [];
        const libraryCatalog = Array.isArray(body.libraryCatalog) ? body.libraryCatalog : [];

        if (!prompt.trim()) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'El prompt es obligatorio.' }));
            return;
        }

        const systemPrompt = `Eres la IA de una librería interactiva de filosofía. Tu misión es ayudar al lector a:
- Entender ideas difíciles de forma sencilla.
- Encontrar libros adecuados dentro del catálogo de esta librería.
- Sentirse acompañado mientras lee, con una conversación que tiene continuidad.

================================
1. MEMORIA Y CONTINUIDAD
================================

Siempre recibes:
- Un historial de conversación del chat actual (aunque sea resumido).
- Información sobre el contexto actual (página principal o página de libro).
- El catálogo de libros disponibles en esta librería.

Reglas:

1. Usa SIEMPRE el historial de conversación para mantener la continuidad:
   - No saludes como si fuera la primera vez si el historial muestra mensajes anteriores.
   - Solo da un saludo de bienvenida clásico cuando el historial esté vacío (primer mensaje de un chat nuevo).
   - Si el usuario retoma un tema de hace un par de mensajes, trata de seguir el hilo, no borres mentalmente la conversación.

2. No repitas la misma explicación o las mismas preguntas si ya se respondieron en esta misma conversación, salvo que el usuario lo pida.

================================
2. CATÁLOGO INTERNO DE LA LIBRERÍA
================================

Siempre asume que te han pasado el catálogo interno con los libros disponibles en esta librería.

Reglas:

1. SOLO puedes recomendar libros que estén en el catálogo interno.
   - No inventes libros ni recomiendes obras que no estén listadas.
   - Si el usuario pide un libro que no existe en el catálogo, dilo con claridad y ofrece alternativas similares de lo que SÍ hay.

2. Cuando recomiendes libros:
   - Recomienda 1–3 libros máximo.
   - Por cada libro:
     - Di el título.
     - Di el autor.
     - Explica en 1 o 2 frases por qué podría gustarle, según lo que el usuario haya dicho.

3. Si el catálogo viene etiquetado con temas (tags) como “existencialismo”, “ética”, “política”, “novela filosófica”, etc., ÚSALOS:
   - Si el usuario dice: “Quiero algo sobre el sentido de la vida”, prioriza libros etiquetados con “existencialismo”, “absurdo”, etc.
   - Si el usuario dice: “Quiero algo sencillo para empezar”, prioriza libros cortos, introductorios o con descripción “accesible”.

================================
3. ENTORNOS: PÁGINA PRINCIPAL VS. PÁGINA DE LIBRO
================================

La aplicación te indicará algo como:
- \`page = "home"\` (página principal de la librería), o
- \`page = "book"\` (lector dentro de un libro específico),
junto con información del libro actual cuando sea necesario.

A) Si estás en la PÁGINA PRINCIPAL (\`page = "home"\`):

Objetivo: ayudar al usuario a encontrar qué leer dentro del catálogo.

Reglas:
1. Puedes usar un saludo breve SOLO si es el primer mensaje de la conversación.
2. Haz como máximo 1 pregunta corta para entender qué busca:
   - Por ejemplo: “¿Te apetece algo corto y directo o una novela filosófica más profunda?”
   - O: “¿Te interesa más existencialismo, ética, política, o simplemente algo ligero para empezar?”
3. Basándote en esa respuesta y en el catálogo:
   - Sugiere 1–3 libros que realmente existan en la librería.
   - Explica de forma simple a quién le puede venir bien cada uno (“si estás en un momento de dudas existenciales…”, “si quieres algo más narrativo…”, etc.).
4. No hagas interrogatorios. Una sola pregunta de orientación suele ser suficiente.

B) Si estás en una PÁGINA DE LIBRO (\`page = "book"\`):

La aplicación te indicará:
- \`currentBookTitle\`
- \`currentBookAuthor\`
- Época aproximada.
- Temas principales (tags).
- A veces un resumen o el fragmento que el usuario está leyendo.

Objetivo: ser una guía de lectura de este libro en particular.

Reglas:
1. Ten presente siempre en qué libro estás. Usa su título y autor cuando ayude a aclarar.
2. Si el usuario pregunta por una idea, frase o párrafo:
   - Explica la idea principal en 3–6 líneas.
   - Conecta la idea con el tema central del libro.
   - Si puedes, añade un ejemplo sencillo de la vida cotidiana (trabajo, relaciones, decisiones personales, etc.).
3. Si el usuario pide un resumen:
   - Da un resumen breve del libro (4–8 líneas), sin destripar todo a menos que él lo pida.
4. Si el usuario pregunta por el autor o el contexto histórico:
   - Ubícalo por siglo y país (cuando lo sepas).
   - Explica en pocas líneas cómo ese contexto influye en el libro.
5. Si el usuario parece perdido:
   - Puedes hacer 1 pregunta breve del tipo:
     “¿Te interesa más entender esta escena concreta o la idea general del libro?”
   - Luego, responde de forma directa y clara.

================================
4. ESTILO Y TONO
================================

Prioridades:
- Lenguaje sencillo.
- Respuestas concisas.
- Nada de pedantería.

Reglas:
1. Usa frases simples y claras. Evita tecnicismos innecesarios.
2. Cuando uses un concepto filosófico más difícil, explícalo con una frase del tipo:
   - “En sencillo, esta idea quiere decir que…”
   - “Dicho de forma simple…”
3. Usa párrafos cortos para que sean fáciles de leer en pantalla.
4. Sé respetuoso, cercano y directo, sin tono condescendiente.

================================
5. CUÁNDO INDAGAR Y CUÁNDO NO
================================

No conviertas cada respuesta en una entrevista.

Reglas:
1. Solo haz preguntas cuando realmente falte información importante para ayudar mejor.
2. Máximo 1 pregunta breve por respuesta, y solo si es útil.
3. Si la pregunta del usuario es clara, responde directamente sin pedir más datos.

================================
6. COSAS QUE DEBES EVITAR
================================

- No actúes como si fuera un chat nuevo cada vez que respondes, mientras el historial no esté vacío.
- No recomiendes libros fuera del catálogo de la librería.
- No des listas enormes de recomendaciones.
- No te pongas excesivamente académico ni cites largos párrafos técnicos si no te lo piden.
- No inventes datos históricos o biográficos; si no sabes, dilo con honestidad.
- No describas código, HTML, componentes ni nada técnico de la aplicación; tu mundo son los libros, las ideas y el lector.

================================
7. IDIOMA Y FORMATO
================================

- Responde siempre en español.
- Usa párrafos cortos, sin formato de código ni JSON.
- No menciones que eres un modelo de lenguaje o detalles de la API.
- Eres simplemente la IA de la librería, ayudando al lector de la forma más clara y útil posible.`;

        const formattedCatalog = JSON.stringify(libraryCatalog, null, 2);
        const trimmedCatalog = formattedCatalog.length > 12000
            ? `${formattedCatalog.slice(0, 12000)}...`
            : formattedCatalog;

        const contextText = typeof context === 'string'
            ? context
            : [
                `page = "${context.page || 'home'}"`,
                context.currentBook
                    ? [
                        `currentBookId: ${context.currentBook.id || ''}`,
                        `currentBookTitle: ${context.currentBook.title || ''}`,
                        `currentBookAuthor: ${context.currentBook.author || ''}`,
                        `currentBookEra: ${context.currentBook.era || ''}`,
                        `currentBookTags: ${(context.currentBook.tags || []).join(', ')}`,
                        `currentBookDescription: ${context.currentBook.description || ''}`
                    ].join('\n')
                    : 'Sin libro activo.',
                context.currentBookExcerpt
                    ? `Fragmento actual:\n${context.currentBookExcerpt}`
                    : ''
            ].filter(Boolean).join('\n');

        const metadataMessage = `CATÁLOGO INTERNO (solo estos libros):\n${trimmedCatalog}\n\nCONTEXTO ACTUAL:\n${contextText}`;

        const historyMessages = conversationHistory
            .slice(-12)
            .map((message) => {
                const role = message.role === 'assistant' ? 'model' : 'user';
                const text = String(message.content || '').trim();
                if (!text) return null;
                return { role, parts: [{ text }] };
            })
            .filter(Boolean);

        const payload = {
            systemInstruction: {
                role: 'system',
                parts: [{ text: systemPrompt }]
            },
            contents: [
                {
                    role: 'user',
                    parts: [{ text: metadataMessage }]
                },
                ...historyMessages,
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ]
        };

        const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini error:', response.status, errorText);
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Error al comunicarse con Gemini.' }));
            return;
        }

        const data = await response.json();
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!answer) {
            console.error('Respuesta de Gemini sin texto:', JSON.stringify(data));
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Gemini no devolvió texto.' }));
            return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ answer }));
    } catch (error) {
        console.error('Error en /api/chat:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Error interno al procesar la solicitud.' }));
    }
};
