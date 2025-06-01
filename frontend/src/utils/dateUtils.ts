export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const getCurrentTime = (): string => {
  const now = new Date();
  return now.toTimeString().slice(0, 5); // HH:mm format
};

export const formatDate = (date: string): string => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });
};

export const formatDateShort = (date: string): string => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
};

export const getRelativeDate = (date: string): string => {
  const today = new Date();
  const targetDate = new Date(date);
  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

export const isToday = (date: string): boolean => {
  return date === getCurrentDate();
};

export const sortDatesByNewest = (dates: string[]): string[] => {
  return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
}; 