const fs = require('fs');
const path = require('path');
const etro = require('etro');
const { SentenceTransformer, util } = require('sentence-transformers');

// Load the pre-trained model
const model = new SentenceTransformer('sentence-transformers/msmarco-distilbert-base-v3');

// Define the script
const script = `
`;

const assetsDir = "../assets";
const charactersDir = path.join(assetsDir, "characters");
const backgroundsDir = path.join(assetsDir, "backgrounds");

const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 720;
const SMALLER_ACTIONS = ['Coding', "Driving", 'Driving2', 'Enjoying', 'Looking forward', "Loving", "Playing piano", "Taking a selfie", "Talking 2", 'cold', 'confused', 'evil', 'excited2'];

function convertToTimeFormat(seconds) {
    const milliseconds = Math.floor((seconds - Math.floor(seconds)) * 1000);
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const h = Math.floor(m / 60);
    const mFinal = m % 60;
    return `${String(h).padStart(2, '0')}:${String(mFinal).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

function getSec(timeStr) {
    const [m, s] = timeStr.split(':').map(Number);
    return m * 60 + s;
}

function findClosestMatch(phrase, options) {
    const phraseEmbedding = model.encode([phrase])[0];
    const optionsEmbeddings = model.encode(options);
    const cosineScores = util.pytorchCosSim(phraseEmbedding, optionsEmbeddings);
    const closestMatchIndex = cosineScores.argmax().item();
    return options[closestMatchIndex];
}

function preprocessScript(script, actionNames, locationNames) {
    const lines = script.trim().split('\n');
    const processedLines = [];
    let actionCount = {};

    for (let line of lines) {
        line = line.trim();

        if (line.startsWith('Scene')) {
            actionCount = {};
            processedLines.push(line);
        } else if (line.startsWith('Location:')) {
            const location = line.split(':')[1].trim();
            const closestLocation = findClosestMatch(location, locationNames);
            processedLines.push(`Location: ${closestLocation}`);
        } else if (line.startsWith('Action:')) {
            let action = line.split(':')[1].trim();
            const closestAction = findClosestMatch(action, actionNames);
            if (closestAction in actionCount) {
                actionCount[closestAction]++;
                line = `Action: ${closestAction} ${actionCount[closestAction]}`;
            } else {
                actionCount[closestAction] = 1;
                line = `Action: ${closestAction}`;
            }
            processedLines.push(line);
        } else {
            processedLines.push(line);
        }
    }

    return processedLines.join('\n');
}

const actionNames = [""];
const locationNames = [""];

// Preprocess the script
const processedScript = preprocessScript(script, actionNames, locationNames);

async function loadVideo(path, duration, videoWidth, videoHeight) {
    let video;
    try {
        video = new etro.Movie({ canvas: new etro.Canvas() });
        const layer = new etro.layer.Video({ startTime: 0, source: path });
        video.addLayer(layer);

        if (videoWidth && videoHeight) {
            layer.scale(videoWidth, videoHeight);
        }

        await video.play({ frameRate: 24, duration });
        return { video, duration: video.duration };
    } catch (error) {
        throw new Error(`Error loading video: ${error.message}`);
    }
}

function loadImage(path, duration) {
    const movie = new etro.Movie({ canvas: new etro.Canvas() });
    const layer = new etro.layer.Image({ startTime: 0, source: path });
    movie.addLayer(layer);
    return movie;
}

function overlayVideos(base, overlay, x, y, startTime) {
    overlay.layers.forEach(layer => {
        layer.startTime = startTime;
        layer.x = x;
        layer.y = y;
        base.addLayer(layer);
    });
    return base;
}

const scenes = [];
let currentScene = null;
let currentChar = null;

processedScript.split('\n').forEach(line => {
    line = line.trim();

    if (line.startsWith('Scene')) {
        if (currentScene) {
            if (currentChar) {
                currentScene.characters.push(currentChar);
                currentChar = null;
            }
            scenes.push(currentScene);
        }
        currentScene = { characters: [] };
        currentScene.scene = line;
    } else if (line.startsWith('Location:')) {
        currentScene.location = line.split(':')[1].trim();
    } else if (line.startsWith('Characters:')) {
        // This line indicates the start of characters for a scene
    } else if (line.startsWith('Identity:')) {
        if (currentChar) {
            currentScene.characters.push(currentChar);
        }
        currentChar = { identity: line.split(':')[1].trim() };
    } else if (line.startsWith('Action:')) {
        currentChar.action = line.split(':')[1].trim();
    } else if (line.startsWith('Words:')) {
        currentChar.words = line.split(':')[-1].trim().replace(/"/g, '');
    } else if (line.startsWith('Enter:')) {
        currentChar.enter = getSec(line.split(':')[1].trim() + ':' + line.split(':')[2].trim());
    } else if (line.startsWith('Time:')) {
        currentChar.time = getSec(line.split(':')[1].trim() + ':' + line.split(':')[2].trim());
    } else if (line.startsWith('Exit:')) {
        currentChar.exit = getSec(line.split(':')[1].trim() + ':' + line.split(':')[2].trim());
    }
});

if (currentChar) {
    currentScene.characters.push(currentChar);
}
if (currentScene) {
    scenes.push(currentScene);
}

const subtitles = [];
let subtitleIndex = 1;
let elapsedTime = 0;

const sceneVideos = [];
const sceneAudios = [];
let ind = 0;

(async () => {
    for (const scene of scenes) {
        const location = scene.location.replace(' ', '_');
        const sceneDuration = Math.max(...scene.characters.map(char => char.exit)) - Math.min(...scene.characters.map(char => char.enter));

        const backgroundImage = loadImage(path.join(backgroundsDir, `${location}.jpg`), sceneDuration);
        const background = backgroundImage;

        const audioStreams = [];
        const tempFiles = [];

        for (const char of scene.characters) {
            const identity = char.identity;
            const action = char.action;
            const enter = char.enter - elapsedTime;
            const duration = char.time;
            const exit = char.exit - elapsedTime;
            let videoWidth = WINDOW_WIDTH / 2;
            let videoHeight = WINDOW_HEIGHT / 2;

            let videoPath;
            if (!['私', 'I', 'Me', '我'].includes(identity) && action === 'Talking') {
                videoPath = path.join(charactersDir, 'actions', `${action} (someone else).mp4`);
            } else {
                videoPath = path.join(charactersDir, 'actions', `${action}.mp4`);
            }

            if (SMALLER_ACTIONS.includes(action)) {
                videoWidth = WINDOW_WIDTH / 4;
                videoHeight = WINDOW_HEIGHT / 4;
            }

            const { video: charVideo, duration: videoDuration } = await loadVideo(videoPath, duration, videoWidth, videoHeight);

            if (charVideo.duration < duration) {
                const numLoops = Math.ceil(duration / charVideo.duration);
                for (let i = 1; i < numLoops; i++) {
                    charVideo.addLayer(charVideo.layers[0]);
                }
            }

            let x = 0;
            let y = WINDOW_HEIGHT / 4;

            if (scene.characters.length > 1) {
                switch (scene.characters.indexOf(char)) {
                    case 0:
                        x = -WINDOW_WIDTH / 6;
                        y = WINDOW_HEIGHT / 4;
                        break;
                    case 1:
                        x = WINDOW_WIDTH / 4;
                        y = WINDOW_HEIGHT / 4;
                        break;
                    case 2:
                        x = -WINDOW_WIDTH / 6;
                        y = -WINDOW_HEIGHT / 6;
                        break;
                    case 3:
                        x = WINDOW_WIDTH / 4;
                        y = -WINDOW_HEIGHT / 6;
                        break;
                }
            }

            overlayVideos(background, charVideo, x, y, enter);

            const delayMs = enter * 1000;
            audioStreams.push({ videoPath, delayMs });

            if (char.words) {
                const startTimeFormatted = convertToTimeFormat(char.enter);
                const endTimeFormatted = convertToTimeFormat(char.exit);
                const text = `${identity.split(' (')[0]}: ${char.words}`;
                subtitles.push(`${subtitleIndex}\n${startTimeFormatted} --> ${endTimeFormatted}\n${text}\n`);
                subtitleIndex++;
            }
        }

        // Merging audio streams for each character in the scene
        const mergedAudioPath = path.join(__dirname, `audio_${ind}.mp3`);
        const audioMovie = new etro.Movie({ canvas: new etro.Canvas() });

        audioStreams.forEach(({ videoPath, delayMs }) => {
            const audioLayer = new etro.layer.Audio({ startTime: delayMs / 1000, source: videoPath });
            audioMovie.addLayer(audioLayer);
        });

        await audioMovie.play({ frameRate: 24, duration: sceneDuration });
        const audioBlob = await audioMovie.record({ frameRate: 24 });
        fs.writeFileSync(mergedAudioPath, Buffer.from(await audioBlob.arrayBuffer()));

        // Rendering scene video
        const sceneVideoPath = path.join(__dirname, `output_${location}_${ind}.mp4`);
        const sceneAudioPath = mergedAudioPath;
        const sceneBlob = await background.record({ frameRate: 24, duration: sceneDuration });
        fs.writeFileSync(sceneVideoPath, Buffer.from(await sceneBlob.arrayBuffer()));

        sceneVideos.push(sceneVideoPath);
        sceneAudios.push(sceneAudioPath);
        ind++;
        elapsedTime += sceneDuration;
    }

    // Concatenate all scene videos into a single video
    const finalVideoPath = path.join(__dirname, 'combined_video.mp4');
    const combinedMovie = new etro.Movie({ canvas: new etro.Canvas() });

    sceneVideos.forEach((sceneVideoPath, index) => {
        const videoLayer = new etro.layer.Video({ startTime: index * elapsedTime, source: sceneVideoPath });
        combinedMovie.addLayer(videoLayer);
    });

    const combinedBlob = await combinedMovie.record({ frameRate: 24 });
    fs.writeFileSync(finalVideoPath, Buffer.from(await combinedBlob.arrayBuffer()));

    // Write all subtitles to a single file
    const subtitleFilePath = path.join(__dirname, 'combined_subtitles.srt');
    fs.writeFileSync(subtitleFilePath, subtitles.join('\n'));

    // Apply the combined subtitles to the final video
    const finalVideoWithSubsPath = path.join(__dirname, 'final_video_with_subtitles.mp4');
    const finalMovieWithSubs = new etro.Movie({ canvas: new etro.Canvas() });

    const finalVideoLayer = new etro.layer.Video({ startTime: 0, source: finalVideoPath });
    finalMovieWithSubs.addLayer(finalVideoLayer);

    const finalAudioLayer = new etro.layer.Audio({ startTime: 0, source: finalVideoPath });
    finalMovieWithSubs.addLayer(finalAudioLayer);

    const subtitleLayer = new etro.layer.Subtitle({ source: subtitleFilePath });
    finalMovieWithSubs.addLayer(subtitleLayer);

    const finalBlobWithSubs = await finalMovieWithSubs.record({ frameRate: 24 });
    fs.writeFileSync(finalVideoWithSubsPath, Buffer.from(await finalBlobWithSubs.arrayBuffer()));

    console.log('Video processing complete. Output saved as final_video_with_subtitles.mp4');

})().catch(error => console.error(`Error during video processing: ${error.message}`));