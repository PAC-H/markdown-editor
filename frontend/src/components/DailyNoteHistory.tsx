import React from 'react';
import { DailyNote } from '../types/dailyNotes';
import { formatDate, formatDateShort, getRelativeDate, isToday } from '../utils/dateUtils';
import './DailyNoteHistory.css';

interface DailyNoteHistoryProps {
  notes: DailyNote[];
  currentNote: DailyNote | null;
  onSelectNote: (note: DailyNote) => void;
  loading: boolean;
}

const DailyNoteHistory: React.FC<DailyNoteHistoryProps> = ({
  notes,
  currentNote,
  onSelectNote,
  loading
}) => {
  if (loading) {
    return (
      <div className="daily-note-history">
        <div className="daily-note-history-header">
          <h3>History</h3>
        </div>
        <div className="daily-note-history-loading">
          <div className="loading-spinner"></div>
          <span>Loading notes...</span>
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="daily-note-history">
        <div className="daily-note-history-header">
          <h3>History</h3>
        </div>
        <div className="daily-note-history-empty">
          <p>No daily notes yet. Create your first note!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-note-history">
      <div className="daily-note-history-header">
        <h3>History</h3>
        <span className="daily-note-count">{notes.length} notes</span>
      </div>
      
      <div className="daily-note-history-list">
        {notes.map((note) => (
          <div
            key={note.date}
            className={`daily-note-history-item ${
              currentNote?.date === note.date ? 'active' : ''
            }`}
            onClick={() => onSelectNote(note)}
          >
            <div className="daily-note-history-item-header">
              <div className="daily-note-date-info">
                <span className="daily-note-date-short">
                  {isToday(note.date) ? 'Today' : formatDateShort(note.date)}
                </span>
                <span className="daily-note-date-relative">
                  {getRelativeDate(note.date)}
                </span>
              </div>
              <div className="daily-note-entry-count">
                {note.entries.length} {note.entries.length === 1 ? 'entry' : 'entries'}
              </div>
            </div>
            
            <div className="daily-note-date-full">
              {formatDate(note.date)}
            </div>
            
            {note.entries.length > 0 && (
              <div className="daily-note-preview">
                <div className="daily-note-latest-entry">
                  <span className="entry-time">{note.entries[note.entries.length - 1].time}</span>
                  <span className="entry-content">
                    {note.entries[note.entries.length - 1].content.length > 80
                      ? `${note.entries[note.entries.length - 1].content.substring(0, 80)}...`
                      : note.entries[note.entries.length - 1].content
                    }
                  </span>
                </div>
                
                {note.entries.length > 1 && (
                  <div className="daily-note-more-entries">
                    +{note.entries.length - 1} more {note.entries.length - 1 === 1 ? 'entry' : 'entries'}
                  </div>
                )}
              </div>
            )}
            
            {note.entries.length === 0 && (
              <div className="daily-note-empty-preview">
                <span>No entries yet</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyNoteHistory; 