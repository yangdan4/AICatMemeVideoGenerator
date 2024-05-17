import openai

def generate_script(prompt):
    openai.api_key = 'YOUR_API_KEY'
    structured_prompt = (
        "You are a screenwriter. Write a script for a VLOG featuring animal characters. "
        "The script should be divided into scenes. Each scene should include the following elements: "
        "1. Location: Describe the location. "
        "2. Characters: List the characters involved and for each character provide:\n"
        "   a. Action: Describe the action, or you can use an emotion phrase like \"Being \{some emotion\}\" to describe an emotion.\n"
        "   b. Enter: Enter time and animation.\n"
        "   c. Duration: How long the character stays.\n"
        "   d. Exit: Exit time and animation.\n"
        "3. Dialogue: Write the dialogue between the characters, or this could describe characters are doing if there is no dialogue.\n"
        "Each element should be clearly labeled.\n"
        "The vlog will be in first person. Most of the time, that is the only character.\n"
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