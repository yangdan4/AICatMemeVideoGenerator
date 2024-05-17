
from scripts.generate_script import generate_script
from scripts.parse_script import parse_script
from scripts.select_assets import select_assets
from scripts.create_video import create_video

def main():
    user_prompt = input("Enter the plot and characters of the VLOG: ")
    script = generate_script(user_prompt)
    parsed_scenes = parse_script(script)
    assets = select_assets(parsed_scenes)
    create_video(assets)
    print("Video generation complete!")

if __name__ == "__main__":
    main()