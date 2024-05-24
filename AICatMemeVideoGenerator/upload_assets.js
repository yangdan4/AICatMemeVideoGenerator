const fs = require('fs').promises;
const path = require('path');
const { put } = require('@vercel/blob');

const uploadDirectory = async (directoryPath) => {
    try {
        const files = await fs.readdir(directoryPath);
        
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const fileContent = await fs.readFile(filePath);
            
            const { url } = await put(`assets/${file}`, fileContent, { access: 'public' });
            console.log(`Uploaded ${file} to ${url}`);
        }
    } catch (error) {
        console.error('Error uploading files:', error);
    }
};

uploadDirectory('../assets');