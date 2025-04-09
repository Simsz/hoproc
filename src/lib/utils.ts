import { Event } from '@/types';

/**
 * Generate a unique ID for events
 * 
 * @returns A random string ID
 */
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  });
}

/**
 * Group events by day
 */
export function groupEventsByDay(events: Event[]): Record<string, Event[]> {
  const groupedEvents: Record<string, Event[]> = {};
  
  events.forEach(event => {
    const date = new Date(event.date);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    
    groupedEvents[dateKey].push(event);
  });
  
  return groupedEvents;
} 