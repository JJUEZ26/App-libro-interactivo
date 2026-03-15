const booksData = require('../public/data/books.json');

module.exports = (req, res) => {
  const { book } = req.query;

  // Basic validation
  if (!book) {
    return res.redirect(302, '/');
  }

  // Find the book data
  const bookInfo = booksData.find(b => b.id === book);

  if (!bookInfo) {
    // If book is not found in static data, redirect to home
    return res.redirect(302, '/');
  }

  // Extract necessary meta info
  const title = bookInfo.title;
  const author = bookInfo.author || 'Múltiples Autores';
  const coverUrl = bookInfo.coverUrl || `/images/${book}.jpg`;
  
  // Create absolute URL for image
  // Vercel provides the host in the headers, or you can hardcode your production domain
  const host = req.headers.host || 'tu-dominio-interactivo.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  let absoluteImageUrl = coverUrl.startsWith('http') ? coverUrl : `${protocol}://${host}${coverUrl}`;
  // Force absolute path resolution if missing leading slash for local routes
  if (!absoluteImageUrl.includes('://') && !absoluteImageUrl.startsWith('/')) {
      absoluteImageUrl = `${protocol}://${host}/${absoluteImageUrl}`;
  }

  /*
   * NOTA SOBRE LOCALHOST Y WHATSAPP/FACEBOOK:
   * Los scrapers de redes sociales (WhatsApp, Twitter, FB) son servidores externos.
   * Cuando compartes un enlace como "http://localhost:5173/share/...", los servidores de WhatsApp
   * intentan entrar a SU PROPIO localhost interno, o simplemente fallan porque no es público.
   * Por lo tanto, NUNCA verás imágenes ni títulos en local.
   * Esto funcionará 100% perfecto una vez desplegado en Vercel (ej. https://tu-app.vercel.app/share/...)
   */

  // The final target URL inside the SPA
  const targetAppUrl = `${protocol}://${host}/?book=${book}#read`;

  // HTML with Open Graph Meta Tags and JS Redirect
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lee ${title} en Lecturas Interactivas</title>
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${protocol}://${host}/share/${book}">
    <meta property="og:title" content="Lee ${title} de ${author}">
    <meta property="og:description" content="Explora esta obra literaria inmersiva en la Biblioteca Interactiva.">
    <meta property="og:image" content="${absoluteImageUrl}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${protocol}://${host}/share/${book}">
    <meta property="twitter:title" content="Lee ${title} de ${author}">
    <meta property="twitter:description" content="Explora esta obra literaria inmersiva en la Biblioteca Interactiva.">
    <meta property="twitter:image" content="${absoluteImageUrl}">

    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #1a1a1a;
        color: white;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        text-align: center;
      }
      .loader-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }
      .titular { font-size: 1.5rem; letter-spacing: 2px;}
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255,255,255,0.1);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
</head>
<body>
    <div class="loader-container">
       <div class="spinner"></div>
       <div class="titular">Abriendo portal a ${title}...</div>
    </div>
    
    <script>
        // Redirect standard users immediately to the SPA
        setTimeout(function() {
            window.location.replace("${targetAppUrl}");
        }, 100);
    </script>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // CDN cache
  res.status(200).send(html);
};
