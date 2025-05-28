import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { marked } from 'marked';
import { loader } from '@monaco-editor/react';

// Configure Monaco Editor loader
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.36.1/min/vs'
  }
});

// Get the base API URL
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const url = `http://${hostname}:8080`;
  console.log('API Base URL:', url);
  console.log('Note: If using a phone, make sure the hostname matches your computer\'s IP address');
  return url;
};

// Function to check if the server is available
const checkServerAvailability = async (apiBaseUrl: string) => {
  try {
    console.log('Checking server availability at:', apiBaseUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${apiBaseUrl}/api/get?filename=test.md`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    console.log('Server check response:', response.status);
    return response.ok || response.status === 404;
  } catch (error: any) {
    console.error('Server availability check failed:', {
      error: error.message,
      type: error.name,
      url: apiBaseUrl
    });
    return false;
  }
};

// Custom hook for handling resize observer
const useResizeObserver = (callback: () => void) => {
  const element = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (!element.current) return;

    let frameId: number;
    let isResizing = false;

    const resizeObserver = new ResizeObserver(() => {
      if (!isResizing) {
        isResizing = true;
        frameId = requestAnimationFrame(() => {
          callback();
          isResizing = false;
        });
      }
    });

    resizeObserver.observe(element.current);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [callback]);

  return element;
};

interface MarkdownEditorProps {
  initialContent?: string;
  filename?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ initialContent = '', filename = 'untitled.md' }) => {
  const [content, setContent] = useState(initialContent);
  const [currentFilename, setCurrentFilename] = useState(filename);
  const [preview, setPreview] = useState('');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(true);
  const editorRef = useRef<any>(null);
  const apiBaseUrl = getApiBaseUrl();

  // Check server availability on component mount
  useEffect(() => {
    const checkServer = async () => {
      const isAvailable = await checkServerAvailability(apiBaseUrl);
      setServerAvailable(isAvailable);
      if (!isAvailable) {
        const message = `Unable to connect to the server at ${apiBaseUrl}.\n\n` +
          'Please check:\n' +
          '1. The backend server is running\n' +
          '2. You are connected to the same network as the server\n' +
          '3. You are using the correct IP address\n\n' +
          'If accessing from a phone:\n' +
          '- Use your computer\'s IP address instead of "localhost"\n' +
          '- Make sure your computer\'s firewall allows incoming connections\n' +
          '- Both devices should be on the same network';
        alert(message);
      }
    };
    checkServer();
  }, [apiBaseUrl]);

  const handleEditorResize = useCallback(() => {
    if (editorRef.current) {
      requestAnimationFrame(() => {
        editorRef.current.layout();
      });
    }
  }, []);

  const containerRef = useResizeObserver(handleEditorResize);

  useEffect(() => {
    const html = marked.parse(content) as string;
    setPreview(html);
  }, [content]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
    }
  };

  const handleEditorDidMount = (editor: any) => {
    setIsEditorReady(true);
    editorRef.current = editor;
    handleEditorResize();
  };

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme('customTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
      }
    });
  };

  const handleSave = async () => {
    if (!serverAvailable) {
      alert('Cannot save: Server is not accessible. Please check your connection and ensure the backend server is running.');
      return;
    }

    try {
      console.log('Save attempt details:');
      console.log('- File name:', currentFilename);
      console.log('- API endpoint:', `${apiBaseUrl}/api/save`);
      console.log('- Content length:', content.length);
      
      if (!currentFilename.trim()) {
        throw new Error('Please enter a filename before saving');
      }

      const saveData = {
        content,
        filename: currentFilename,
      };
      
      console.log('Request payload:', saveData);

      const response = await fetch(`${apiBaseUrl}/api/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      console.log('Save response status:', response.status);
      console.log('Save response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server responded with status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Save success:', result);
      alert('File saved successfully!');
    } catch (error: any) {
      console.error('Save operation failed:', {
        error: error.message,
        stack: error.stack,
        type: error.name
      });
      
      let errorMessage = 'Error saving file:\n\n';
      if (error.name === 'TypeError') {
        errorMessage += 'Network error - Please check:\n';
        errorMessage += '1. Backend server is running\n';
        errorMessage += '2. You are connected to the correct network\n';
        errorMessage += '3. The server IP address is correct\n';
        errorMessage += '\nTechnical details: ' + error.message;
      } else {
        errorMessage += error.message || 'Unknown error occurred';
      }
      
      alert(errorMessage + '\n\nCheck browser console for more details.');
    }
  };

  const handleLoad = async () => {
    if (!serverAvailable) {
      alert('Cannot load: Server is not accessible. Please check your connection and ensure the backend server is running.');
      return;
    }

    try {
      console.log('Load attempt details:');
      console.log('- File name:', currentFilename);
      console.log('- API endpoint:', `${apiBaseUrl}/api/get?filename=${currentFilename}`);

      if (!currentFilename.trim()) {
        throw new Error('Please enter a filename to load');
      }

      const response = await fetch(`${apiBaseUrl}/api/get?filename=${currentFilename}`);
      
      console.log('Load response status:', response.status);
      console.log('Load response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Load success:', data);
      setContent(data.content);
    } catch (error: any) {
      console.error('Load operation failed:', {
        error: error.message,
        stack: error.stack,
        type: error.name
      });
      
      let errorMessage = 'Error loading file:\n\n';
      if (error.name === 'TypeError') {
        errorMessage += 'Network error - Please check:\n';
        errorMessage += '1. Backend server is running\n';
        errorMessage += '2. You are connected to the correct network\n';
        errorMessage += '3. The server IP address is correct\n';
        errorMessage += '\nTechnical details: ' + error.message;
      } else {
        errorMessage += error.message || 'Unknown error occurred';
      }
      
      alert(errorMessage + '\n\nCheck browser console for more details.');
    }
  };

  return (
    <div style={{ padding: '10px' }} ref={containerRef}>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={currentFilename}
          onChange={(e) => setCurrentFilename(e.target.value)}
          style={{ marginRight: '10px' }}
          placeholder="filename.md"
        />
        <button onClick={handleSave} style={{ marginRight: '10px' }}>Save</button>
        <button onClick={handleLoad}>Load</button>
      </div>
      <div className="editor-container">
        <div style={{ 
          border: '1px solid #ccc', 
          position: 'relative',
          height: '70vh',
          maxHeight: '70vh',
          overflow: 'hidden'
        }}>
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={content}
            onChange={handleEditorChange}
            theme="customTheme"
            beforeMount={handleEditorWillMount}
            onMount={handleEditorDidMount}
            loading={<div style={{ color: '#fff', padding: '10px' }}>Loading editor...</div>}
            options={{
              minimap: {
                enabled: false
              },
              fontSize: 14,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: false,
              fixedOverflowWidgets: true,
              lineNumbers: 'off',
              folding: false,
              glyphMargin: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              renderValidationDecorations: 'off',
              renderWhitespace: 'none',
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
                alwaysConsumeMouseWheel: false
              },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              renderFinalNewline: 'off',
              renderLineHighlight: 'none',
              contextmenu: false,
              smoothScrolling: true,
              mouseWheelScrollSensitivity: 1
            }}
          />
        </div>
        <div 
          className="preview-container"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </div>
    </div>
  );
};

export default MarkdownEditor; 