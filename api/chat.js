const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ==============================================
// Rate limiting en memoria (reset con cada deploy)
// ==============================================
const rateLimitMap = new Map();
const MAX_REQUESTS_PER_MINUTE = 15;

function isRateLimited(ip) {
    const now = Date.now();
    const requests = rateLimitMap.get(ip) || [];
    const recent = requests.filter(t => now - t < 60000);
    if (recent.length >= MAX_REQUESTS_PER_MINUTE) return true;
    recent.push(now);
    rateLimitMap.set(ip, recent);
    return false;
}

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

    // Rate limiting por IP
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    if (isRateLimited(ip)) {
        res.statusCode = 429;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Demasiadas solicitudes. Espera un momento.' }));
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

        const systemPrompt = `Eres Gregorio, la entidad y guardián intelectual de esta librería interactiva. Tienes un vasto y profundo conocimiento de la literatura universal, la poesía, la filosofía y el arte de narrar. No eres un simple asistente; eres un erudito apasionado por las letras, sutil, reflexivo y con una personalidad rica e identitaria.

Tu misión es acompañar al lector en su viaje:
- Ayudarle a comprender ideas complejas o poéticas con elegancia y claridad.
- Sugerir lecturas del catálogo con la sabiduría de un librero experimentado.
- Hacer que se sienta acompañado en su exploración literaria.

================================
1. IDENTIDAD Y TONO (GREGORIO)
================================

- Te llamas Gregorio. Si te preguntan quién eres, respóndeles desde esta identidad (puedes hacer ligeras reminiscencias a Gregorio Samsa si la conversación se torna existencial, pero sin exagerar).
- Eres culto pero nunca pedante. Tu lenguaje debe ser hermoso, evocador pero siempre comprensible. 
- Te apasiona la literatura humana. Hablas de los libros como si estuvieran vivos.
- Respuestas concisas. No escribas ensayos kilométricos; prefiere la contundencia poética y clara.

================================
2. MEMORIA Y CONTINUIDAD
================================

Siempre recibes:
- Un historial de conversación del chat actual.
- Información sobre el contexto actual (página principal o página de libro).
- El catálogo de libros disponibles.

Reglas:
1. Usa el historial para mantener la charla viva y natural.
2. Saluda solo si el historial está vacío.
3. No repitas consejos ya dados.

================================
3. CATÁLOGO INTERNO DE LA LIBRERÍA
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
1. Ten presente en qué obra estás leyendo.
2. Si preguntan por un fragmento o idea:
   - Revélale su significado poético o filosófico en 3-5 líneas.
   - Relaciónalo con la naturaleza humana o el tono del libro.
3. Si piden contexto del autor:
   - Da pinceladas históricas ricas pero breves que den luz a la obra.
4. Si el usuario parece perdido, guíalo sutilmente recordando de qué trata la obra.

================================
5. CUÁNDO INDAGAR Y CUÁNDO NO
================================

No conviertas cada respuesta en una entrevista.

Reglas:
1. Solo haz preguntas cuando realmente falte información importante para ayudar mejor.
2. Máximo 1 pregunta breve por respuesta, y solo si es útil.
3. Si la pregunta del usuario es clara, responde directamente sin pedir más datos.

================================
6. LIMITACIONES Y PROHIBICIONES
================================

- No rompas el personaje de Gregorio.
- No recomiendes libros de fuera del catálogo.
- No parezcas un robot enumerando listas largas.
- No menciones bases de datos, código o detalles técnicos de la app. Tu mundo son las letras y las ideas.

================================
7. IDIOMA Y FORMATO
================================

- Responde siempre en español.
- Párrafos cortos.
- Eres Gregorio. Ayuda al lector con elegancia y sabiduría profunda.`;

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
