import openai

def generate_script(prompt):
    openai.api_key = 'YOUR_API_KEY'
    
    structured_prompt = (
        
f"""


You are a screenwriter. Write a script for a video in plain text (not markdown). The script should be divided into scenes. Each scene should include the following elements.:
Scene Index
Location: Describe the location. Only use locations from the provided list.
Characters:
Identity: Only names or pronouns. If the plot is in Japanese, write this in Japanese. If the plot is in Chinese, write this in Chinese.
Action: Describe the action.
Words: Write the words that the character says, or this could be inner dialogue if the main character is not saying anything. If the plot is in Japanese, write this in Japanese. If the plot is in Chinese, write this in Chinese.
Emotion: Describe the emotion.
Enter: Enter time in minutes and seconds in two digit minutes:two digit seconds
Time: How long the character stays in minutes and seconds in  two digit minutes:two digit seconds
Exit: Exit time in minutes and seconds in two digit minutes:two digit seconds

Use this format to write the script for the following plot:

f{prompt}


Important Instructions:
1. You must strictly follow the script format provided.
2. Identity must only contain a name or a pronoun.
3. Make each scene at most 5 seconds long.
4. If multiple characters appear on screen simultaneously, ensure their Enter and Exit times overlap.
5. Always put the script for the main character, or first person, above everyone else.
6. Do not say anything other than giving the script.
7. Do not use any words like 'inner diagloe' even if it is inner thoughts.
8. For the main character, use only actions from the list without the suffix "(someone else)".
9. The first Enter time of the next scene has to match the last Exit time of the last scene so there are no gaps.
10. If the emotion is a negative one and there is no suitable one from the list, use 'Being sad'
11. If the emotion is a positive one and there is no suitable one from the list, use 'Being happy'
12. If there is no suitable action to pick from the list, use 'Running'
13. If the plot is not in English, you should change to that language for 'Identity' and 'Words', keep the rest in English.
14. Make characters that are doing something together, overlap in their Enter and Exit times.


Now, take the script you created and modify it so it strictly uses similar emotions and actions only from the provided actions and emotions of the below lists.
Do not use any actions or emotions outside of the lists, even if they seem appropriate.
Rules:
1. If the emotion is a negative one and there is no suitable one from the list, use 'Being sad'
2. If the emotion is a positive one and there is no suitable one from the list, use 'Being happy'
3. If there is no suitable action to pick from the list, use 'Running'

Here are the lists:

Emotions:
1. Being depressed
2. Being happy
3. Being evil2
4. Being scared
5. Being confused
6. Being sassy
7. Being surprised2
8. Being sad
9. Being surprised
10. Being nervous
11. Being anxious
12. Being excited
13. Being cold
14. Being cool
15. Being curious
16. Being blind
17. Being evil
18. Being afraid
19. Being disappointed
20. Being in a tense relationship
21. Being angry
22. Being bored
23. Being tired
24. Being wet
25. Being confident
26. Being excited2
27. Being hungry
28. Being disgusted
29. Being regretful
30. Being satisfied

Actions:1. Running
2. Taking a selfie
3. Boss talking (someone else)
4. Laughing
5. Fighting
6. Driving2
7. Reading
8. Having fun
9. Screaming
10. Writing
11. Asking
12. Driving
13. Singing
14. Pretending to sleep
15. Listening but confused
16. Watching TV
17. Sleeping
18. Using a computer
19. Facing an opponent
20. Walking
21. Shooting a gun
22. Waking up
23. Dancing
24. Enjoying music
25. Moving out
26. Playing piano
27. Realizing
28. Bouncing to a beat
29. Cooking
30. Talking
31. Travelling
32. Eating
33. Listening
34. Talking (someone else)
35. Painting
36. Sleeping2
37. Hitting someone
38. Going somewhere
39. Loving
40. Having a meeting
41. Strongly disagree

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