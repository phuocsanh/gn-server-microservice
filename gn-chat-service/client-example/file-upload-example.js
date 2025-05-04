/**
 * Example client code for uploading files to the chat service
 */

// Function to upload a single file
async function uploadFile(file, token) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('http://localhost:3000/api/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to upload file');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Function to upload multiple files
async function uploadMultipleFiles(files, token) {
  try {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    
    const response = await fetch('http://localhost:3000/api/files/upload-multiple', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to upload files');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
}

// Function to send a message with attachments
async function sendMessageWithAttachments(conversationId, content, files, token) {
  try {
    const formData = new FormData();
    formData.append('content', content);
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    
    const response = await fetch(`http://localhost:3000/api/chat/conversations/${conversationId}/messages/with-attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send message with attachments');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error sending message with attachments:', error);
    throw error;
  }
}

// Example usage in a web application
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const conversationId = 'your_conversation_id';
  
  // File input change handler
  document.getElementById('fileInput').addEventListener('change', async (event) => {
    const files = event.target.files;
    if (files.length === 0) return;
    
    try {
      // Upload files
      const uploadedFiles = await uploadMultipleFiles(files, token);
      
      // Display uploaded files
      const filePreviewContainer = document.getElementById('filePreview');
      filePreviewContainer.innerHTML = '';
      
      uploadedFiles.forEach(file => {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        
        if (file.fileType === 'image') {
          const img = document.createElement('img');
          img.src = file.url;
          img.alt = file.originalName;
          img.style.maxWidth = '200px';
          fileElement.appendChild(img);
        } else if (file.fileType === 'video') {
          const video = document.createElement('video');
          video.src = file.url;
          video.controls = true;
          video.style.maxWidth = '200px';
          fileElement.appendChild(video);
        } else {
          const icon = document.createElement('div');
          icon.className = 'file-icon';
          icon.textContent = file.fileType.charAt(0).toUpperCase();
          fileElement.appendChild(icon);
        }
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.originalName;
        fileElement.appendChild(fileName);
        
        filePreviewContainer.appendChild(fileElement);
      });
      
      // Store uploaded files for sending
      window.uploadedFiles = uploadedFiles;
      
    } catch (error) {
      alert('Error uploading files: ' + error.message);
    }
  });
  
  // Send message with attachments
  document.getElementById('sendButton').addEventListener('click', async () => {
    const content = document.getElementById('messageInput').value;
    const files = document.getElementById('fileInput').files;
    
    if (!content && files.length === 0) {
      alert('Please enter a message or select files to send');
      return;
    }
    
    try {
      const message = await sendMessageWithAttachments(conversationId, content, files, token);
      
      // Clear input fields
      document.getElementById('messageInput').value = '';
      document.getElementById('fileInput').value = '';
      document.getElementById('filePreview').innerHTML = '';
      
      // Display sent message
      console.log('Message sent:', message);
      
      // You would typically update your UI here to show the sent message
      
    } catch (error) {
      alert('Error sending message: ' + error.message);
    }
  });
});
