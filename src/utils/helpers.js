/**
 * Format a date string to a more readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // If invalid date
  if (isNaN(date.getTime())) return dateString;
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

/**
 * Truncate text to a specific length
 * @param {string} text - Text to truncate 
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
}; 

/**
 * Convert thread annotations to CSV format
 * @param {Array} threads - Array of thread objects
 * @returns {string} CSV formatted string
 */
export const convertAnnotationsToCSV = (threads) => {
  // Define CSV headers
  const headers = [
    'Thread ID',
    'Thread Title',
    'Annotation Index',
    'Rating',
    'Notes',
    'Tags',
    'Timestamp'
  ];
  
  // Convert threads to CSV rows
  const rows = [];
  
  threads.forEach(thread => {
    // Skip threads without annotations
    if (!thread.annotations || thread.annotations.length === 0) return;
    
    const annotations = Array.isArray(thread.annotations) 
      ? thread.annotations 
      : [thread.annotations];
    
    annotations.forEach((annotation, index) => {
      rows.push([
        thread.id,
        thread.title || `Thread ${thread.id}`,
        index,
        annotation.rating || '',
        // Escape quotes in notes and wrap in quotes to preserve newlines
        annotation.notes ? `"${annotation.notes.replace(/"/g, '""')}"` : '',
        // Join tags with semicolons
        annotation.tags ? annotation.tags.join(';') : '',
        annotation.timestamp || ''
      ]);
    });
  });
  
  // Join headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}; 

/**
 * Safely formats timestamps from various sources including Firestore
 * @param {*} timestamp - Can be string, Date, or Firestore timestamp {seconds, nanoseconds}
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  // Handle Firestore timestamp objects
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    // Convert Firestore timestamp to JS Date
    return formatDate(new Date(timestamp.seconds * 1000));
  }
  
  // Handle regular date objects or strings
  return formatDate(timestamp);
}; 