import os
import ffmpeg
import re

from pydub import AudioSegment

# Define the script
script = """
Scene Index: 1
Location: street in summer
Characters:
Identity: 友達
Action: Running
Words: 走ろう！
Emotion: Being happy
Enter: 00:00
Time: 00:05
Exit: 00:05

Identity: 私
Action: Running
Words: うん、行こう！
Emotion: Being happy
Enter: 00:00
Time: 00:05
Exit: 00:05

Scene Index: 2
Location: street in summer
Characters:
Identity: 友達
Action: Running
Words: ゴールはあそこだ！
Emotion: Being excited
Enter: 00:05
Time: 00:05
Exit: 00:10

Identity: 私
Action: Running
Words: わかった、頑張る！
Emotion: Being excited
Enter: 00:05
Time: 00:05
Exit: 00:10

Scene Index: 3
Location: street in summer
Characters:
Identity: 私
Action: Running
Words: あっ！
Emotion: Being surprised
Enter: 00:10
Time: 00:05
Exit: 00:15

Identity: 友達
Action: Running
Words: どうしたの？
Emotion: Being confused
Enter: 00:10
Time: 00:05
Exit: 00:15

Scene Index: 4
Location: street in summer
Characters:
Identity: 私
Action: Running
Words: ゴキブリを踏んじゃった！
Emotion: Being disgusted
Enter: 00:15
Time: 00:05
Exit: 00:20

Identity: 友達
Action: Running
Words: ええっ、本当？！
Emotion: Being surprised
Enter: 00:15
Time: 00:05
Exit: 00:20

Scene Index: 5
Location: street in summer
Characters:
Identity: 私
Action: Running
Words: 気持ち悪い…最悪だ…
Emotion: Being sad
Enter: 00:20
Time: 00:05
Exit: 00:25

Identity: 友達
Action: Running
Words: 大丈夫、気にしないで！
Emotion: Being supportive
Enter: 00:20
Time: 00:05
Exit: 00:25
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
scenes = []
current_scene = None
current_char = None

for line in script.split("\n"):
    line = line.strip()

    if line.startswith("Scene"):
        if current_scene:
            if current_char:
                current_scene["characters"].append(current_char)
                current_char = None
            scenes.append(current_scene)
        current_scene = {"index": line.split(":")[1].strip(), "characters": []}
        current_scene['scene'] = line
    elif line.startswith("Location:"):
        current_scene["location"] = line.split(":")[1].strip()
    elif line.startswith("Characters:"):
        pass  # This line indicates the start of characters for a scene
    elif line.startswith("Identity:"):
        if current_char:
            current_scene["characters"].append(current_char)
        current_char = {"identity": line.split(":")[1].strip()}
    elif line.startswith("Action:"):
        current_char["action"] = line.split(":")[1].strip()
    elif line.startswith("Words:"):
        current_char["words"] = line.split(":")[-1].strip().replace("\"", "")
    elif line.startswith("Emotion:"):
        current_char["emotion"] = line.split(":")[1].strip()
    elif line.startswith("Enter:"):
        current_char["enter"] = get_sec(line.split(":")[1].strip() + ":" + line.split(":")[2].strip())
    elif line.startswith("Time:"):
        current_char["time"] = get_sec(line.split(":")[1].strip() + ":" + line.split(":")[2].strip())
    elif line.startswith("Exit:"):
        current_char["exit"] = get_sec(line.split(":")[1].strip() + ":" + line.split(":")[2].strip())

# Add the last character and scene to the list
if current_char:
    current_scene["characters"].append(current_char)
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
        if "None" in action or "Feeling" in action:
            video_path = os.path.join(characters_dir, "emotions", f"{emotion}.mp4")
            if any_substring_in_string(SMALLER_EMOTIONS, emotion):
                video_width = WINDOW_WIDTH // 4
                video_height = WINDOW_HEIGHT // 4
        else:

            if not '私' in identity and not 'I' in identity and not 'Me' and not '我' in identity and action == 'Talking':
                video_path = os.path.join(characters_dir, "actions", f"{action} (someone else).mp4")
            else:
                video_path = os.path.join(characters_dir, "actions", f"{action}.mp4")
            if any_substring_in_string(SMALLER_ACTIONS, action):
                video_width = WINDOW_WIDTH // 4
                video_height = WINDOW_HEIGHT // 4

        char_video, audio_duration = load_video(video_path, duration, video_width, video_height)

        # Get the character video dimensions
        if len(scene["characters"]) > 1:
            # forbid greater than 4 chars
            if char == scene["characters"][0]:
                x = -WINDOW_WIDTH // 6
                y = WINDOW_HEIGHT // 4
            elif char == scene["characters"][1]:
                x = WINDOW_WIDTH // 4
                y = WINDOW_HEIGHT // 4
            elif char == scene["characters"][2]:
                x = -WINDOW_WIDTH // 6
                y = -WINDOW_HEIGHT // 6
            elif char == scene["characters"][3]:
                x = WINDOW_WIDTH // 4
                y = -WINDOW_HEIGHT // 6
            background = overlay_videos(background, char_video, x, y, enter)
        else:
            x = 0
            y = WINDOW_HEIGHT // 4
            background = overlay_videos(background, char_video, x, y, enter)
        
        # Append the audio stream from this character video
        delay_ms = enter * 1000
        audio_segment = AudioSegment.from_file(video_path)
        delayed_audio = AudioSegment.silent(duration=delay_ms) + audio_segment

        audio_streams.append(delayed_audio)

        if char["words"]:
            char["words"] = char["words"].split(" (")[0]
            # Generate subtitle entry
            start_time_formatted = convert_to_time_format(char["enter"])
            end_time_formatted = convert_to_time_format(char["exit"])
            text = f'{identity.split(" (")[0]}: ' + char["words"]
            subtitles.append(f"{subtitle_index}\n{start_time_formatted} --> {end_time_formatted}\n{text}\n")
            subtitle_index += 1

    # Use pydub to merge audio
    combined_audio = sum(audio_streams)
    combined_audio.export(f'combined_audio_{ind}.mp3', format='mp3')
    scene_video_path = f'output_{location}_{ind}.mp4'
    scene_audio_path = f'combined_audio_{ind}.mp3'
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