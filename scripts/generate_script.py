import openai

def generate_script(prompt):
    openai.api_key = 'YOUR_API_KEY'
    structured_prompt = (
        "You are a screenwriter. Write a script for a video where the main character is first person. "
        "The script should be divided into scenes. Each scene should include the following elements: "
        "1. Location: Describe the location. "
        "2. Characters: List the characters involved and for each character provide:\n"
        "   a. Identity: Who is this character, is the character first person or some side character.\n"
        "   b. Action: Describe the action. If it is better in this scene for the character to not do an active action and just express motion, just use the verb \'being\'\n"
        "   c. Emotion: Describe the emotion, use a phrase like \"Being \{some emotion\}\" to describe an emotion.\n"
        "   d. Enter: Enter time and animation.\n"
        "   e. Duration: How long the character stays.\n"
        "   f. Exit: Exit time and animation.\n"
        "3. Dialogue: Write the dialogue between the characters, or this could describe characters are doing if there is no dialogue.\n"
        "Each element should be clearly labeled.\n"
        "The vlog will be in first person. Most of the time, that is the only character.\n"
        "Make each scene at most 5 seconds.\n"
        "In the action, if you want to describe some emotion, you have to say \"Being \{the emotion\}\".\n"
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