import React, { useState } from 'react';
import './App.css';
import MarkdownEditor from './components/MarkdownEditor';
import DailyNoteCreator from './components/DailyNoteCreator';

function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'daily'>('daily');

  return (
    <div className="App">
      <header className="App-header">
        <h1>Markdown Editor</h1>
        <div className="app-tabs">
          <button
            className={`app-tab ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            📝 Daily Notes
          </button>
          <button
            className={`app-tab ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            📄 Markdown Editor
          </button>
        </div>
      </header>
      <main>
        {activeTab === 'daily' ? (
          <DailyNoteCreator />
        ) : (
          <MarkdownEditor />
        )}
      </main>
    </div>
  );
}

export default App;
