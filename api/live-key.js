// =============================================
// API KEY ENDPOINT — Hardened
// Entrega la API key de Gemini al frontend para WebSocket (Live).
// No es posible proxy-ar WebSocket en Vercel serverless,
// así que protegemos con: origin check, rate limit, no-cache.
// =============================================

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 5;   // máx 5 peticiones por IP/min
const ipRequestLog = new Map();

function isRateLimited(ip) {
    const now = Date.now();
    const entry = ipRequestLog.get(ip);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        ipRequestLog.set(ip, { windowStart: now, count: 1 });
        return false;
    }

    entry.count += 1;
    if (entry.count > MAX_REQUESTS_PER_WINDOW) return true;
    return false;
}

module.exports = async (req, res) => {
    // Solo GET
    if (req.method !== 'GET') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Método no permitido.' }));
        return;
    }

    // Prevenir cache de la respuesta (la key no debe quedar en CDN/browser)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');

    // Validar origen
    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    const source = origin || referer;

    const ALLOWED_ORIGINS = [
        'http://localhost',
        'http://127.0.0.1',
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
        process.env.ALLOWED_ORIGIN || ''
    ].filter(Boolean);

    const isAllowed = ALLOWED_ORIGINS.some(allowed => allowed !== '' && source.startsWith(allowed));

    if (!isAllowed) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Origen no autorizado.' }));
        return;
    }

    // CORS — solo nuestros dominios
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Rate limiting por IP
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || 'unknown';

    if (isRateLimited(clientIp)) {
        res.statusCode = 429;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Retry-After', '60');
        res.end(JSON.stringify({ error: 'Demasiadas solicitudes. Intenta en un minuto.' }));
        return;
    }

    // Entregar la key
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'GEMINI_API_KEY no configurada en el servidor.' }));
        return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ apiKey: API_KEY }));
};
