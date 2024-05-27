import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Button, Card, Text, Searchbar, Dialog, Portal } from 'react-native-paper';
import RNFetchBlob from 'rn-fetch-blob';
import Share from 'react-native-share';
import { VideoContext } from './VideoContext';
import Video from 'react-native-video';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

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
    if (isFocused) {
      setFilteredVideos(videos);
    }
  }, [isFocused, videos]);

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

  const copyVideo = async (videoPath) => {
    const { fs } = RNFetchBlob;
    const destPath = `${fs.dirs.DownloadDir}/${videoPath.split('/').pop()}`;
    try {
      await fs.cp(videoPath, destPath);
      Alert.alert(t('success'), t('videoCopied', { path: destPath }));
    } catch (error) {
      Alert.alert(t('error'), t('failedToCopyVideo'));
    }
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

  const handleLoadMore = () => {
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
            <Button mode="contained" onPress={() => showDeleteDialog(item)} style={{ marginRight: 10 }}>
              {t('delete')}
            </Button>
            <Button mode="contained" onPress={() => shareVideo(item)}>
              {t('share')}
            </Button>
          </View>
        </Card.Content>
      </Card>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t('searchVideos')}
        value={searchQuery}
        onChangeText={handleSearch}
        style={styles.searchbar}
      />
      <FlatList
        data={paginatedVideos}
        renderItem={renderVideoCard}
        keyExtractor={(item, index) => index.toString()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
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
});