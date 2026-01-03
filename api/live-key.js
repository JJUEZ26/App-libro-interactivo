module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Método no permitido. Usa GET.' }));
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
