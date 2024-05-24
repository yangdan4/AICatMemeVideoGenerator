const etro = require('etro');
const fs = require('fs');
const path = require('path');

// Define utility functions
function convertToTimeFormat(seconds) {
    const milliseconds = Math.floor((seconds % 1) * 1000);
    const totalSeconds = Math.floor(seconds);
    const s = totalSeconds % 60;
    const m = Math.floor((totalSeconds % 3600) / 60);
    const h = Math.floor(totalSeconds / 3600);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

function getSec(timeStr) {
    const [m, s] = timeStr.split(':').map(Number);
    return m * 60 + s;
}

async function loadVideo(path, duration, videoWidth, videoHeight) {
    const videoElement = document.createElement('video');
    videoElement.src = path;

    await videoElement.play();

    const video = new etro.layer.Video({ startTime: 0, source: videoElement });
    video.addEffect(new etro.effect.ChromaKey({ color: [0, 255, 0], similarity: 0.3 }));

    if (videoElement.duration < duration) {
        videoElement.loop = true;
        videoElement.playbackRate = videoElement.duration / duration;
    }

    if (videoWidth && videoHeight) {
        video.addEffect(new etro.effect.Scale({ width: videoWidth, height: videoHeight }));
    }

    return video;
}

function loadImage(path, duration) {
    const imgElement = document.createElement('img');
    imgElement.src = path;

    return new etro.layer.Image({ startTime: 0, source: imgElement, duration });
}

function overlayVideos(base, overlay, x, y, startTime) {
    overlay.setStartTime(startTime);
    overlay.setPosition(x, y);
    base.addLayer(overlay);
}

const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 720;
const SMALLER_ACTIONS = ['Coding', 'Driving', 'Driving2', 'Enjoying', 'Looking forward', 'Loving', 'Playing piano', 'Taking a selfie', 'Talking 2', 'cold', 'confused', 'evil', 'excited2'];

// Define your script and other constants
const script = `...`; // Your script content
const assetsDir = "../assets";
const charactersDir = path.join(assetsDir, "characters");
const backgroundsDir = path.join(assetsDir, "backgrounds");

// Parse the script and process scenes and characters
const scenes = [];
let currentScene = null;
let currentChar = null;

script.split("\n").forEach(line => {
    line = line.trim();

    if (line.startsWith("Scene")) {
        if (currentScene) {
            if (currentChar) {
                currentScene.characters.push(currentChar);
                currentChar = null;
            }
            scenes.push(currentScene);
        }
        currentScene = { characters: [] };
        currentScene.scene = line;
    } else if (line.startsWith("Location:")) {
        currentScene.location = line.split(":")[1].trim();
    } else if (line.startsWith("Characters:")) {
        // No action needed for this line
    } else if (line.startsWith("Identity:")) {
        if (currentChar) {
            currentScene.characters.push(currentChar);
        }
        currentChar = { identity: line.split(":")[1].trim() };
    } else if (line.startsWith("Action:")) {
        currentChar.action = line.split(":")[1].trim();
    } else if (line.startsWith("Words:")) {
        currentChar.words = line.split(":")[1].trim().replace(/"/g, "");
    } else if (line.startsWith("Enter:")) {
        currentChar.enter = getSec(line.split(":")[1].trim() + ":" + line.split(":")[2].trim());
    } else if (line.startsWith("Time:")) {
        currentChar.time = getSec(line.split(":")[1].trim() + ":" + line.split(":")[2].trim());
    } else if (line.startsWith("Exit:")) {
        currentChar.exit = getSec(line.split(":")[1].trim() + ":" + line.split(":")[2].trim());
    }
});

if (currentChar) currentScene.characters.push(currentChar);
if (currentScene) scenes.push(currentScene);

// Create individual scene videos
const sceneVideos = [];
let elapsed_time = 0;

for (const scene of scenes) {
    const location = scene.location.replace(" ", "_");
    const sceneEnd = Math.max(...scene.characters.map(char => char.exit));
    const sceneDuration = Math.max(...scene.characters.map(char => char.exit)) - Math.min(...scene.characters.map(char => char.enter));

    const backgroundImage = loadImage(path.join(backgroundsDir, `${location}.jpg`), sceneDuration);
    const background = new etro.Movie({ canvas: document.createElement('canvas') });
    background.addLayer(backgroundImage);

    for (const char of scene.characters) {
        const { identity, action, enter, time, exit, words } = char;
        const videoPath = path.join(charactersDir, "actions", `${action}.mp4`);
        const videoWidth = SMALLER_ACTIONS.includes(action) ? WINDOW_WIDTH / 4 : WINDOW_WIDTH / 2;
        const videoHeight = SMALLER_ACTIONS.includes(action) ? WINDOW_HEIGHT / 4 : WINDOW_HEIGHT / 2;

        const charVideo = await loadVideo(videoPath, time, videoWidth, videoHeight);
        const x = 0, y = WINDOW_HEIGHT / 4;  // Customize positions as needed
        overlayVideos(background, charVideo, x, y, enter - elapsed_time);

        if (words) {
            const startTimeFormatted = convertToTimeFormat(enter);
            const endTimeFormatted = convertToTimeFormat(exit);
            const text = `${identity}: ${words}`;
            // Add subtitles logic here
        }
    }

    sceneVideos.push(background);
    elapsed_time += sceneDuration;
}

// Concatenate all scene videos into a single video
const finalMovie = new etro.Movie({ canvas: document.createElement('canvas') });
sceneVideos.forEach(scene => finalMovie.addLayer(scene));
finalMovie.record({ frameRate: 24 }).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'final_video_with_subtitles.mp4';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
});