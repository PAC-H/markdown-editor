import React, { useState, useEffect } from 'react';
import { useDailyNotes } from '../hooks/useDailyNotes';
import DailyNoteModal from './DailyNoteModal';
import DailyNoteHistory from './DailyNoteHistory';
import DailyNoteEntry from './DailyNoteEntry';
import { getCurrentDate, isToday } from '../utils/dateUtils';
import './DailyNoteCreator.css';

const DailyNoteCreator: React.FC = () => {
  const {
    dailyNotes,
    currentNote,
    loading,
    error,
    createDailyEntry,
    fetchDailyNote,
    getTodaysNote,
    setCurrentNote,
    setError
  } = useDailyNotes();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<'today' | 'history'>('today');

  // Load today's note on component mount
  useEffect(() => {
    getTodaysNote();
  }, [getTodaysNote]);

  const handleCreateNote = async (content: string) => {
    try {
      await createDailyEntry(content);
      setError(null);
    } catch (error) {
      console.error('Failed to create daily note:', error);
    }
  };

  const handleSelectNote = async (note: any) => {
    await fetchDailyNote(note.date);
    setView('today'); // Switch to today view when selecting a note
  };

  const handleTodayClick = async () => {
    await getTodaysNote();
    setView('today');
  };

  const handleQuickNoteKeydown = (e: React.KeyboardEvent) => {
    if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsModalOpen(true);
    }
  };

  // Add global keyboard listener
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, []);

  return (
    <div className="daily-note-creator" onKeyDown={handleQuickNoteKeydown}>
      <div className="daily-note-header">
        <div className="daily-note-title">
          <h2>Daily Notes</h2>
          <span className="daily-note-subtitle">
            Your personal memo manager
          </span>
        </div>
        
        <div className="daily-note-actions">
          <button
            className="quick-note-btn"
            onClick={() => setIsModalOpen(true)}
            title="Create quick note (Ctrl/Cmd + N)"
          >
            <span className="btn-icon">✏️</span>
            Quick Note
          </button>
        </div>
      </div>

      {error && (
        <div className="daily-note-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="daily-note-nav">
        <button
          className={`nav-btn ${view === 'today' ? 'active' : ''}`}
          onClick={handleTodayClick}
        >
          <span className="nav-icon">📅</span>
          Today
          {currentNote && isToday(currentNote.date) && currentNote.entries.length > 0 && (
            <span className="nav-badge">{currentNote.entries.length}</span>
          )}
        </button>
        
        <button
          className={`nav-btn ${view === 'history' ? 'active' : ''}`}
          onClick={() => setView('history')}
        >
          <span className="nav-icon">📚</span>
          History
          {dailyNotes.length > 0 && (
            <span className="nav-badge">{dailyNotes.length}</span>
          )}
        </button>
      </div>

      <div className="daily-note-content">
        {view === 'today' ? (
          <div className="daily-note-today-view">
            {currentNote ? (
              <div className="daily-note-current">
                <div className="daily-note-current-header">
                  <h3>
                    {isToday(currentNote.date) ? 'Today' : currentNote.date}
                  </h3>
                  <span className="entry-count">
                    {currentNote.entries.length} {currentNote.entries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                
                {currentNote.entries.length > 0 ? (
                  <div className="daily-note-entries">
                    {currentNote.entries.map((entry, index) => (
                      <DailyNoteEntry
                        key={`${entry.time}-${index}`}
                        entry={entry}
                        isLatest={index === currentNote.entries.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="daily-note-empty">
                    <div className="empty-state">
                      <span className="empty-icon">📝</span>
                      <h4>No entries yet</h4>
                      <p>Start your day by creating your first note!</p>
                      <button
                        className="create-first-note-btn"
                        onClick={() => setIsModalOpen(true)}
                      >
                        Create First Note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="daily-note-loading">
                <div className="loading-spinner"></div>
                <span>Loading today's notes...</span>
              </div>
            )}
          </div>
        ) : (
          <DailyNoteHistory
            notes={dailyNotes}
            currentNote={currentNote}
            onSelectNote={handleSelectNote}
            loading={loading}
          />
        )}
      </div>

      <DailyNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateNote}
      />
    </div>
  );
};

export default DailyNoteCreator; 