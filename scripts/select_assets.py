def select_assets(parsed_scenes):
    assets = []
    for scene in parsed_scenes:
        scene_assets = {
            "background": f"backgrounds/{scene['location']}.jpg",
            "characters": [],
            "dialogue": scene["dialogue"]
        }
        for character in scene["characters"]:
            character_asset = {
                "name": character['mood'],
                "video": f"characters/{character['mood']}.mp4",
                "enter": character['enter'],
                "duration": character['duration'],
                "exit": character['exit']
            }
            scene_assets["characters"].append(character_asset)
        assets.append(scene_assets)
    return assets

assets = select_assets(parsed_scenes)
print(assets)