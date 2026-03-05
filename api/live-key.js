module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Método no permitido. Usa GET.' }));
        return;
    }

    // =============================================
    // SEGURIDAD: Validar que el request viene de
    // nuestro propio dominio (no de un tercero).
    // =============================================
    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    const source = origin || referer;

    const ALLOWED_ORIGINS = [
        'http://localhost',
        'http://127.0.0.1',
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
        process.env.ALLOWED_ORIGIN || ''
    ].filter(Boolean);

    const isAllowed = ALLOWED_ORIGINS.some(allowed => source.startsWith(allowed));

    if (!isAllowed && source) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Origen no autorizado.' }));
        return;
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Configura GEMINI_API_KEY en el servidor.' }));
        return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ apiKey: API_KEY }));
};
