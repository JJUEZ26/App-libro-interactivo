const fs = require('fs');
let text = fs.readFileSync('public/stories/la_puerta.json', 'utf8');

const badPartStart = text.indexOf('        ],\n        "sound": "on_the_nature2.mp3",\n        "ghostEcho": true,\n        "volume": 0.90,\n        "choices": [\n            {\n                "text": "Continuar",\n                "page": 2\n            }\n        ]\n    },\n    {\n        "id": 2,');

if (badPartStart > -1) {
    const goodPartStart = text.indexOf('    {\n        "id": 10,\n        "scenes": [\n            "Pero ahora, tengo una puerta que abrir."');
    
    // We want everything BEFORE badPartStart.
    const cleanBefore = text.substring(0, badPartStart);
    // Let's add the correct choices block for id 9.
    const choicesForId9 = `        ],
        "sound": "on_the_nature2.mp3",
        "ghostEcho": true,
        "volume": 0.95,
        "choices": [
            {
                "text": "Continuar",
                "page": 10
            }
        ]
    },
`;
    const cleanAfter = text.substring(goodPartStart);
    
    fs.writeFileSync('public/stories/la_puerta.json', cleanBefore + choicesForId9 + cleanAfter);
    console.log('Fixed correctly');
} else {
    console.log('Bad part not found');
}
