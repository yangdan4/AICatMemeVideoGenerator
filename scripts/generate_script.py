import openai

def generate_script(prompt):
    openai.api_key = 'YOUR_API_KEY'
    structured_prompt = (
        "You are a screenwriter. Write a script for a VLOG featuring cat characters. "
        "The script should be divided into scenes. Each scene should include the following elements: "
        "1. Location: Describe the location. "
        "2. Characters: List the characters involved and for each character provide:\n"
        "   a. Mood: Describe the mood.\n"
        "   b. Enter: Enter time and animation.\n"
        "   c. Duration: How long the character stays.\n"
        "   d. Exit: Exit time and animation.\n"
        "3. Dialogue: Write the dialogue between the characters. "
        "Each element should be clearly labeled. Here's an example format:\n\n"
        "Scene 1:\n"
        "Location: Living Room\n"
        "Characters:\n"
        "  - Fluffy: Mood: Happy, Enter: 0s fade-in, Duration: 10s, Exit: 10s fade-out\n"
        "  - Whiskers: Mood: Curious, Enter: 5s slide-in, Duration: 10s, Exit: 15s slide-out\n"
        "Dialogue:\n"
        "Fluffy: Hey Whiskers, have you seen my toy?\n"
        "Whiskers: No, have you checked under the couch?\n\n"
        "Use this format to write the script for the following plot:\n\n"
        f"{prompt}"
    )
    
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=structured_prompt,
        max_tokens=1500
    )
    return response.choices[0].text.strip()

user_prompt = "A fun day at the park with friends where they find a hidden treasure."
script = generate_script(user_prompt)
print(script)