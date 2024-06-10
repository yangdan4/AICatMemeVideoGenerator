// VideoContext.js
import React, { createContext, useState, useEffect } from 'react';
import RNFetchBlob from 'rn-fetch-blob';

export const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    loadVideos();
  }, []);

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
    <VideoContext.Provider value={{ videos, addVideo, deleteVideo, loadVideos }}>
      {children}
    </VideoContext.Provider>
  );
};