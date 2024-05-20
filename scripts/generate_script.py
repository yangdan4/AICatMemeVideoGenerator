import openai

def generate_script(prompt):
    openai.api_key = 'YOUR_API_KEY'
    
    structured_prompt = (
        "You are a screenwriter. Write a script for a video where the main character is first person. "
        "The script should be divided into scenes. Each scene should include the following elements: "
        "1. Location: Describe the location. "
        "2. Characters: List the characters involved and for each character provide:\n"
        "   a. Identity: Who is this character, is the character first person or some side character.\n"
        "   b. Action: Describe the action, or 'Being' if there is no action and the character purely feels some emotion.  You must strictly only use actions from the list provided later. Do not use any emotions outside of this list, even if they seem appropriate.\n"
        "   c. Words: Write the words that the character says, or this could be inner dialogue if the main character is not saying anything. You must preserve the plot content as much as possible. Must not use any placeholders. Must not use any words to describe what the scene is.\n"
        "   d. Emotion: Describe the emotion, use a phrase like \"Being \{some emotion\}\" to describe an emotion. You must strictly only use emotions from the list provided later. Do not use any emotions outside of this list, even if they seem appropriate.\n"
        "   e. Enter: Enter time in minutes and seconds.\n"
        "   f. Duration: How long the character stays.\n"
        "   g. Exit: Exit time in minutes and seconds.\n"
        "Each element should be clearly labeled.\n"
        "The vlog will be in first person. Most of the time, that is the only character.\n"
        "All time formats must be in mm:ss\n"
        "You must put \'Characters:\'\n"
        "However, if it makes sense for multiple characters to appear on screen at the same time, then do it. Make sure the Enter and Exit times of different characters overlap in this case.\n"
        "For each scene, strictly make sure that the time for the first 'Enter' starts at 00:00.\n"
        "Make each scene at most 5 seconds.\n"
        "Pick an emotion from the following list. If the emotion you want does not exist in the list, use your best judgement to pick a similar emotion from the list.\n"
        "Important: You must strictly only use emotions from the list provided below. Do not use any emotions outside of this list, even if they seem appropriate.\n"
        '''
            Being confident or satisfied
            Being very sad
            Being happy
            Being schrewd
            Being amazed
            Being confused
            Being sassy
            Being surprised2
            Being scared or down
            Being surprised
            Being nervous
            Being bored from conversation
            Being excited
            Being cold
            Being cool
            Being curious
            Being blind
            Being evil
            Being hundry
            Being in a tense relationship
            Being angry
            Being tired
            Being wet
            Being excited2
            Being disgusted
        '''
        "Pick an action from the following list. If the action you want does not exist in the list, or there is no similar one, just strictly use the verb 'Being'. If the action is for another character that is not the main character, and there is a matching action in the below list with (someone else), pick it. If the action is for the main character, do not use any of the below list with (someone else).\n"
        "Important: You must strictly only use actions from the list provided below. Do not use any actions outside of this list, even if they seem appropriate. If no action in the list fits, use the verb 'Being' instead.\n"
        '''
            Being
            Running
            Taking a selfie
            Boss talking (someone else)
            Jogging
            Fighting
            Driving2
            Having fun
            Coding
            Driving
            Pretending to sleep
            Listening but confused
            Sleeping
            Using a computer
            Facing an opponent
            Shooting a gun
            Dancing
            Enjoying music
            Moving out
            Playing piano
            Bouncing to a beat
            Realizing the truth
            Talking
            Taking orders
            Eating
            Talking (someone else)
            Sleeping2
            Hitting someone
            Going somewhere
            Talking 2 (someone else)
            Looking forward to something
            Strongly disagree
            Crying \n'''
        "Pick a location from the following list. If the location you want does not exist in the list, use your best judgement to pick a similar location from the list.\n"
        "Important: You must strictly only use locations from the list provided below. Do not use any locations outside of this list, even if they seem appropriate.\n"
        '''
        inside train 1
        street in autumn 1
        th stalls 3
        school rooftop 1
        hospital lobby 1
        pc room2 1
        elevator hall facility 1
        pond park 1
        staff room 1
        retro living 1
        library room 1
        restaurant 3
        street in spring 1
        japanese corridor 1
        pc room 1
        japanese style house 1
        street in summer 1
        tatami pc 1
        archive room 1
        jp passage way 1
        apartment hallway 1
        single room3 1
        urban street 1
        school ground 1
        house hallway 1
        atm corner 1
        school in spring 1
        japanese bathroom 1
        hideout 1
        summer beach 1
        station platform 1
        playground 1
        counter 1
        cluttered room 1
        2nd floor hallway 1
        small bathroom 1
        street in winter 1
        casual restaurant 1
        school music room 1-1
        country road 1
        conveyor belt sushi 1
        intersection 1
        connecting corridor 1
        house 1
        facility2 1
        veranda condominium 1
        ruined room 1
        school store 1
        house2 1
        jp entrance hall 1
        city station 1
        local bus station 1
        bedroom 6
        building hallway 1
        convenience store 1
        hot spring 3
        used bookstore 1
        in car 1
        kyudo hall 1
        campus 1
        machine room 1
        levee trail 1
        single room2 1
        shopping arcade 1
        apartment 1
        school entrance 1
        hotel entrance 1
        condominium 1
        emergency staircase 1
        local station 1
        ryokan reception 1
        high rise building 1
        condominium corridor 1
        bar 1
        residential street 1
        facility 1
        art museum 1
        mall2 1
        rural railside 1
        shopping street 1
        double room 1
        crossing in city 1
        seaside bus stop 1
        station concourse 1
        medium office 1
        supermarket 1
        tatami tv 1
        school courtyard bench 1
        back of classroom 1
        shooting stall 3
        sea island 7
        shop in park 1
        stairs facility 1
        small playground 1
        front of classroom 1
        back alley 1
        office 1
        single room 1
        cafe 1
        mall 1
        living 1
        summer river 1
        izakaya table 1
        attic room 1
        small sandy beach 1
        behind school gym 1
        park gazebo bench 1
        under bridge 1
        vending machine 1
        storeroom 1
        living2 1
        pedestrian bridge 1
        library 1
        ryokan room 1
        hospital 1
        shrine 1
        park in autumn 1
        bookstore 1
        building 1
        park in spring 1
        in convenience store 1
        basement room 1
        ruined hallway 1f 1
        police station 1
        railroad crossing 1
        '''
        "Use this format to write the script for the following plot:\n\n"
        f"{prompt}")
    
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=structured_prompt,
        max_tokens=1500
    )
    return response.choices[0].text.strip()

user_prompt = "A fun day at the park with friends where they find a hidden treasure."
script = generate_script(user_prompt)
print(script)