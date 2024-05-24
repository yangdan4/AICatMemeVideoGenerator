from sentence_transformers import SentenceTransformer, util

# Load the pre-trained model
model = SentenceTransformer('sentence-transformers/msmarco-distilbert-base-v3')

# Action phrase from the script
action_phrase = "Standing"

# Available action names (asset names)
action_names = ["Being depressed",
"Being happy",
"Being evil2",
"Being scared",
"Being confused",
"Being sassy",
"Being surprised2",
"Being sad",
"Being surprised",
"Being nervous",
"Being anxious",
"Being excited",
"Being cold",
"Being cool",
"Being curious",
"Being blind",
"Being evil",
"Being afraid",
"Being disappointed",
"Being in a tense relationship",
"Being angry",
"Being bored",
"Being tired",
"Being wet",
"Being confient",
"Being excited2",
"Being hungry",
"Being disgusted",
"Being regretful",
"Being satisfied",
"Running",
"Taking a selfie",
"Boss talking",
"Laughing",
"Fighting",
"Driving2",
"Reading",
"Having fun",
"Screaming",
"Writing",
"Asking",
"Driving",
"Singing",
"Pretending to sleep",
"Listening but confused",
"Watching TV",
"Sleeping",
"Using a computer",
"Running 2",
"Facing an opponent",
"Walking",
"Shooting a gun",
"Waking up",
"Dancing",
"Enjoying music",
"Moving out",
"Playing piano",
"Realizing",
"Bouncing to a beat",
"Cooking",
"Talking",
"Travelling",
"Eating",
"Listening",
"Running copy",
"Painting",
"Sleeping2",
"Hitting someone",
"Going somewhere",
"Loving",
"Having a meeting",
"Strongly disagree"
]

# Encode the action phrase and action names
action_phrase_embedding = model.encode([action_phrase])[0]
action_name_embeddings = model.encode(action_names)

# Compute cosine similarity
cosine_scores = util.pytorch_cos_sim(action_phrase_embedding, action_name_embeddings)

# Select the closest match
closest_match_index = cosine_scores.argmax().item()
closest_match = action_names[closest_match_index]

print(f"The closest match for '{action_phrase}' is '{closest_match}'")



location_phrase = "On a ship"

# Available action names (asset names)
location_names = ["inside train",
"street in autumn",
"th stalls 3",
"school rooftop",
"hospital lobby",
"pc room2",
"elevator hall facility",
"pond park",
"staff room",
"retro living",
"library room",
"restaurant 3",
"street in spring",
"japanese corridor",
"pc room",
"japanese style house",
"street in summer",
"tatami pc",
"archive room",
"jp passage way",
"apartment hallway",
"single room3",
"urban street",
"school ground",
"house hallway",
"atm corner",
"school in spring",
"japanese bathroom",
"hideout",
"summer beach",
"station platform",
"playground",
"counter",
"cluttered room",
"2nd floor hallway",
"small bathroom",
"street in winter",
"casual restaurant",
"school music room",
"country road",
"conveyor belt sushi",
"intersection",
"connecting corridor",
"house",
"facility2",
"veranda condominium",
"ruined room",
"school store",
"house2",
"jp entrance hall",
"city station",
"local bus station",
"bedroom 6",
"building hallway",
"convenience store",
"hot spring 3",
"used bookstore",
"in car",
"kyudo hall",
"campus",
"machine room",
"levee trail",
"single room2",
"shopping arcade",
"apartment",
"school entrance",
"hotel entrance",
"condominium",
"emergency staircase",
"local station",
"ryokan reception",
"high rise building",
"condominium corridor",
"bar",
"residential street",
"facility",
"art museum",
"mall2",
"rural railside",
"shopping street",
"double room",
"crossing in city",
"seaside bus stop",
"station concourse",
"medium office",
"supermarket",
"tatami tv",
"school courtyard bench",
"back of classroom",
"shooting stall 3",
"sea island 7",
"shop in park",
"stairs facility",
"small playground",
"front of classroom",
"back alley",
"office",
"single room",
"cafe",
"mall"
]

# Encode the location phrase and location names
location_phrase_embedding = model.encode([location_phrase])[0]
location_name_embeddings = model.encode(location_names)

# Compute cosine similarity
cosine_scores = util.pytorch_cos_sim(location_phrase_embedding, location_name_embeddings)

# Select the closest match
closest_match_index = cosine_scores.argmax().item()
closest_match = location_names[closest_match_index]

print(f"The closest match for '{location_phrase}' is '{closest_match}'")