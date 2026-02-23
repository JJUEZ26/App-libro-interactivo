const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);

console.log("Processing golondrinaaterrizando.mp4...");

ffmpeg('golondrinaaterrizando.mp4')
    .videoCodec('libx264')
    .outputOptions([
        '-crf 28',
        '-preset fast',
        '-vf', 'crop=iw*0.9:ih*0.9:iw*0.05:ih*0.05'
    ])
    .noAudio()
    .on('end', () => {
        console.log('golondrina aterrizando processed successfully!');
    })
    .on('error', (err) => {
        console.error('Error: ' + err.message);
    })
    .save('public/videos/golondrina_aterrizaje.mp4');
