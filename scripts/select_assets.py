import os
import re
import nltk
import spacy
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Initialize the VADER sentiment analyzer
nltk.download('vader_lexicon')
sid = SentimentIntensityAnalyzer()

# Initialize spaCy
nlp = spacy.load("en_core_web_sm")

# Path to assets directory
ACTION_VIDEO_DIR = "../assets/characters/actions/"
EMOTION_VIDEO_DIR = "../assets/characters/emotions/"
IMAGE_DIR = "../assets/backgrounds/"

# Function to perform sentiment analysis on text
def analyze_sentiment(text):
    sentiment_score = sid.polarity_scores(text)
    emotion = max(sentiment_score, key=sentiment_score.get)
    return emotion

# Function to find the most suitable video based on emotion and action
def find_emotion_video(emotion, action):
    # List all video files in the actions directory
    video_files = os.listdir(EMOTION_VIDEO_DIR)
    suitable_videos = []
    # Check if video name contains emotion or action
    for video in video_files:
        # Calculate similarity score between video name and action
        if emotion.lower() in video.lower():
            suitable_videos.append(video)
    if suitable_videos:
        return suitable_videos[0]  # Return the first suitable video
    else:
        return None
def find_action_video(action):
    # List all video files in the actions directory
    video_files = os.listdir(ACTION_VIDEO_DIR)
    suitable_videos = []
    # Check if video name contains emotion or action
    for video in video_files:
        # Calculate similarity score between video name and action
        similarity_score = fuzz.partial_ratio(video.lower(), action.lower())
        if similarity_score > 80:
            suitable_videos.append(video)
    if suitable_videos:
        return suitable_videos[0]  # Return the first suitable video
    else:
        return None

# Function to find the most suitable background image based on location description
def find_background(location):
    # List all image files in the backgrounds directory
    image_files = os.listdir(IMAGE_DIR)
    suitable_images = []
    # Check if image name contains location
    for image in image_files:
        if location.lower() in image.lower():
            suitable_images.append(image)
    if suitable_images:
        return suitable_images[0]  # Return the first suitable image
    else:
        return None

# Read the script file
with open("script.txt", "r") as f:
    script = f.read()

# Split the script into scenes
scenes = re.split(r"\n\d+\.", script)[1:]

# Process each scene
for scene in scenes:
    # Extract location, characters, actions, and dialogues
    location_match = re.search(r"Location: (.*?)\n", scene)
    characters_match = re.search(r"Characters: (.*?)\n", scene)
    actions_match = re.search(r"Action:(.*?)\n", scene, re.DOTALL)
    dialogue_match = re.search(r"Dialogue:(.*?)\n", scene, re.DOTALL)

    if location_match and characters_match and actions_match:
        location = location_match.group(1).strip()
        characters = characters_match.group(1).strip().split("\n")
        actions = actions_match.group(1).strip().split("\n")
        dialogues = dialogue_match.group(1).strip()

        # Extract verbs from action descriptions
        action_verbs = []
        for action in actions:
            doc = nlp(action)
            for token in doc:
                if token.pos_ == "VERB":
                    action_verbs.append(token.lemma_)

        # If action is 'being', analyze sentiment of emotion
        if "being" in action_verbs:
            emotion = analyze_sentiment(" ".join(actions))
            video = find_emotion_video(emotion, "being")
        else:
            # If action is not 'being', summarize and match with video
            summarized_action = " ".join(action_verbs)
            video = find_action_video("", summarized_action)

        background_image = find_background(location)

        if video and background_image:
            print("Scene:", location)
            print("Characters:", ", ".join(characters))
            print("Action:", actions[0])
            print("Selected Video:", video)
            print("Selected Background Image:", background_image)
            print("\n")
        else:
            print("Scene:", location)
            print("Characters:", ", ".join(characters))
            print("Action:", actions[0])
            print("No suitable video or background image found.")
            print("\n")