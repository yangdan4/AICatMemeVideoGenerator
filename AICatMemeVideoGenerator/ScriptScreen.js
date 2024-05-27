import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet, ScrollView, Animated, Easing, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Card, Snackbar, Searchbar, Dialog, Portal, FAB, IconButton } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './AuthContext';
import { VideoContext } from './VideoContext';
import { serverHost, serverPort } from './consts';
import { fetchWithToken } from './api';

const PAGE_SIZE = 5;

const ScriptScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [scriptName, setScriptName] = useState('');
  const [scripts, setScripts] = useState([]);
  const [filteredScripts, setFilteredScripts] = useState([]);
  const [currentScript, setCurrentScript] = useState(null);
  const [actions, setActions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { setUser } = useContext(AuthContext);
  const { addVideo } = useContext(VideoContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedScripts, setPaginatedScripts] = useState([]);
  const [isScriptCardVisible, setIsScriptCardVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const animatedValue = useRef(new Animated.Value(0)).current;

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [scriptToDelete, setScriptToDelete] = useState(null);

  const [locationOpen, setLocationOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [locationItems, setLocationItems] = useState([]);
  const [actionItems, setActionItems] = useState([]);

  useEffect(() => {
    fetchAllScripts();
    fetchPresets();
  }, []);

  useEffect(() => {
    paginateScripts();
  }, [filteredScripts, currentPage]);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isScriptCardVisible ? 1 : 0,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [isScriptCardVisible]);

  useEffect(() => {
    setLocationItems(locations.map((location) => ({ label: location, value: location })));
    setActionItems(actions.map((action) => ({ label: action, value: action })));
  }, [locations, actions]);

  const fetchAllScripts = async () => {
    try {
      const response = await fetchWithToken(`http://${serverHost}:${serverPort}/get_all_scripts`, {
        method: 'GET'
      });
      const responseJson = await response.json();
      setScripts(responseJson.scripts);
      setFilteredScripts(responseJson.scripts);
    } catch (error) {
      console.error('Error fetching scripts:', error);
    }
  };

  const fetchPresets = async () => {
    try {
      const response = await fetchWithToken(`http://${serverHost}:${serverPort}/get_presets`, {
        method: 'GET'
      });
      const responseJson = await response.json();
      setActions(responseJson.actions);
      setLocations(responseJson.locations);
    } catch (error) {
      console.error('Error fetching presets:', error);
    }
  };

  const showDeleteDialog = (scriptName) => {
    setScriptToDelete(scriptName);
    setDeleteDialogVisible(true);
  };

  const hideDeleteDialog = () => {
    setDeleteDialogVisible(false);
    setScriptToDelete(null);
  };

  const confirmDeleteScript = async () => {
    hideDeleteDialog();
    if (scriptToDelete) {
      await handleDeleteScript(scriptToDelete);
    }
  };

  const getLanguage = () => {
    const language = i18n.language;
    switch (language) {
      case 'zh':
        return 'Simplified Chinese';
      case 'zh-TW':
        return 'Traditional Chinese';
      case 'ja':
        return 'Japanese';
      case 'en':
      default:
        return 'English';
    }
  };

  const generateScript = async () => {
    if (!scriptName) {
      setSnackbarMessage(t('enterScriptName'));
      setSnackbarVisible(true);
      return;
    }
    setIsSending(true);
    try {
      const language = getLanguage();
      const response = await fetchWithToken(`http://${serverHost}:${serverPort}/generate_script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt, language: language, name: scriptName }),
      });

      if (!response.ok) {
        throw new Error(t('errorGeneratingScript'));
      }

      const responseJson = await response.json();
      setScripts([responseJson.script, ...scripts]);
      setFilteredScripts([responseJson.script, ...scripts]);
      setCurrentScript(responseJson);
    } catch (error) {
      console.error("Error in generateScript:", error);
      setSnackbarMessage(error.message);
      setSnackbarVisible(true);
    } finally {
      setIsSending(false);
    }
  };

  const createManualScript = () => {
    if (!scriptName) {
      setSnackbarMessage(t('enterScriptName'));
      setSnackbarVisible(true);
      return;
    }

    const newScript = {
      script_name: scriptName,
      prompt: '',
      script: {
        scenes: [
          {
            scene_index: 1,
            location: '',
            characters: [
              { identity: '', action: '', words: '', enter: '', time: '', exit: '' }
            ]
          }
        ]
      }
    };

    setScripts([newScript, ...scripts]);
    setFilteredScripts([newScript, ...scripts]);
    setCurrentScript(newScript);
    setIsScriptCardVisible(false);
    setScriptName('');
    setPrompt('');
  };

  const handleSaveScript = async () => {
    if (!currentScript) return;

    const isValid = validateScript(currentScript.script);
    if (!isValid) {
      setSnackbarMessage(t('pleaseFillAllFields'));
      setSnackbarVisible(true);
      return;
    }

    try {
      await fetchWithToken(`http://${serverHost}:${serverPort}/update_script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script_name: currentScript.script_name,
          script: currentScript.script,
        }),
      });
      setSnackbarMessage(t('scriptSavedSuccessfully'));
      setSnackbarVisible(true);
      fetchAllScripts();
      setEditMode(false);
    } catch (error) {
      console.error('Error saving script:', error);
      setSnackbarMessage(t('errorSavingScript'));
      setSnackbarVisible(true);
    }
  };

  const validateScript = (script) => {
    for (const scene of script.scenes) {
      if (!scene.location || !scene.scene_index || isNaN(scene.scene_index) || scene.scene_index <= 0) {
        return false;
      }
      for (const character of scene.characters) {
        if (!character.identity || !character.action || !character.words || !character.enter || !character.time || !character.exit) {
          return false;
        }
        if (!isValidTimeFormat(character.enter) || !isValidTimeFormat(character.time) || !isValidTimeFormat(character.exit)) {
          return false;
        }
      }
    }
    return true;
  };

  const isValidTimeFormat = (time) => {
    const regex = /^([0-5][0-9]):([0-5][0-9])$/;
    return regex.test(time);
  };

  const handleGenerateVideo = async () => {
    setIsSending(true);
    setSnackbarMessage(t('videoGenerating'));
    setSnackbarVisible(true);

    try {
      const response = await fetchWithToken(`http://${serverHost}:${serverPort}/create_video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: currentScript.script,
        }),
      });

      if (response.status !== 200) {
        throw new Error(t('errorGeneratingVideo'));
      }

      const videoPath = await saveVideoBlob(response);
      addVideo(videoPath);
    } catch (error) {
      console.error('Error generating video:', error);
      setSnackbarMessage(t('errorGeneratingVideo'));
      setSnackbarVisible(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteScript = async (scriptName) => {
    try {
      await fetchWithToken(`http://${serverHost}:${serverPort}/delete_script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script_name: scriptName,
        }),
      });
      setSnackbarMessage(t('scriptDeletedSuccessfully'));
      setSnackbarVisible(true);
      fetchAllScripts();
    } catch (error) {
      console.error('Error deleting script:', error);
      setSnackbarMessage(t('errorDeletingScript'));
      setSnackbarVisible(true);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = scripts.filter(script => script.script_name.toLowerCase().includes(query.toLowerCase()));
    setFilteredScripts(filtered);
    setCurrentPage(1);
  };

  const paginateScripts = () => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    setPaginatedScripts(filteredScripts.slice(startIndex, endIndex));
  };

  const handleLoadMore = () => {
    if ((currentPage * PAGE_SIZE) < filteredScripts.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const toggleScriptCardVisibility = () => {
    setIsScriptCardVisible(!isScriptCardVisible);
  };

  const cardOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const cardTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const handleSceneChange = (value, sceneIndex, field) => {
    const newScenes = [...currentScript.script.scenes];
    newScenes.find((scene) => scene.scene_index === sceneIndex)[field] = value;
    setCurrentScript(prevScript => ({
      ...prevScript,
      script: {
        ...prevScript.script,
        scenes: newScenes,
      },
    }));
  };

  const handleCharacterChange = (value, sceneIndex, characterIndex, field) => {
    const newScenes = [...currentScript.script.scenes];
    newScenes.find((scene) => scene.scene_index === sceneIndex).characters[characterIndex][field] = value;
    setCurrentScript(prevScript => ({
      ...prevScript,
      script: {
        ...prevScript.script,
        scenes: newScenes,
      },
    }));
  };

  const handleAddCharacter = (sceneIndex) => {
    const newCharacter = { identity: '', action: '', words: '', enter: '', time: '', exit: '' };
    const newScenes = [...currentScript.script.scenes];
    newScenes.find((scene) => scene.scene_index === sceneIndex).characters.push(newCharacter);
    setCurrentScript(prevScript => ({
      ...prevScript,
      script: {
        ...prevScript.script,
        scenes: newScenes,
      },
    }));
  };

  const handleRemoveCharacter = (sceneIndex, characterIndex) => {
    const newScenes = [...currentScript.script.scenes];
    if (newScenes.find((scene) => scene.scene_index === sceneIndex).characters.length > 1) {
      newScenes.find((scene) => scene.scene_index === sceneIndex).characters.splice(characterIndex, 1);
      setCurrentScript(prevScript => ({
        ...prevScript,
        script: {
          ...prevScript.script,
          scenes: newScenes,
        },
      }));
    }
  };

  const handleAddScene = () => {
    const newScene = { scene_index: currentScript.script.scenes.length + 1, location: '', characters: [{ identity: '', action: '', words: '', enter: '', time: '', exit: '' }] };
    const newScenes = [...currentScript.script.scenes];
    newScenes.push(newScene);
    setCurrentScript(prevScript => ({
      ...prevScript,
      script: {
        ...prevScript.script,
        scenes: newScenes,
      },
    }));
  };

  const handleRemoveScene = (sceneIndex) => {
    const newScenes = currentScript.script.scenes.filter(scene => scene.scene_index !== sceneIndex);
    if (newScenes.length < currentScript.script.scenes.length) {
      setCurrentScript(prevScript => ({
        ...prevScript,
        script: {
          ...prevScript.script,
          scenes: newScenes,
        },
      }));
    }
  };

  const renderScriptCard = useCallback(
    ({ item }) => (
      <Card style={styles.scriptCard}>
        <Card.Content>
          <Text style={styles.titleText}>{item.script_name}</Text>
          <Text style={styles.messageText}>{item.prompt}</Text>
          {currentScript && editMode && currentScript.script_name === item.script_name ? (
            <ScrollView style={styles.scrollView}>
              {currentScript.script.scenes.map((scene) => (
                <View key={scene.scene_index} style={styles.sceneContainer}>
                  {scene.scene_index > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveScene(scene.scene_index)}
                    >
                      <IconButton icon="close" size={20} />
                    </TouchableOpacity>
                  )}
                  <TextInput
                    style={styles.input}
                    label={t('Scene Index')}
                    value={String(scene.scene_index)}
                    editable={false}
                  />
                  <DropDownPicker
                    searchable
                    listMode="MODAL"
                    searchPlaceholder={t('location')}
                    open={locationOpen}
                    value={scene.location}
                    showTickIcon={false}
                    items={locationItems}
                    setOpen={setLocationOpen}
                    onSelectItem={(item) => handleSceneChange(item.value, scene.scene_index, 'location')}
                    setItems={setLocationItems}
                    placeholder={t('location')}
                    containerStyle={styles.pickerContainer}
                    textStyle={styles.pickerInput}
                  />
                  {scene.characters.map((character, characterIndex) => (
                    <View key={characterIndex} style={styles.characterContainer}>
                      {characterIndex > 0 && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveCharacter(scene.scene_index, characterIndex)}
                        >
                          <IconButton icon="close" size={20} />
                        </TouchableOpacity>
                      )}
                      <TextInput
                        style={styles.input}
                        label={t('Identity')}
                        value={character.identity}
                        onChangeText={(value) => handleCharacterChange(value, scene.scene_index, characterIndex, 'identity')}
                      />
                      <DropDownPicker
                        searchable
                        listMode="MODAL"
                        searchPlaceholder={t('action')}
                        open={actionOpen}
                        value={character.action}
                        items={actionItems}
                        showTickIcon={false}
                        setOpen={setActionOpen}
                        onSelectItem={(item) => handleCharacterChange(item.value, scene.scene_index, characterIndex, 'action')}
                        setItems={setActionItems}
                        placeholder={t('action')}
                        containerStyle={styles.pickerContainer}
                        textStyle={styles.pickerInput}
                      />
                      <TextInput
                        style={styles.input}
                        label={t('Words')}
                        value={character.words}
                        onChangeText={(value) => handleCharacterChange(value, scene.scene_index, characterIndex, 'words')}
                      />
                      <TextInput
                        style={styles.input}
                        label={t('Enter Time')}
                        value={character.enter}
                        onChangeText={(value) => handleCharacterChange(value, scene.scene_index, characterIndex, 'enter')}
                      />
                      <TextInput
                        style={styles.input}
                        label={t('Time')}
                        value={character.time}
                        onChangeText={(value) => handleCharacterChange(value, scene.scene_index, characterIndex, 'time')}
                      />
                      <TextInput
                        style={styles.input}
                        label={t('Exit Time')}
                        value={character.exit}
                        onChangeText={(value) => handleCharacterChange(value, scene.scene_index, characterIndex, 'exit')}
                      />
                    </View>
                  ))}
                  <Button icon="plus" onPress={() => handleAddCharacter(scene.scene_index)}>{t('addCharacter')}</Button>
                </View>
              ))}
              <Button style={{ marginBottom: 5 }} icon="plus" onPress={() => handleAddScene()}>{t('addScene')}</Button>
              <Button style={{ marginBottom: 5 }} mode='outlined' onPress={handleSaveScript}>{t('saveScript')}</Button>
            </ScrollView>
          ) : (
            <>
              <Button mode='outlined' onPress={async () => { await setCurrentScript(item); setEditMode(true); }} style={styles.button}>{t('editScript')}</Button>
              <Button mode='outlined' onPress={() => showDeleteDialog(item.script_name)} style={styles.button}>{t('deleteScript')}</Button>
              <Button mode='outlined' onPress={async () => { await setCurrentScript(item); handleGenerateVideo(); }} disabled={isSending}>{t('generateVideo')}</Button>
            </>
          )}
        </Card.Content>
      </Card>
    ),
    [currentScript, editMode, isSending, locationItems, actionItems, locationOpen, actionOpen]
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t('searchScripts')}
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchbar}
      />
      <FlatList
        data={paginatedScripts}
        renderItem={renderScriptCard}
        keyExtractor={(item, index) => index.toString()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />

      {isScriptCardVisible && (
        <Animated.View style={[styles.animatedCard, { opacity: cardOpacity }]}>
          <Card.Content>
            <TextInput
              label={t('enterScriptName')}
              value={scriptName}
              onChangeText={setScriptName}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label={t('enterVideoPrompt')}
              value={prompt}
              onChangeText={setPrompt}
              style={styles.input}
              mode="outlined"
            />
            <Button mode="contained" onPress={generateScript} style={styles.button} disabled={isSending}>
              {t('generateScript')}
            </Button>
            <Button mode="contained" onPress={createManualScript} style={styles.button} disabled={isSending}>
              {t('createManualScript')}
            </Button>
          </Card.Content>
        </Animated.View>
      )}

      <FAB
        style={styles.fab}
        small
        icon={isScriptCardVisible ? "minus" : "plus"}
        onPress={toggleScriptCardVisibility}
      />

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={hideDeleteDialog}>
          <Dialog.Title>{t('confirmDelete')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('areYouSureDelete')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDeleteDialog}>{t('cancel')}</Button>
            <Button onPress={confirmDeleteScript}>{t('delete')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    marginBottom: 16,
  },
  animatedCard: {
    marginBottom: 16,
    paddingTop: 32, // Adjust this value as needed
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 6,
  },
  card: {
    marginBottom: 16,
  },
  scriptCard: {
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18,
  },
  messageText: {
    fontSize: 16,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  pickerContainer: {
    marginBottom: 16,
    maxHeight: 200
  },
  pickerInput: {
    fontSize: 16,
  },
  scrollView: {},
  removeButton: {
  },
});

export default ScriptScreen;