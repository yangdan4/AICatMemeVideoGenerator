import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Modal, Image, Video } from 'react-native';
import { Searchbar, Button, List, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 5;

const SearchModal = ({ visible, onClose, assets, onSelectAsset, placeholder }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredAssets, setFilteredAssets] = useState([]);

  useEffect(() => {
    console.log(assets)
    handleSearch('');
  }, [assets]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = assets.filter(asset => asset.name.toLowerCase().includes(query.toLowerCase()));
    setFilteredAssets(filtered);
    setCurrentPage(1);
  };

  const paginatedAssets = filteredAssets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if ((currentPage * PAGE_SIZE) < filteredAssets.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide">
      <View style={styles.modalContainer}>
        <Searchbar
          placeholder={placeholder}
          onChangeText={handleSearch}
          value={searchQuery}
        />
        <FlatList
          data={paginatedAssets}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <List.Item
              title={item.name}
              description={item.path}
              onPress={() => {
                onSelectAsset(item);
                onClose();
              }}
              left={props => item.type === 'image' ? (
                <Image source={{ uri: `file://${item.path}` }} style={styles.assetThumbnail} />
              ) : (
                <Video source={{ uri: `file://${item.path}` }} style={styles.assetThumbnail} />
              )}
            />
          )}
        />
        <View style={styles.paginationContainer}>
          <Button onPress={handlePrevPage} disabled={currentPage === 1}>{t('prevPage')}</Button>
          <Text>{`${t('page')} ${currentPage}`}</Text>
          <Button onPress={handleNextPage} disabled={(currentPage * PAGE_SIZE) >= filteredAssets.length}>{t('nextPage')}</Button>
        </View>
        <Button onPress={onClose}>{t('close')}</Button>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  assetThumbnail: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
});

export default SearchModal;