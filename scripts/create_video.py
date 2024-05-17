import subprocess

def create_video(assets):
    for i, scene in enumerate(assets):
        background = scene['background']
        output_file = f"scene_{i+1}.mp4"
        
        character_videos = [char['video'] for char in scene['characters']]
        filters = []
        
        for j, char in enumerate(scene['characters']):
            enter_time, enter_animation = char['enter'].split()
            duration = char['duration']
            exit_time, exit_animation = char['exit'].split()
            
            filters.append(f"[{j+1}:v] trim=start={enter_time}:end={duration} [char{j}]; [char{j}] "
                           f"{enter_animation} [in{j}]; [in{j}] overlay=x={j*10}:y={j*10} [tmp{j}]")
        
        filters_str = "; ".join(filters)
        inputs = " ".join([f"-i {vid}" for vid in character_videos])
        
        ffmpeg_command = (
            f"ffmpeg -loop 1 -t 5 -i {background} {inputs} "
            f"-filter_complex \"{filters_str}\" -map \"[tmp{len(character_videos)-1}]\" "
            f"-c:v libx264 -pix_fmt yuv420p {output_file}"
        )
        
        subprocess.run(ffmpeg_command, shell=True)

create_video(assets)