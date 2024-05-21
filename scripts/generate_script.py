import openai

def generate_script(prompt):
    openai.api_key = 'YOUR_API_KEY'
    
    structured_prompt = (
        
f"""

You are a screenwriter. Write a script for a video where the main character is in the first person. The script should be divided into scenes. Each scene should include the following elements:

Location: Describe the location. Only use locations from the provided list.
Characters:
a. Identity: Who is this character, is the character first person or some side character.
b. Action: Describe the action.
c. Words: Write the words that the character says, or this could be inner dialogue if the main character is not saying anything. 
d. Emotion: Describe the emotion.
e. Enter: Enter time in minutes and seconds.
f. Time: How long the character stays in minutes and seconds..
g. Exit: Exit time in minutes and seconds.

Use this format to write the script for the following plot:

f{prompt}


Important Instructions:
1. You must strictly follow the script format provided.
2. For side characters, if an appropriate action exists in the list with "(someone else)", use it.
3. Make each scene at most 5 seconds long.
4. If multiple characters appear on screen simultaneously, ensure their Enter and Exit times overlap.
5. Always put the script for the main character, or first person, above everyone else.
6. Do not say anything other than giving the script.
7. Do not use any words like 'inner diagloe' even if it is inner thoughts.
8. For the main character, use only actions from the list without "(someone else)".
9. The first Enter time of the next scene has to match the last Exit time of the last scene so there are no gaps.


Now, take the script you created and modify it so it strictly uses similar emotions and actions only from the provided actions and emotions of the below lists.
If no action from the list fits or emotion is strong, use the word 'Feel'
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
1. Feeling
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
24. Listening
25. Eating
26. Talking (someone else)
27. Sleeping2
28. Hitting someone
29. Going somewhere
30. Asking
31. Strongly disagree

Locations:
1. inside train
2. street in autumn
3. th stalls 3
4. school rooftop
5. hospital lobby
6. pc room2
7. elevator hall facility
8. pond park
9. staff room
10. retro living
11. library room
12. restaurant 3
13. street in spring
14. japanese corridor
15. pc room
16. japanese style house
17. street in summer
18. tatami pc
19. archive room
20. jp passage way
21. apartment hallway
22. single room3
23. urban street
24. school ground
25. house hallway
26. atm corner
27. school in spring
28. japanese bathroom
29. hideout
30. summer beach
31. station platform
32. playground
33. counter
34. cluttered room
35. 2nd floor hallway
36. small bathroom
37. street in winter
38. casual restaurant
39. school music room
40. country road
41. conveyor belt sushi
42. intersection
43. connecting corridor
44. house
45. facility2
46. veranda condominium
47. ruined room
48. school store
49. house2
50. jp entrance hall
51. city station
52. local bus station
53. bedroom 6
54. building hallway
55. convenience store
56. hot spring 3
57. used bookstore
58. in car
59. kyudo hall
60. campus
61. machine room
62. levee trail
63. single room2
64. shopping arcade
65. apartment
66. school entrance
67. hotel entrance
68. condominium
69. emergency staircase
70. local station
71. ryokan reception
72. high rise building
73. condominium corridor
74. bar
75. residential street
76. facility
77. art museum
78. mall2
79. rural railside
80. shopping street
81. double room
82. crossing in city
83. seaside bus stop
84. station concourse
85. medium office
86. supermarket
87. tatami tv
88. school courtyard bench
89. back of classroom
90. shooting stall 3
91. sea island 7
92. shop in park
93. stairs facility
94. small playground
95. front of classroom
96. back alley
97. office
98. single room
99. cafe
100. mall

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