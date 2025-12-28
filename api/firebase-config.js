module.exports = (req, res) => {
    // Mantén las variables en el entorno de Vercel para no incluirlas en el repo.
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.libreria-interactiva.firebaseapp.com,
        projectId: process.env.libreria-interactiva,
        storageBucket: process.env.libreria-interactiva.firebasestorage.app,
        messagingSenderId: process.env.663772506106,
        appId: process.env.1:663772506106:web:98db55443a6db7f5852643,
        measurementId: process.env.G-0C50QQ119H
    };

    const requiredKeys = [
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId'
    ];

    const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

    if (missingKeys.length > 0) {
        res.status(500).send(`Faltan variables de entorno: ${missingKeys.join(', ')}`);
        return;
    }

    res.status(200).json(firebaseConfig);
};
