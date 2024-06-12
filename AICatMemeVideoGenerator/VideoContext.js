// VideoContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'
import RNFetchBlob from 'rn-fetch-blob';

export const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [videos, setVideos] = useState([]);
  const [videoMappings, setVideoMappings] = useState({});

  useEffect(() => {
  
    loadMappings();
    loadVideos();
  }, []);


  const loadMappings = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      const mappings = {};
      stores.forEach(([key, value]) => {
        mappings[key] = value;
      });
      setVideoMappings(mappings);
    } catch (error) {
      console.error('Error loading video mappings:', error);
    }
  };

  const loadVideos = async () => {
    const { fs } = RNFetchBlob;
    const videoDir = fs.dirs.DocumentDir;
    const files = await fs.ls(videoDir);
    const videoFiles = files.filter(file => file.endsWith('.mp4'));
    setVideos(videoFiles.map(file => `${videoDir}/${file}`));
  };

  const addVideo = async (videoPath) => {
    setVideos(prevVideos => [...prevVideos, videoPath]);
    loadVideos();
  };

  const deleteVideo = async (videoPath) => {
    const { fs } = RNFetchBlob;
    await fs.unlink(videoPath);
    loadVideos();
  };

  return (
    <VideoContext.Provider value={{ videos, addVideo, deleteVideo, loadVideos, videoMappings }}>
      {children}
    </VideoContext.Provider>
  );
};