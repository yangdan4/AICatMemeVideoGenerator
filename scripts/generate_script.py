import openai

def generate_script(prompt):
    openai.api_key = 'YOUR_API_KEY'
    
    structured_prompt = (
        
f"""
You are a screenwriter. Write a script for a video where the main character is in the first person. The script should be divided into scenes. Each scene should include the following elements:

Location: Describe the location. Only use locations from the provided list.
Characters: List the characters involved and for each character provide:
a. Identity: Who is this character, is the character first person or some side character.
b. Action: Describe the action.
c. Words: Write the words that the character says, or this could be inner dialogue if the main character is not saying anything. 
d. Emotion: Describe the emotion.
e. Enter: Enter time in minutes and seconds.
f. Duration: How long the character stays in minutes and seconds.
g. Exit: Exit time in minutes and seconds.

Use this format to write the script for the following plot:f"{prompt}"


Important Instructions:
1. For the main character, use only actions from the list without "(someone else)".
2. For side characters, if an appropriate action exists in the list with "(someone else)", use it.
3. Make each scene at most 5 seconds long.
4. If multiple characters appear on screen simultaneously, ensure their Enter and Exit times overlap.
5. Always put the script for the main character, or first person, above everyone else.
6. Do not say anything other than giving the script.


Now, take the script you created and modify it so it strictly uses similar emotions and actions only from the provided actions and emotions of the below lists.
If no action from the list fits or emotion is strong, use the word 'None'
Do not use any actions or emotions outside of the lists, even if they seem appropriate.

Here are the lists:

Emotions:
1. Being confident or satisfied
2. Being very sad
3. Being happy
4. Being schrewd
5. Being confused
6. Being disgusted
7. Being sassy
8. Being surprised2
9. Being scared or down
10. Being surprised
11. Being nervous
12. Being lectured
13. Being excited
14. Being cold
15. Being cool
16. Being curious
17. Being blind
18. Being evil
19. Being hungry
20. Being in a tense relationship
21. Being angry
22. Being tired
23. Being wet
24. Being excited2

Actions:
1. Being
2. Running
3. Taking a selfie
4. Boss talking (someone else)
5. Jogging
6. Fighting
7. Driving2
8. Having fun
9. Coding
10. Driving
11. Pretending to sleep
12. Listening but confused
13. Sleeping
14. Using a computer
15. Facing an opponent
16. Shooting a gun
17. Dancing
18. Enjoying music
19. Moving out
20. Playing piano
21. Bouncing to a beat
22. Realizing the truth
23. Talking
24. Taking orders
25. Eating
26. Talking (someone else)
27. Sleeping2
28. Hitting someone
29. Going somewhere
30. Talking 2 (someone else)
31. Strongly disagree

Locations:
1. inside train 1
2. street in autumn 1
3. th stalls 3
4. school rooftop 1
5. hospital lobby 1
6. pc room2 1
7. elevator hall facility 1
8. pond park 1
9. staff room 1
10. retro living 1
11. library room 1
12. restaurant 3
13. street in spring 1
14. japanese corridor 1
15. pc room 1
16. japanese style house 1
17. street in summer 1
18. tatami pc 1
19. archive room 1
20. jp passage way 1
21. apartment hallway 1
22. single room3 1
23. urban street 1
24. school ground 1
25. house hallway 1
26. atm corner 1
27. school in spring 1
28. japanese bathroom 1
29. hideout 1
30. summer beach 1
31. station platform 1
32. playground 1
33. counter 1
34. cluttered room 1
35. 2nd floor hallway 1
36. small bathroom 1
37. street in winter 1
38. casual restaurant 1
39. school music room 1-1
40. country road 1
41. conveyor belt sushi 1
42. intersection 1
43. connecting corridor 1
44. house 1
45. facility2 1
46. veranda condominium 1
47. ruined room 1
48. school store 1
49. house2 1
50. jp entrance hall 1
51. city station 1
52. local bus station 1
53. bedroom 6
54. building hallway 1
55. convenience store 1
56. hot spring 3
57. used bookstore 1
58. in car 1
59. kyudo hall 1
60. campus 1
61. machine room 1
62. levee trail 1
63. single room2 1
64. shopping arcade 1
65. apartment 1
66. school entrance 1
67. hotel entrance 1
68. condominium 1
69. emergency staircase 1
70. local station 1
71. ryokan reception 1
72. high rise building 1
73. condominium corridor 1
74. bar 1
75. residential street 1
76. facility 1
77. art museum 1
78. mall2 1
79. rural railside 1
80. shopping street 1
81. double room 1
82. crossing in city 1
83. seaside bus stop 1
84. station concourse 1
85. medium office 1
86. supermarket 1
87. tatami tv 1
88. school courtyard bench 1
89. back of classroom 1
90. shooting stall 3
91. sea island 7
92. shop in park 1
93. stairs facility 1
94. small playground 1
95. front of classroom 1
96. back alley 1
97. office 1
98. single room 1
99. cafe 1
100. mall 1
"""

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