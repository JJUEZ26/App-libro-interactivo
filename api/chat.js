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

        const systemPrompt = `Eres un filósofo y crítico literario experto.\n` +
            `Responde en español, con claridad y profundidad.\n` +
            `Concéntrate en el TEXTO PRINCIPAL (página actual).\n` +
            `Usa el contexto global solo como referencia.\n` +
            `No inventes hechos, no hagas spoilers ni salgas del texto proporcionado.`;

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
