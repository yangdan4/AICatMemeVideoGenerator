import os
import ffmpeg
import re
import shutil
from sentence_transformers import SentenceTransformer, util

# Load the pre-trained model
model = SentenceTransformer('sentence-transformers/msmarco-distilbert-base-v3')

# Define the script
script = """
Scene 1
Location: Park
Characters:
Identity: 私
Action: Running
Words: 楽しいね！
Enter: 00:00
Time: 00:05
Exit: 00:05

Identity: 友達
Action: Running
Words: うん、気持ちいい！
Enter: 00:00
Time: 00:05
Exit: 00:05

Scene 2
Location: Park Path
Characters:
Identity: 私
Action: Being surprised
Words: あっ！
Enter: 00:05
Time: 00:03
Exit: 00:08

Identity: 友達
Action: Being surprised
Words: どうしたの？
Enter: 00:05
Time: 00:03
Exit: 00:08

Scene 3
Location: Park Path
Characters:
Identity: 私
Action: Looking down
Words: ゴキブリを踏んでしまった…
Enter: 00:08
Time: 00:05
Exit: 00:13

Identity: 友達
Action: Looking down
Words: ええっ、それはひどい…
Enter: 00:08
Time: 00:05
Exit: 00:13

Scene 4
Location: Park Path
Characters:
Identity: 私
Action: Being horrified
Words: 本当にごめんね。
Enter: 00:13
Time: 00:03
Exit: 00:16

Identity: 友達
Action: Nodding
Words: 大丈夫だよ。
Enter: 00:13
Time: 00:03
Exit: 00:16
"""

assets_dir = "../assets"
characters_dir = os.path.join(assets_dir, "characters")
backgrounds_dir = os.path.join(assets_dir, "backgrounds")

def convert_to_time_format(seconds):
    milliseconds = int((seconds - int(seconds)) * 1000)
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d},{milliseconds:03d}"

def get_sec(time_str):
    m, s = time_str.split(':')
    return int(m) * 60 + int(s)

def find_closest_match(phrase, options):
    phrase_embedding = model.encode([phrase])[0]
    options_embeddings = model.encode(options)
    cosine_scores = util.pytorch_cos_sim(phrase_embedding, options_embeddings)
    closest_match_index = cosine_scores.argmax().item()
    return options[closest_match_index]

def preprocess_script(script, action_names, location_names):
    lines = script.strip().split("\n")
    processed_lines = []
    action_count = {}

    for line in lines:
        line = line.strip()

        if line.startswith("Scene"):
            action_count = {}
            processed_lines.append(line)
        elif line.startswith("Location:"):
            location = line.split(":")[1].strip()
            closest_location = find_closest_match(location, location_names)
            processed_lines.append(f"Location: {closest_location}")
        elif line.startswith("Action:"):
            action = line.split(":")[1].strip()
            closest_action = find_closest_match(action, action_names)
            if closest_action in action_count:
                action_count[closest_action] += 1
                line = f"Action: {closest_action} {action_count[closest_action]}"
            else:
                action_count[closest_action] = 1
                line = f"Action: {closest_action}"
            processed_lines.append(line)
        else:
            processed_lines.append(line)

    return "\n".join(processed_lines)

action_names = [
    "Being depressed", "Being happy", "Being evil2", "Being scared", "Being confused", "Being sassy",
    "Being surprised2", "Being sad", "Being surprised", "Being nervous", "Being anxious", "Being excited",
    "Being cold", "Being cool", "Being curious", "Being blind", "Being evil", "Being afraid",
    "Being disappointed", "Being in a tense relationship", "Being angry", "Being bored", "Being tired",
    "Being wet", "Being confident", "Being excited2", "Being hungry", "Being disgusted", "Being regretful",
    "Being satisfied", "Running", "Taking a selfie", "Boss talking", "Laughing", "Fighting", "Driving2",
    "Reading", "Having fun", "Screaming", "Writing", "Asking", "Driving", "Singing", "Pretending to sleep",
    "Listening but confused", "Watching TV", "Sleeping", "Using a computer", "Running 2", "Facing an opponent",
    "Walking", "Shooting a gun", "Waking up", "Dancing", "Enjoying music", "Moving out", "Playing piano",
    "Realizing", "Bouncing to a beat", "Cooking", "Talking", "Travelling", "Eating", "Listening", "Running copy",
    "Painting", "Sleeping2", "Hitting someone", "Going somewhere", "Loving", "Having a meeting", "Strongly disagree"
]

location_names = [
    "inside train", "street in autumn", "th stalls 3", "school rooftop", "hospital lobby", "pc room2", 
    "elevator hall facility", "pond park", "staff room", "retro living", "library room", "restaurant 3",
    "street in spring", "japanese corridor", "pc room", "japanese style house", "street in summer", "tatami pc",
    "archive room", "jp passage way", "apartment hallway", "single room3", "urban street", "school ground", 
    "house hallway", "atm corner", "school in spring", "japanese bathroom", "hideout", "summer beach", 
    "station platform", "playground", "counter", "cluttered room", "2nd floor hallway", "small bathroom", 
    "street in winter", "casual restaurant", "school music room", "country road", "conveyor belt sushi", 
    "intersection", "connecting corridor", "house", "facility2", "veranda condominium", "ruined room", 
    "school store", "house2", "jp entrance hall", "city station", "local bus station", "bedroom 6", 
    "building hallway", "convenience store", "hot spring 3", "used bookstore", "in car", "kyudo hall", 
    "campus", "machine room", "levee trail", "single room2", "shopping arcade", "apartment", "school entrance", 
    "hotel entrance", "condominium", "emergency staircase", "local station", "ryokan reception", 
    "high rise building", "condominium corridor", "bar", "residential street", "facility", "art museum", 
    "mall2", "rural railside", "shopping street", "double room", "crossing in city", "seaside bus stop", 
    "station concourse", "medium office", "supermarket", "tatami tv", "school courtyard bench", 
    "back of classroom", "shooting stall 3", "sea island 7", "shop in park", "stairs facility", 
    "small playground", "front of classroom", "back alley", "office", "single room", "cafe", "mall"
]

# Preprocess the script
script = preprocess_script(script, action_names, location_names)

# Define utility functions
def load_video(path, duration, video_width, video_height):
    def remove_suffix(filename):
        return re.sub(r' \d+$', '', filename)
    
    try:
        probe = ffmpeg.probe(path)
    except ffmpeg.Error:
        # If the file does not exist, try removing the numerical suffix
        base_path, ext = os.path.splitext(path)
        new_base_path = remove_suffix(base_path)
        new_path = new_base_path + ext
        if os.path.exists(new_path):
            # Copy the file without the suffix to the original path
            shutil.copy(new_path, path)
            probe = ffmpeg.probe(path)
        else:
            raise FileNotFoundError(f"File {path} and {new_path} not found.")

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
    return loaded_video, audio_duration, path

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

SMALLER_ACTIONS = ['Coding', "Driving", 'Driving2', 'Enjoying', 'Looking forward', "Loving", "Playing piano", "Taking a selfie", "Talking 2", 'cold', 'confused', 'evil', 'excited2']
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
        current_scene = {"characters": []}
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
    temp_files = []  # Track temporary files created during this scene
    for char in scene.get("characters", []):
        identity = char["identity"]
        action = char["action"]
        enter = char["enter"] - elapsed_time
        duration = char["time"]
        exit = char["exit"] - elapsed_time
        video_width = WINDOW_WIDTH // 2
        video_height = WINDOW_HEIGHT // 2
        if not '私' in identity and not 'I' in identity and not 'Me' and not '我' in identity and action == 'Talking':
            video_path = os.path.join(characters_dir, "actions", f"{action} (someone else).mp4")
        else:
            video_path = os.path.join(characters_dir, "actions", f"{action}.mp4")
        if any_substring_in_string(SMALLER_ACTIONS, action):
            video_width = WINDOW_WIDTH // 4
            video_height = WINDOW_HEIGHT // 4

        char_video, audio_duration, loaded_video_path = load_video(video_path, duration, video_width, video_height)

        if loaded_video_path != video_path:
            temp_files.append(loaded_video_path)

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
        audio_streams.append(ffmpeg.input(video_path).audio.filter('adelay', f'{delay_ms}|{delay_ms}').filter('asetpts', 'PTS-STARTPTS'))

        if char["words"]:
            char["words"] = char["words"].split(" (")[0]
            # Generate subtitle entry
            start_time_formatted = convert_to_time_format(char["enter"])
            end_time_formatted = convert_to_time_format(char["exit"])
            text = f'{identity.split(" (")[0]}: ' + char["words"]
            subtitles.append(f"{subtitle_index}\n{start_time_formatted} --> {end_time_formatted}\n{text}\n")
            subtitle_index += 1

    # Use pydub to merge audio
    merged_audio = ffmpeg.filter(audio_streams, 'amix', inputs=len(audio_streams)).filter('atrim', duration=scene_duration).output(f'audio_{ind}.mp3')
    merged_audio.run(overwrite_output=True)
    scene_video_path = f'output_{location}_{ind}.mp4'
    scene_audio_path = f'audio_{ind}.mp3'
    background.output(scene_video_path, vcodec='libx264', acodec='aac').run(overwrite_output=True)

    scene_videos.append(ffmpeg.input(scene_video_path).video)
    scene_videos.append(ffmpeg.input(scene_audio_path).audio)
    ind += 1
    elapsed_time += scene_duration

    # Delete temporary files created during this scene
    for temp_file in temp_files:
        if os.path.exists(temp_file):
            os.remove(temp_file)

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
