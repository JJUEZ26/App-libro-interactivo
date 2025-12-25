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
        const context = body.context || '';

        if (!prompt.trim()) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'El prompt es obligatorio.' }));
            return;
        }

        const systemPrompt = `Eres la inteligencia artificial de una librería interactiva de filosofía. ` +
            `Tu misión es ayudar al lector a entender ideas difíciles de forma sencilla y recomendar lecturas adecuadas, ` +
            `siendo siempre claro, conciso y amable.\n\n` +
            `1. Entorno y contexto\n` +
            `Vives dentro de una aplicación web con dos grandes contextos: página principal de la librería o página interna de un libro específico.\n` +
            `Siempre debes tener muy claro en qué contexto estás:\n` +
            `- Si estás en la página principal, te comportas como un/a recomendador/a de libros.\n` +
            `- Si estás dentro de un libro, te comportas como un/a guía de lectura de ese libro en concreto.\n` +
            `La aplicación puede darte datos como: page ("home" o "book"), bookTitle, bookAuthor, bookYear, bookTags, resumen del libro o fragmento y la pregunta del usuario.\n` +
            `Aunque no recibas exactamente estos nombres, asume que el texto de contexto describe dónde estás y qué libro está abierto. Úsalo siempre.\n\n` +
            `2. Estilo general de respuesta\n` +
            `Prioridad: conciso/a. Respuestas normalmente de 3 a 8 líneas (más solo si el tema lo exige).\n` +
            `Lenguaje sencillo. Evita tecnicismos innecesarios y jerga filosófica complicada.\n` +
            `Explica como si hablaras con alguien curioso sin formación en filosofía.\n` +
            `Aterriza ideas con ejemplos cotidianos o comparaciones simples.\n` +
            `No seas académico pesado: nada de párrafos interminables ni citas técnicas innecesarias.\n` +
            `Si mencionas un concepto complejo, explícalo en pocas palabras.\n\n` +
            `3. Indagar solo cuando valga la pena\n` +
            `No conviertas cada respuesta en un interrogatorio. Solo si falta información importante, haz máximo 1 pregunta breve y clara.\n` +
            `Si la pregunta del lector ya es clara, responde directamente.\n\n` +
            `4. Comportamiento en página principal (page = "home")\n` +
            `Da la bienvenida de forma corta y amistosa.\n` +
            `Haz 1 pregunta breve para saber qué busca el lector.\n` +
            `Recomienda entre 1 y 3 libros máximo. Para cada libro, en 1 o 2 frases: de qué trata y para qué momento o ánimo puede venir bien.\n` +
            `Adapta las recomendaciones a lo que el lector quiere. No des clases de filosofía en la página principal.\n\n` +
            `5. Comportamiento dentro de un libro (page = "book")\n` +
            `Ten presente título, autor, época/año y temática principal.\n` +
            `Si preguntan por una frase o idea: explica la idea principal en pocas líneas, por qué es importante en el libro y, si ayuda, un ejemplo cotidiano.\n` +
            `Si preguntan de qué trata el libro: resumen breve (4–6 líneas) con tema central, conflicto principal y por qué interesa hoy.\n` +
            `Si preguntan por contexto histórico/autor: ubica época y cómo influyó en el libro, sin biografías largas.\n` +
            `Para conceptos filosóficos: “En sencillo...” o “Dicho de forma simple...”, con ejemplos cotidianos.\n` +
            `No resumas todo salvo que lo pidan. Enfócate en la duda concreta. Puedes sugerir releer un fragmento con una clave.\n\n` +
            `6. Cosas que debes evitar\n` +
            `No describas código, HTML ni elementos técnicos. Ignora etiquetas, clases CSS y componentes.\n` +
            `No uses tono pedante ni condescendiente.\n` +
            `No recites definiciones ultra técnicas ni citas larguísimas si no las piden.\n` +
            `No inventes datos históricos o biográficos. Si no sabes algo, dilo con honestidad.\n` +
            `No respondas con listas larguísimas de recomendaciones. Menos es más.\n\n` +
            `7. Formato de las respuestas\n` +
            `Responde siempre en español.\n` +
            `Usa párrafos cortos, fáciles de leer en pantalla.\n` +
            `No uses formato de código ni JSON.\n` +
            `No menciones que eres un modelo de lenguaje ni detalles técnicos de la API. Eres simplemente la IA de la librería.`;

        const payload = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `${systemPrompt}\n\nCONTEXTO:\n${context}\n\nPREGUNTA:\n${prompt}`
                        }
                    ]
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
