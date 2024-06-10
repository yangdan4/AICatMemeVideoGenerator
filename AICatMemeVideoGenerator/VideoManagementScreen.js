import React, { useRef, useContext, useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, ImageBackground } from 'react-native';
import { Button, Card, Text, Searchbar, Dialog, Portal } from 'react-native-paper';
import Share from 'react-native-share';
import { VideoContext } from './VideoContext';
import Video from 'react-native-video';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import catBackground from './cat_background.jpg';

const PAGE_SIZE = 5;

export default function VideoManagementScreen() {

  
  const { t } = useTranslation();
  const { videos, deleteVideo } = useContext(VideoContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedVideos, setPaginatedVideos] = useState([]);
  const isFocused = useIsFocused();
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  useEffect(() => {
    setFilteredVideos(videos);
  }, [videos]);

  useEffect(() => {
    paginateVideos();
  }, [filteredVideos, currentPage]);

  const paginateVideos = () => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    setPaginatedVideos(filteredVideos.slice(startIndex, endIndex));
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = videos.filter((video) => 
      video.split('/').pop().toLowerCase().includes(query.toLowerCase())
    );
    setFilteredVideos(filtered);
    setCurrentPage(1);
  };

  const shareVideo = async (videoPath) => {
    try {
      await Share.open({
        url: `file://${videoPath}`,
        title: t('shareVideo'),
      });
    } catch (error) {
      // Alert.alert(t('error'), t('failedToShareVideo'));
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if ((currentPage * PAGE_SIZE) < filteredVideos.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const showDeleteDialog = (videoPath) => {
    setVideoToDelete(videoPath);
    setDeleteDialogVisible(true);
  };

  const hideDeleteDialog = () => {
    setDeleteDialogVisible(false);
    setVideoToDelete(null);
  };

  const confirmDeleteVideo = async () => {
    hideDeleteDialog();
    if (videoToDelete) {
      deleteVideo(videoToDelete);
    }
  };

  const renderVideoCard = useCallback(
    ({ item }) => (
      <Card style={styles.card}>
        <Card.Content>
          <Text>{item.split('/').pop()}</Text>
          <Video
            source={{ uri: `file://${item}` }}
            style={styles.video}
            controls={true}
            paused={true}
          />
          <View style={styles.buttonGroup}>
            <Button onPress={() => showDeleteDialog(item)} style={{ marginRight: 10 }}>
              {t('delete')}
            </Button>
            <Button  onPress={() => shareVideo(item)}>
              {t('share')}
            </Button>
          </View>
        </Card.Content>
      </Card>
    ),
    []
  );

  return (
    <ImageBackground source={catBackground} style={styles.backgroundImage}>
    <View style={styles.container}>
      <Searchbar
        placeholder={t('searchVideos')}
        value={searchQuery}
        onChangeText={handleSearch}
        style={styles.searchbar}
      />
      <FlatList
        key={isFocused}
        data={paginatedVideos}
        renderItem={renderVideoCard}
        keyExtractor={(item, index) => index.toString()}
      />

      <View style={styles.paginationContainer}>
        <Button onPress={handlePrevPage} disabled={currentPage === 1}>{t('prevPage')}</Button>
        <Text>{`${t('page')} ${currentPage}`}</Text>
        <Button onPress={handleNextPage} disabled={(currentPage * PAGE_SIZE) >= filteredVideos.length}>{t('nextPage')}</Button>
      </View>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={hideDeleteDialog}>
          <Dialog.Title>{t('confirmDelete')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('areYouSureDelete')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDeleteDialog}>{t('cancel')}</Button>
            <Button onPress={confirmDeleteVideo}>{t('delete')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
      </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchbar: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  video: {
    width: '100%',
    height: 200,
    marginTop: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'stretch',
    justifyContent: 'center',
  },
});