
import re
import os

# Define the directory paths
emotion_dir = "../assets/characters/emotions"
action_dir = "../assets/characters/actions"
background_dir = "../assets/backgrounds"

# Define the script
script = """
Scene 1:
Location: street in autumn 1
Characters:
Identity: First Person (Main Character)
Action: Walking
Emotion: Being excited
Enter: Walk in from the left
Duration: 5 seconds
Exit: Continue walking out of frame
Dialogue: (Thinking to self) Finally, school is over for the day. I can't wait to get home and relax.
Scene 2:
Location: street in autumn 1
Characters:
Identity: First Person (Main Character)
Action: Being
Emotion: Being amazed
Enter: Already on screen
Duration: 5 seconds
Exit: Stay on screen
Identity: Celebrity (Side Character)
Action: Talking (someone else)
Emotion: Being cool
Enter: Walk in from the right
Duration: 5 seconds
Exit: Stay on screen
Dialogue: (Spotting the celebrity) Oh my gosh, is that... (Celebrity's name)? The famous actress/actor? Here, in my neighborhood?
Scene 3:
Location: street in autumn 1
Characters:
Identity: First Person (Main Character)
Action: Crying
Emotion: Being very sad
Enter: Already on screen
Duration: 5 seconds
Exit: Stay on screen
Identity: Celebrity (Side Character)
Action: Talking (someone else)
Emotion: Being disgusted
Enter: Already on screen
Duration: 5 seconds
Exit: Walk away out of frame
Dialogue:
First Person: (Mustering courage) H-Hey, (Celebrity's name)! I'm a huge fan!
Celebrity: (Looks around, sees First Person with a disgusted look) Ugh, whatever.
Scene 4:
Location: street in autumn 1
Characters:
Identity: First Person (Main Character)
Action: Being
Emotion: Being surprised
Enter: Already on screen
Duration: 5 seconds
Exit: Walk away out of frame
Dialogue: (Narrating) I... I can't believe it. My idol, the person I admired so much, just treated me like trash. I'm so disappointed and heartbroken. Guess celebrities aren't who they seem after all.
"""

# Parse the script
scenes = script.strip().split("Scene ")[1:]

# Generate FFMPEG commands
ffmpeg_commands = []

for scene_index, scene in enumerate(scenes, start=1):
    lines = scene.strip().split("\n")
    background_image = lines[1].split(": ")[1].replace(" ", "_") + ".jpg"  # Assuming only one background image per scene
    background_path = os.path.join(background_dir, background_image)

    for line in lines[1:]:
        if line.startswith("Identity"):
            identity = line.split(": ")[1]
        elif line.startswith("Action"):
            action = line.split(": ")[1]
        elif line.startswith("Emotion"):
            emotion = line.split(": ")[1]
        elif line.startswith("Enter"):
            enter = line.split(": ")[1]
        elif line.startswith("Duration"):
            duration = int(line.split(": ")[1].split()[0])  # Assuming duration is in seconds
        elif line.startswith("Exit"):
            exit_ = line.split(": ")[1]
        elif line.startswith("Dialogue"):
            pattern = r'\([^)]*\)'
    
            result = re.sub(pattern, '', line)
            dialogue = result.split(": ")[1]

    if "Being" in action:
        character_path = os.path.join(emotion_dir, f"{emotion}.mp4")
    else:
        character_path = os.path.join(action_dir, f"{action}.mp4")

    output_filename = f"output_scene_{scene_index}.mp4"
    ffmpeg_command = (
        f"ffmpeg -loop 1 -i {background_path} -i {character_path} "
        f"-filter_complex "
        f"[1:v]scale=640:360[v1];[0:v][v1]overlay=main_w-overlay_w-10:main_h-overlay_h-10 "
        f"-c:v libx264 -t {duration} -pix_fmt yuv420p {output_filename}"
    )
    ffmpeg_commands.append(ffmpeg_command)
    os.system(ffmpeg_command)  # Execute the FFMPEG command

    print(f"Scene {scene_index} processed and saved as {output_filename}")

print("All scenes processed successfully.")