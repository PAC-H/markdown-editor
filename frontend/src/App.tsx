import React from 'react';
import './App.css';
import MarkdownEditor from './components/MarkdownEditor';

function App() {
  return (
    <div className="App">
      <header className="App-header" style={{ padding: '20px' }}>
        <h1>Markdown Editor</h1>
      </header>
      <main>
        <MarkdownEditor />
      </main>
    </div>
  );
}

export default App;
