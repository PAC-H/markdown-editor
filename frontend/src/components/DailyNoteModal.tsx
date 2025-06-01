import React, { useState, useEffect, useRef } from 'react';
import { DailyNoteModalProps } from '../types/dailyNotes';
import './DailyNoteModal.css';

const DailyNoteModal: React.FC<DailyNoteModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
      onClose();
    } catch (error) {
      console.error('Error submitting daily note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="daily-note-modal-backdrop" onClick={handleBackdropClick}>
      <div className="daily-note-modal">
        <div className="daily-note-modal-header">
          <h3>Quick Note</h3>
          <button 
            className="daily-note-modal-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="daily-note-modal-form">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind? (Ctrl/Cmd + Enter to save)"
            className="daily-note-modal-textarea"
            rows={4}
            disabled={isSubmitting}
          />
          
          <div className="daily-note-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="daily-note-modal-cancel"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="daily-note-modal-submit"
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
        
        <div className="daily-note-modal-hint">
          <small>💡 Press <kbd>Ctrl/Cmd + Enter</kbd> to save, <kbd>Esc</kbd> to close</small>
        </div>
      </div>
    </div>
  );
};

export default DailyNoteModal; 