export interface DailyEntry {
  time: string;
  content: string;
}

export interface DailyNote {
  date: string;
  filename: string;
  entries: DailyEntry[];
  uid: string;
}

export interface DailyNoteRequest {
  content: string;
  date?: string; // Optional, defaults to today
}

export interface DailyNoteResponse {
  message: string;
  date: string;
  time: string;
}

export interface DailyNoteListResponse {
  notes: DailyNote[];
}

export interface DailyNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
} 