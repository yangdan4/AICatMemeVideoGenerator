import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Picker, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';
import { Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

const ScriptEditorScreen = ({ route, navigation }) => {
  const { script, scriptName } = route.params;
  const [currentScript, setCurrentScript] = useState(script);
  const [actions, setActions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPresets = async () => {
      const response = await axios.get(`http://${serverHost}:${serverPort}/get_presets`);
      setActions(response.data.actions);
      setLocations(response.data.locations);
    };

    fetchPresets();
  }, []);

  const handleAddScene = () => {
    const newScene = {
      scene_index: currentScript.length + 1,
      location: locations[0],
      characters: [],
    };
    setCurrentScript([...currentScript, newScene]);
  };

  const handleSaveScript = async () => {
    try {
      await axios.post(`http://${serverHost}:${serverPort}/update_script`, {
        script_name: scriptName,
        script: currentScript,
      });
      setSnackbarMessage(t('scriptSavedSuccessfully'));
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error saving script:', error);
      setSnackbarMessage(t('errorSavingScript'));
      setSnackbarVisible(true);
    }
  };

  const handleAddCharacter = (sceneIndex) => {
    const updatedScript = currentScript.scenes.map((scene, index) => {
      if (index === sceneIndex) {
        return {
          ...scene,
          characters: [
            ...scene.characters,
            {
              identity: '',
              action: actions[0],
              words: '',
              enter: '00:00',
              time: '00:05',
              exit: '00:05',
            },
          ],
        };
      }
      return scene;
    });
    setCurrentScript(updatedScript);
  };

  const handleSceneChange = (value, sceneIndex, key) => {
    const updatedScript = currentScript.scenes.map((scene, index) => {
      if (index === sceneIndex) {
        return { ...scene, [key]: value };
      }
      return scene;
    });
    setCurrentScript(updatedScript);
  };

  const handleCharacterChange = (value, sceneIndex, characterIndex, key) => {
    const updatedScript = currentScript.scenes.map((scene, index) => {
      if (index === sceneIndex) {
        const updatedCharacters = scene.characters.map((character, cIndex) => {
          if (cIndex === characterIndex) {
            return { ...character, [key]: value };
          }
          return character;
        });
        return { ...scene, characters: updatedCharacters };
      }
      return scene;
    });
    setCurrentScript(updatedScript);
  };

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setSnackbarMessage(t('videoGenerating'));
    setSnackbarVisible(true);

    try {
      const response = await axios.post(`http://${serverHost}:${serverPort}/create_video`, {
        script: currentScript,
      });

      if (response.status !== 200) {
        throw new Error(t('errorGeneratingVideo'));
      }

      const videoPath = await saveVideoBlob(response);
      navigation.navigate('VideoScreen', { videoPath });
    } catch (error) {
      console.error('Error generating video:', error);
      setSnackbarMessage(t('errorGeneratingVideo'));
      setSnackbarVisible(true);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {currentScript.scenes.map((scene, sceneIndex) => (
        <View key={sceneIndex} style={styles.sceneContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('sceneIndex')}
            value={String(scene.scene_index)}
            editable={false}
          />
          <Picker
            selectedValue={scene.location}
            onValueChange={(value) => handleSceneChange(value, sceneIndex, 'location')}
          >
            {locations.map((location, index) => (
              <Picker.Item key={index} label={t(location)} value={location} />
            ))}
          </Picker>
          {scene.characters.map((character, characterIndex) => (
            <View key={characterIndex} style={styles.characterContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('identity')}
                value={character.identity}
                onChangeText={(value) => handleCharacterChange(value, sceneIndex, characterIndex, 'identity')}
              />
              <Picker
                selectedValue={character.action}
                onValueChange={(value) => handleCharacterChange(value, sceneIndex, characterIndex, 'action')}
              >
                {actions.map((action, index) => (
                  <Picker.Item key={index} label={t(action)} value={action} />
                ))}
              </Picker>
              <TextInput
                style={styles.input}
                placeholder={t('words')}
                value={character.words}
                onChangeText={(value) => handleCharacterChange(value, sceneIndex, characterIndex, 'words')}
              />
              <TextInput
                style={styles.input}
                placeholder={t('enterTime')}
                value={character.enter}
                onChangeText={(value) => handleCharacterChange(value, sceneIndex, characterIndex, 'enter')}
              />
              <TextInput
                style={styles.input}
                placeholder={t('time')}
                value={character.time}
                onChangeText={(value) => handleCharacterChange(value, sceneIndex, characterIndex, 'time')}
              />
              <TextInput
                style={styles.input}
                placeholder={t('exitTime')}
                value={character.exit}
                onChangeText={(value) => handleCharacterChange(value, sceneIndex, characterIndex, 'exit')}
              />
            </View>
          ))}
          <Button title={t('addCharacter')} onPress={() => handleAddCharacter(sceneIndex)} />
        </View>
      ))}
      <Button title={t('addScene')} onPress={handleAddScene} />
      <Button title={t('saveScript')} onPress={handleSaveScript} />
      <Button title={t('generateVideo')} onPress={handleGenerateVideo} disabled={isGenerating} />
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sceneContainer: {
    marginBottom: 20,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
  },
  characterContainer: {
    marginTop: 10,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});

export default ScriptEditorScreen;