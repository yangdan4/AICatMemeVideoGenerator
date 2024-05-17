import openai

# Load filenames from text files
with open('../background_file_names.txt', 'r') as f:
    background_filenames = f.readlines()
    background_filenames = [name.strip() for name in background_filenames]

with open('../character_file_names.txt', 'r') as f:
    character_filenames = f.readlines()
    character_filenames = [name.strip() for name in character_filenames]

def select_assets(parsed_scenes):
    assets = []
    for scene in parsed_scenes:
        scene_assets = {
            "background": "",  # Placeholder for background
            "characters": [],
            "dialogue": scene["dialogue"]
        }
        location = scene['location']
        scene_number = location.split()[-1]  # Extracting the number from location
        # Get background image
        background_image = background_filenames[int(scene_number) % len(background_filenames)]
        scene_assets["background"] = f"backgrounds/{background_image}.jpg"

        for character in scene["characters"]:
            # Prompt for character video selection
            prompt = f"Select the character video for {character['action']} in scene {location}: "
            prompt += f"\"The vlog will be in first person. Most of the time that is the only character. "
            prompt += f"All character videos are some verb phrase, but many of them are emotions with 'Being some emotion', "
            prompt += f"and the reset are action verb phrases. When deciding which character video to use, "
            prompt += f"if there is an action verb phrase video, use that; only use an emotion phrase video if there are no suitable action verb phrase videos. "
            prompt += f"Give a greater chance of picking the same action/emotion with the smaller number at the end. "
            prompt += f"Also give a greater chance of picking the same location image with the smaller number at the end. "
            prompt += f"The character videos with parentheses (someone else) at the end means this character video only meant for another character that is not first person. "
            prompt += f"A character video that doesn’t have these parentheses can be used for any character.\""
            
            # Select character video using OpenAI API
            response = openai.Completion.create(
                engine="davinci",
                prompt=prompt,
                max_tokens=50,
                n=1,
                stop=None,
                temperature=0.5,
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )
            character_video = response.choices[0].text.strip()

            character_asset = {
                "name": character_video,
                "video": "",  # Placeholder for video filename
                "enter": character['enter'],
                "duration": character['duration'],
                "exit": character['exit']
            }
            # Get character video filename
            character_video_filename = character_video.lower().replace(' ', '_') + ".mp4"
            # Check if the filename exists in character filenames list
            if character_video_filename in character_filenames:
                character_asset["video"] = f"characters/{character_video_filename}"
            else:
                # If filename doesn't exist, use a default name
                character_asset["video"] = f"characters/default_character.mp4"

            scene_assets["characters"].append(character_asset)

        assets.append(scene_assets)
    return assets

# Call the function with parsed scenes
assets = select_assets(parsed_scenes)
print(assets)