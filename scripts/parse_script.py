import re

def parse_script(script):
    scenes = script.split("\n\n")
    parsed_scenes = []
    
    for scene in scenes:
        lines = scene.split("\n")
        scene_info = {
            "characters": [],
            "location": None,
            "dialogue": []
        }
        
        for line in lines:
            if "Location:" in line:
                scene_info["location"] = line.split("Location:")[1].strip()
            elif "Characters:" in line:
                continue
            elif "Dialogue:" in line:
                continue
            elif line.startswith("  -"):
                character_info = line.split(":", 1)[1].strip()
                character_parts = character_info.split(", ")
                character_details = {}
                for part in character_parts:
                    key, value = part.split(": ")
                    character_details[key.lower()] = value.strip()
                scene_info["characters"].append(character_details)
            else:
                scene_info["dialogue"].append(line.strip())
        
        parsed_scenes.append(scene_info)
    
    return parsed_scenes

parsed_scenes = parse_script(script)
print(parsed_scenes)