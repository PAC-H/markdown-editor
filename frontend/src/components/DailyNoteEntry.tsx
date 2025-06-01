import React from 'react';
import { DailyEntry } from '../types/dailyNotes';
import './DailyNoteEntry.css';

interface DailyNoteEntryProps {
  entry: DailyEntry;
  isLatest?: boolean;
}

const DailyNoteEntry: React.FC<DailyNoteEntryProps> = ({ entry, isLatest = false }) => {
  return (
    <div className={`daily-note-entry ${isLatest ? 'latest' : ''}`}>
      <div className="entry-time-marker">
        <span className="entry-time">{entry.time}</span>
        <div className="entry-line"></div>
      </div>
      
      <div className="entry-content-wrapper">
        <div className="entry-content">
          {entry.content}
        </div>
        {isLatest && (
          <div className="entry-latest-indicator">
            <span>Latest</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyNoteEntry; 