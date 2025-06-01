import { useState, useEffect, useCallback } from 'react';
import { DailyNote, DailyNoteRequest, DailyNoteResponse, DailyNoteListResponse } from '../types/dailyNotes';
import { getCurrentDate } from '../utils/dateUtils';

const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:8080`;
};

export const useDailyNotes = () => {
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  const [currentNote, setCurrentNote] = useState<DailyNote | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = getApiBaseUrl();

  // Fetch all daily notes
  const fetchDailyNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/daily/list`);
      if (!response.ok) {
        throw new Error(`Failed to fetch daily notes: ${response.status}`);
      }
      const data: DailyNoteListResponse = await response.json();
      setDailyNotes(data.notes);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching daily notes:', err);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  // Fetch specific daily note
  const fetchDailyNote = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/daily/get?date=${date}`);
      if (!response.ok) {
        if (response.status === 404) {
          // Note doesn't exist yet, return empty note structure
          const emptyNote: DailyNote = {
            date,
            filename: `${date}.md`,
            entries: [],
            uid: ''
          };
          setCurrentNote(emptyNote);
          return emptyNote;
        }
        throw new Error(`Failed to fetch daily note: ${response.status}`);
      }
      const note: DailyNote = await response.json();
      setCurrentNote(note);
      return note;
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching daily note:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  // Create new daily note entry
  const createDailyEntry = useCallback(async (content: string, date?: string) => {
    setLoading(true);
    setError(null);
    try {
      const requestData: DailyNoteRequest = {
        content,
        date: date || getCurrentDate()
      };

      const response = await fetch(`${apiBaseUrl}/api/daily/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create daily entry: ${response.status}`);
      }

      const result: DailyNoteResponse = await response.json();
      
      // Refresh the notes list and current note
      await fetchDailyNotes();
      if (currentNote && currentNote.date === result.date) {
        await fetchDailyNote(result.date);
      }

      return result;
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating daily entry:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, currentNote, fetchDailyNotes, fetchDailyNote]);

  // Get today's note
  const getTodaysNote = useCallback(async () => {
    const today = getCurrentDate();
    return await fetchDailyNote(today);
  }, [fetchDailyNote]);

  // Load initial data
  useEffect(() => {
    fetchDailyNotes();
  }, [fetchDailyNotes]);

  return {
    dailyNotes,
    currentNote,
    loading,
    error,
    fetchDailyNotes,
    fetchDailyNote,
    createDailyEntry,
    getTodaysNote,
    setCurrentNote,
    setError
  };
}; 