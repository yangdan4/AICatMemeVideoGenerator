import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet, ScrollView, Animated, Easing, TouchableOpacity, Modal, ImageBackground, Dimensions, Image } from 'react-native';
import { TextInput, Button, Text, Card, Snackbar, Searchbar, Dialog, Portal, FAB, IconButton, List } from 'react-native-paper';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './AuthContext';
import { VideoContext } from './VideoContext';
import { serverHost, serverPort, actionVideoDict } from './consts';
import { fetchWithToken } from './api';
import RNFetchBlob from 'rn-fetch-blob';
import catBackground from './cat_background.jpg';
const PAGE_SIZE = 3;

const SearchModal = ({ visible, onClose, items, onSelectItem, placeholder, isLocation }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [youtubeVisible, setYoutubeVisible] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [picVisible, setPicVisible] = useState(false);
  const [picUrl, setPicUrl] = useState('');

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  function convertImageFileName(input) {
    // Trim any leading or trailing whitespace
    let trimmedInput = input.trim();
  
    // Check if the input ends with a number
    let match = trimmedInput.match(/(.*?)(\d+)$/);
    
    if (match) {
      // If it ends with a number, format the string and append the number
      let base = match[1].trim().toLowerCase().replace(/\s+/g, '_');
      return `${base}_${match[2]}`;
    } else {
      // If it does not end with a number, format the string and append 1
      let base = trimmedInput.toLowerCase().replace(/\s+/g, '_');
      return `${base}_1`;
    }
  }
  

  const handleViewYoutube = (videoId) => {
    if (videoId) {
      setYoutubeVideoId(videoId);
      setYoutubeVisible(true);
    } else {
      console.error('Invalid YouTube URL');
    }
  };

  const handleViewPic = (url) => {
    if (url) {
      setPicUrl(url);
      setPicVisible(true);
    } else {
      console.error('Invalid Pic URL');
    }
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="fade">
      <View style={styles.modalContainer}>
        <Searchbar
          placeholder={placeholder}
          onChangeText={setSearchQuery}
          value={searchQuery}
        />
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <List.Item
              title={t(item.label)}
              right={() => (
                <Button onPress={() => isLocation ? handleViewPic(`https://min-chi.material.jp/wp-content/uploads/${convertImageFileName(item.label)}.jpg`) : handleViewYoutube(actionVideoDict[item.label])}>
                  {t('view')}
                </Button>
              )}
              onPress={() => {
                onSelectItem(item);
                onClose();
              }}
            />
          )}
        />
        <Button onPress={onClose}>{t('close')}</Button>
      </View>

      <Modal visible={youtubeVisible} onRequestClose={() => setYoutubeVisible(false)} animationType="fade" transparent>
        <View style={styles.youtubeModalOverlay}>
          <View style={styles.youtubeModalContainer}>
            <YoutubePlayer
              height={Dimensions.get('window').height / 3.7}
              width={Dimensions.get('window').width}
              play
              videoId={youtubeVideoId}
              onReady={() => console.log('YouTube video ready')}
            />
            <Button style={{width: '100%'}} onPress={() => setYoutubeVisible(false)}>{t('close')}</Button>
          </View>
        </View>
      </Modal>
      <Modal visible={picVisible} onRequestClose={() => setPicVisible(false)} animationType="fade" transparent>
        <View style={styles.youtubeModalOverlay}>
          <View style={styles.youtubeModalContainer}>
            <Image

              style={styles.image} // Add style to image
              source={{uri: picUrl}}
            />
            <Button style={{width: '100%'}} onPress={() => setPicVisible(false)}>{t('close')}</Button>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const ScriptScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [scriptName, setScriptName] = useState('');
  const [scripts, setScripts] = useState([]);
  const [filteredScripts, setFilteredScripts] = useState([]);
  const [currentScript, setCurrentScript] = useState(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(null);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(null);
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

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);

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
      const language = getLanguage();
      const response = await fetchWithToken(`http://${serverHost}:${serverPort}/get_presets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    setSnackbarMessage(t('scriptGenerating'));
    setSnackbarVisible(true);
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
      setScripts([responseJson, ...scripts]);
      setFilteredScripts([responseJson, ...scripts]);
      setCurrentScript(responseJson);
    } catch (error) {
      console.error("Error in generateScript:", error);
      setSnackbarMessage(error.message);
      setSnackbarVisible(true);
    } finally {
      setSnackbarMessage(t('scriptDone'));
      setSnackbarVisible(true);
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

    const validationMessage = validateScript(currentScript.script);
    if (validationMessage) {
      setSnackbarMessage(validationMessage);
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
        return t('pleaseFillAllFields');
      }
      else if (scene.location && !locations.includes(scene.location)) {
        return t('pleaseValidLocation');
      }
      for (const character of scene.characters) {
        if (!character.identity || !character.action || !character.words || !character.enter || !character.time || !character.exit) {
          return t('pleaseFillAllFields');
        }
        else if (character.action && !actions.includes(character.action)) {
          return t('pleaseValidAction');
        }
        if (!isValidTimeFormat(character.enter) || !isValidTimeFormat(character.time) || !isValidTimeFormat(character.exit)) {
          return t('pleaseValidTime');
        }
      }
    }
    return '';
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
      const language = getLanguage();
      const response = await fetchWithToken(`http://${serverHost}:${serverPort}/create_video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: currentScript.script,
          language: language,
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
      setSnackbarMessage(t('videoDone'));
      setSnackbarVisible(true);
      setIsSending(false);
    }
  };

  const saveVideoBlob = async (response) => {
    const { fs } = RNFetchBlob;
    const videoDir = fs.dirs.DocumentDir;
    const filePath = `${videoDir}/${currentScript.script_name}.mp4`;

    return new Promise((resolve, reject) => {
      response.blob().then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1]; // Extract base64 data
          RNFetchBlob.fs.writeFile(filePath, base64data, 'base64')
            .then(() => resolve(filePath)) // Return the file path
            .catch(reject);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }).catch(reject);
    });
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

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
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
                    label={t('sceneIndex')}
                    value={String(scene.scene_index)}
                    editable={false}
                  />
                  <TouchableOpacity onPress={() => {setLocationModalVisible(true); setCurrentSceneIndex(scene.scene_index); setCurrentCharacterIndex(null);}}>
                    <TextInput
                      style={styles.input}
                      label={ t('location')}
                      value={scene.location && !locations.includes(scene.location) ? `${scene.location} ${t('(Suggested)')}` : scene.location}
                      editable={false}
                    />
                  </TouchableOpacity>
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
                        label={t('identity')}
                        value={character.identity}
                        onChangeText={(value) => handleCharacterChange(value, scene.scene_index, characterIndex, 'identity')}
                      />
                      <TouchableOpacity onPress={() => {setActionModalVisible(true); setCurrentSceneIndex(scene.scene_index); setCurrentCharacterIndex(characterIndex);}}>
                        <TextInput
                          style={styles.input}
                          label={ t('action')}
                          value={character.action && !actions.includes(character.action) ? `${character.action} ${t('(Suggested)')}` : character.action}
                          editable={false}
                        />
                      </TouchableOpacity>
                      <TextInput
                        style={styles.input}
                        label={t('words')}
                        value={character.words}
                        onChangeText={(value) => handleCharacterChange(value, scene.scene_index, characterIndex, 'words')}
                      />
                      <TextInput
                        style={styles.input}
                        label={t('enterTime')}
                        value={character.enter}
                        onChangeText={(value) => handleCharacterChange(value, scene.scene_index, characterIndex, 'enter')}
                      />
                      <TextInput
                        style={styles.input}
                        label={t('time')}
                        value={character.time}
                        onChangeText={(value) => handleCharacterChange(value, scene.scene_index, characterIndex, 'time')}
                      />
                      <TextInput
                        style={styles.input}
                        label={t('exitTime')}
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
    [currentScript, editMode, isSending, locationItems, actionItems]
  );

  const handleRemoveScene = (sceneIndex) => {
    const newScenes = currentScript.script.scenes.filter(scene => scene.scene_index !== sceneIndex);
    if (newScenes.length < currentScript.script.scenes.length){
      setCurrentScript(prevScript => ({
        ...prevScript,
        script: {
          ...prevScript.script,
          scenes: newScenes,
        }}))
      }
    };

  return (
      <ImageBackground source={catBackground} style={styles.backgroundImage}>
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
      />

      <View style={styles.paginationContainer}>
        <Button onPress={handlePrevPage} disabled={currentPage === 1}>{t('prevPage')}</Button>
        <Text>{`${t('page')} ${currentPage}`}</Text>
        <Button onPress={handleNextPage} disabled={(currentPage * PAGE_SIZE) >= filteredScripts.length}>{t('nextPage')}</Button>
      </View>

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
      
      <SearchModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        items={locationItems}
        onSelectItem={(item) => handleSceneChange(item.value, currentSceneIndex, 'location')}
        placeholder={t('searchLocation')}
        isLocation
      />

      <SearchModal
        visible={actionModalVisible}
        onClose={() => setActionModalVisible(false)}
        items={actionItems}
        onSelectItem={(item) => handleCharacterChange(item.value, currentSceneIndex, currentCharacterIndex, 'action')}
        placeholder={t('searchAction')}
        isLocation={false}
      />
      </View>
      </ImageBackground>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
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
    top: 0,
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'stretch',
    justifyContent: 'center',
  },

  youtubeModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  youtubeModalContainer: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height / 3.7,
  },
});

export default ScriptScreen;