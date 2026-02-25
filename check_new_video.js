const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

ffmpeg.ffprobe('Video_de_Madreselvas_Floreciendo.mp4', (err, metadata) => {
    if (err) {
        console.error('Error:', err.message);
        return;
    }
    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
    console.log(`Resolution: ${videoStream.width}x${videoStream.height}`);
    console.log(`Aspect Ratio: ${videoStream.display_aspect_ratio || 'N/A'}`);
    console.log(`Duration: ${metadata.format.duration}s`);
});
