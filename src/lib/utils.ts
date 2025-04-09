/**
 * Generates a unique ID for events
 */
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Groups events by day (based on date property)
 */
export function groupEventsByDay(events: any[]): Record<string, any[]> {
  return events.reduce((grouped, event) => {
    const date = new Date(event.date);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!grouped[dateStr]) {
      grouped[dateStr] = [];
    }
    
    grouped[dateStr].push(event);
    return grouped;
  }, {} as Record<string, any[]>);
}

/**
 * Formats a date to a human-readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
} 