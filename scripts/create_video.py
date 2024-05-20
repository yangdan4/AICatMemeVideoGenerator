import os
import ffmpeg
import re

# Define the script
script = """
Scene 1

Location: street in autumn 1

Characters:

Main Character (MC)
Identity: First person
Action: Being
Words: (Inner dialogue) "Another long day at school."
Emotion: Being tired
Enter: 00:00
Time: 00:05
Exit: 00:05
Location: street in autumn 1

Characters:

Mayu
Identity: Hot celebrity
Action: Walking
Words: (Inner dialogue) "I hope no one notices me."
Emotion: Being cool
Enter: 00:03
Time: 00:02
Exit: 00:05
Scene 2

Location: street in autumn 1

Characters:

Main Character (MC)
Identity: First person
Action: Being
Words: (Inner dialogue) "Wait, is that... Mayu?"
Emotion: Being excited2
Enter: 00:05
Time: 00:05
Exit: 00:10
Scene 3

Location: street in autumn 1

Characters:

Main Character (MC)
Identity: First person
Action: Being nervous
Words: (Inner dialogue) "What should I do? Should I talk to her?"
Emotion: Being nervous
Enter: 00:10
Time: 00:05
Exit: 00:15
Scene 4

Location: street in autumn 1

Characters:

Main Character (MC)
Identity: First person
Action: Taking orders
Words: "Mayu!"
Emotion: Being nervous
Enter: 00:15
Time: 00:05
Exit: 00:20
Location: street in autumn 1

Characters:

Mayu
Identity: Hot celebrity
Action: Being confused
Words: "Huh? Who's that?"
Emotion: Being confused
Enter: 00:18
Time: 00:02
Exit: 00:20
Scene 5

Location: street in autumn 1

Characters:

Main Character (MC)
Identity: First person
Action: Being
Words: (Inner dialogue) "I can't believe it. She's so rude."
Emotion: Being surprised2
Enter: 00:22
Time: 00:03
Exit: 00:25

Characters:

Mayu
Identity: Hot celebrity
Action: Being disgusted
Words: "Ew, a fanboy."
Emotion: Being disgusted
Enter: 00:20
Time: 00:05
Exit: 00:25
Location: street in autumn 1
"""

assets_dir = "../assets"
characters_dir = os.path.join(assets_dir, "characters")
backgrounds_dir = os.path.join(assets_dir, "backgrounds")

def convert_to_time_format(seconds):
    # Convert seconds to HH:MM:SS,milliseconds format
    milliseconds = int((seconds - int(seconds)) * 1000)
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d},{milliseconds:03d}"

def get_sec(time_str):
    """Get seconds from time."""
    m, s = time_str.split(':')
    return int(m) * 60 + int(s)

# Define utility functions
def load_video(path, duration, video_width, video_height):
    probe = ffmpeg.probe(path)

    for stream in probe['streams']:
        if stream['codec_type'] == 'audio':
            audio_duration = float(stream['duration'])
        elif stream['codec_type'] == 'video':
            video_info = stream
    video_duration = float(video_info['duration'])
    if video_duration < duration:
        num_loops = int(duration / video_duration) + 1
        input_args = {'stream_loop': num_loops}
    else:
        input_args = {}

    loaded_video = ffmpeg.input(path, **input_args).filter('chromakey', '0x00ff00', similarity=0.3)

    if video_width:
        loaded_video = loaded_video.filter('scale', video_width, video_height)
    return loaded_video, audio_duration

def load_image(path, duration):
    return (
        ffmpeg
        .input(path, t=duration, loop=1)
    )

def overlay_videos(base, overlay, x, y, start_time):
    overlay = (
        overlay
        .filter('trim', start=0)
        .filter('setpts', f'PTS-STARTPTS+{start_time}/TB')
    )
    return (
        base
        .overlay(overlay, x=x, y=y, shortest=1)
    )

def any_substring_in_string(substrings, string):
    for substring in substrings:
        if substring in string:
            return True
    return False

WINDOW_WIDTH = 1280
WINDOW_HEIGHT = 720

SMALLER_EMOTIONS = ['cold', 'confused', 'evil', 'excited2']
SMALLER_ACTIONS = ['Coding', "Driving", 'Driving2', 'Enjoying', 'Looking forward', "Loving", "Playing piano", "Taking a selfie", "Talking 2"]

# Parse the script
scenes = []
current_scene = {}
current_char = {}

for line in script.split("\n"):
    line = line.strip()

    if line.startswith("Scene"):
        if current_scene:
            scenes.append(current_scene)
            current_scene = {}
        current_scene["scene"] = line
    elif line.startswith("Location:"):
        current_scene["location"] = line.split(":")[1].strip()
    elif line.startswith("Characters:"):
        current_scene.setdefault("characters", []).append({})
        current_char = current_scene["characters"][-1]
    elif line.startswith("Identity:"):
        current_char["identity"] = line.split(":")[1].strip()
    elif line.startswith("Action:"):
        current_char["action"] = line.split(":")[1].strip()
    elif line.startswith("Words:"):
        current_char["words"] = line.split(":")[1].strip().replace("\"", "")
    elif line.startswith("Emotion:"):
        current_char["emotion"] = line.split(":")[1].strip()
    elif line.startswith("Enter:"):
        current_char["enter"] = get_sec(line.split(":")[1].strip() + ":" + line.split(":")[2].strip())
    elif line.startswith("Time:"):
        current_char["time"] = get_sec(line.split(":")[1].strip() + ":" + line.split(":")[2].strip())
    elif line.startswith("Exit:"):
        current_char["exit"] = get_sec(line.split(":")[1].strip() + ":" + line.split(":")[2].strip())

if current_scene:
    scenes.append(current_scene)

# Collect all subtitles into one list
subtitles = []
subtitle_index = 1

# Track the elapsed time to adjust enter times
elapsed_time = 0

# Create individual scene videos
scene_videos = []
scene_audios = []
ind = 0
for scene in scenes:
    location = scene["location"].replace(" ", "_")
    scene_end = max(char["exit"] for char in scene.get("characters", []))
    scene_duration = max(char["exit"] for char in scene.get("characters", [])) - min(char["enter"] for char in scene.get("characters", []))

    background_image = load_image(os.path.join(backgrounds_dir, f"{location}.jpg"), scene_duration)
    background = (
        background_image
        .filter("trim", duration=scene_duration)
        .filter("setpts", "PTS-STARTPTS")  # Reset timestamps
    )
    audio_streams = []

    for char in scene.get("characters", []):
        identity = char["identity"]
        action = char["action"]
        emotion = char["emotion"]
        enter = char["enter"] - elapsed_time
        duration = char["time"]
        exit = char["exit"] - elapsed_time
        video_width = WINDOW_WIDTH // 2
        video_height = WINDOW_HEIGHT // 2
        if "None" in action or "Being" in action:
            video_path = os.path.join(characters_dir, "emotions", f"{emotion}.mp4")
            if any_substring_in_string(SMALLER_EMOTIONS, emotion):
                video_width = WINDOW_WIDTH // 4
                video_height = WINDOW_HEIGHT // 4
        else:
            video_path = os.path.join(characters_dir, "actions", f"{action}.mp4")
            if any_substring_in_string(SMALLER_ACTIONS, action):
                video_width = WINDOW_WIDTH // 4
                video_height = WINDOW_HEIGHT // 4

        char_video, audio_duration = load_video(video_path, duration, video_width, video_height)

        # Get the character video dimensions
        if len(scene["characters"]) > 1:
            if char == scene["characters"][0]:
                x = -WINDOW_WIDTH // 6
            else:
                x = WINDOW_WIDTH // 4
            y = WINDOW_HEIGHT // 4
            background = overlay_videos(background, char_video, x, y, enter)
        else:
            x = 0
            y = WINDOW_HEIGHT // 4
            background = overlay_videos(background, char_video, x, y, enter)
        
        # Append the audio stream from this character video
        delay_ms = enter * 1000
        audio_streams.append(ffmpeg.input(video_path).audio.filter('adelay', f'{delay_ms}|{delay_ms}').filter('asetpts', 'PTS-STARTPTS'))

        if char["words"]:
            # Generate subtitle entry
            start_time_formatted = convert_to_time_format(char["enter"])
            end_time_formatted = convert_to_time_format(char["exit"])
            if "First person" in identity:
                text = "Me: " + char["words"]
            else:
                text = f'{identity.split(" (")[0]}: ' + char["words"]
            subtitles.append(f"{subtitle_index}\n{start_time_formatted} --> {end_time_formatted}\n{text}\n")
            subtitle_index += 1

    merged_audio = ffmpeg.filter(audio_streams, 'amix', inputs=len(audio_streams)).filter('atrim', duration=scene_duration).output(f'audio_{ind}.mp3')
    merged_audio.run(overwrite_output=True)
    scene_video_path = f'output_{location}_{ind}.mp4'
    scene_audio_path = f'audio_{ind}.mp3'
    background.output(scene_video_path, vcodec='libx264', acodec='aac').run(overwrite_output=True)
    
    
    scene_videos.append(ffmpeg.input(scene_video_path).video)
    scene_videos.append(ffmpeg.input(scene_audio_path).audio)
    ind += 1

    elapsed_time += scene_duration

# Concatenate all scene videos into a single video
concat = ffmpeg.concat(*scene_videos, v=1, a=1).output("combined_video.mp4")
concat.run(overwrite_output=True)

# Write all subtitles to a single file
with open('combined_subtitles.srt', 'w') as subtitle_file:
    subtitle_file.write("\n".join(subtitles))

# Apply the combined subtitles to the final video
final_video_with_subs = (
    ffmpeg
    .input('combined_video.mp4')
    .filter('subtitles', 'combined_subtitles.srt')
    .output('final_video_with_subtitles.mp4', vcodec='libx264', acodec='aac', map='0:a')
)

final_video_with_subs.run(overwrite_output=True)