import os
import ffmpeg
import re
import subprocess


# Define the script
script = """
Scene 1:
Location: street in spring 1
Characters:
Identity: First person
Action: Walking
Words: (Inner dialogue) "I can't believe it! Is that really Mayu, the famous celebrity?"
Emotion: Being excited
Enter: 00:00
Duration: 00:05
Exit: 00:05
Scene 2:
Location: street in spring 1
Characters:
Identity: First person
Action: Being
Words: "Mayu!"
Emotion: Being nervous
Enter: 00:05
Duration: 00:05
Exit: 00:10
Characters:
Identity: Mayu (side character)
Action: Looking around
Words: (None)
Emotion: Being confused
Enter: 00:07
Duration: 00:03
Exit: 00:10
Scene 3:
Location: street in spring 1
Characters:
Identity: Mayu (side character)
Action: Looking (someone else)
Words: (None)
Emotion: Being disgusted
Enter: 00:10
Duration: 00:03
Exit: 00:13
Characters:
Identity: First person
Action: Being
Words: (None)
Emotion: Being surprised2
Enter: 00:10
Duration: 00:03
Exit: 00:13
Scene 4:
Location: street in spring 1
Characters:
Identity: First person
Action: Being
Words: (Inner dialogue) "I can't believe she looked at me like that. I don't think I like her anymore."
Emotion: Being very sad
Enter: 00:13
Duration: 00:05
Exit: 00:18
"""

assets_dir = "../assets"
characters_dir = os.path.join(assets_dir, "characters")
backgrounds_dir = os.path.join(assets_dir, "backgrounds")

def convert_to_time_format(seconds):
    # Convert seconds to HH:MM:SS.milliseconds format
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
    print(path)
    probe = ffmpeg.probe(path)
    video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
    video_duration = float(video_info['duration'])

    if video_duration < duration:
        num_loops = int(duration / video_duration) + 1
        input_args = {'stream_loop': num_loops}
    else:
        input_args = {}
    
    loaded_video = ffmpeg.input(path, **input_args).filter('chromakey', '0x00ff00', similarity=0.3)

    if video_width:
        loaded_video = loaded_video.filter('scale', video_width, video_height)
    return loaded_video

def load_image(path, duration):
    return (
        ffmpeg
        .input(path, t=duration, loop=1)
    )

def overlay_videos(base, overlay, x, y, start_time):
    return (
        base
        .overlay(overlay, x=x, y=y, shortest=1, enable=f'gte(t,{start_time})')
    )

def any_substring_in_string(substrings, string):
    for substring in substrings:
        if substring in string:
            return True
    return False


def add_subtitles(video, identity, text, start_time, end_time):
    # Generate a unique filename for the subtitle file
    subtitle_filename = 'subtitle.srt'

    # Convert start and end times to the required format
    start_time_formatted = convert_to_time_format(start_time)
    end_time_formatted = convert_to_time_format(end_time)

    if "Inner Dialogue" in text:
        text = re.sub(r"\([^)]*\)", "", text)
    elif "First person" in identity:
        text = "Me: " + text
    else:
        text = f'{identity.split(" (")[0]}: ' + text
    # Create a subtitle file with the given text and timing
    with open(subtitle_filename, 'w') as subtitle_file:
        subtitle_file.write(f"1\n{start_time_formatted} --> {end_time_formatted}\n{text}\n")

    # Apply the subtitles filter to the video
    video = video.filter('subtitles', subtitle_filename)

    # Return the modified video
    return video



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
    elif line.startswith("Duration:"):
        current_char["duration"] = get_sec(line.split(":")[1].strip() + ":" + line.split(":")[2].strip())
    elif line.startswith("Exit:"):
        current_char["exit"] = get_sec(line.split(":")[1].strip() + ":" + line.split(":")[2].strip())

if current_scene:
    scenes.append(current_scene)

# Create individual scene videos
scene_videos = []
ind = 0
for scene in scenes:
    location = scene["location"].replace(" ", "_")
    print(scene)
    scene_duration = max(char["exit"] for char in scene.get("characters", []))

    background_image = load_image(os.path.join(backgrounds_dir, f"{location}.jpg"), scene_duration)
    background = (
        background_image
        .filter("trim", duration=scene_duration)
        .filter("setpts", "PTS-STARTPTS")  # Reset timestamps
    )
    for char in scene.get("characters", []):
        identity = char["identity"]
        action = char["action"]
        emotion = char["emotion"]
        enter = char["enter"]
        duration = char["duration"]
        exit = char["exit"]
        video_width = WINDOW_WIDTH // 2
        video_height = WINDOW_HEIGHT // 2
        if "Being" in action:
            video_path = os.path.join(characters_dir, "emotions", f"{emotion}.mp4")
            if any_substring_in_string(SMALLER_EMOTIONS, emotion):
                video_width = WINDOW_WIDTH // 4
                video_height = WINDOW_HEIGHT // 4
        else:
            video_path = os.path.join(characters_dir, "actions", f"{action}.mp4")
            if any_substring_in_string(SMALLER_ACTIONS, action):
                video_width = WINDOW_WIDTH // 4
                video_height = WINDOW_HEIGHT // 4

        char_video = load_video(video_path, duration, video_width, video_height)

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

        if char["words"]:
            background = add_subtitles(background, identity, char["words"], enter, exit)

    scene_video_path = f"output_{scene['location'].replace(' ', '_')}_{ind}.mp4"
    background.output(scene_video_path, vcodec='libx264', acodec='aac').run(overwrite_output=True)
    scene_videos.append(ffmpeg.input(scene_video_path))
    ind += 1

# Combine all scene videos into a single video
'''combined_video = ffmpeg.concat(*scene_videos, v=1, a=1).output("combined_video.mp4")
combined_video.run(overwrite_output=True)

# Clean up individual scene videos
for scene_video_path in [f"output_{scene['location'].replace(' ', '_')}.mp4" for scene in scenes]:
    os.remove(scene_video_path)'''