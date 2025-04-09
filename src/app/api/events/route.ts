import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllVenues } from '@/scrapers';
import { Event } from '@/types';
import fs from 'fs';
import path from 'path';

// Cache events data to avoid scraping on every request
let cachedEvents: Event[] = [];
let lastFetched = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

// Path to the events data file
const DATA_FOLDER = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_FOLDER, 'events.json');

/**
 * API route that returns events from all venues
 * Events are cached for 1 hour to prevent excessive scraping
 * Supports a ?refresh=true query parameter to force refresh
 */
export async function GET(request: NextRequest) {
  const now = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const forceRefresh = searchParams.get('refresh') === 'true';
  
  // Try to load events from file first if we don't have cached events
  if (cachedEvents.length === 0 && fs.existsSync(EVENTS_FILE)) {
    try {
      console.log(`Attempting to read events from ${EVENTS_FILE}`);
      const fileData = fs.readFileSync(EVENTS_FILE, 'utf8');
      console.log(`Read ${fileData.length} bytes from events file`);
      
      // Check if the file is empty or whitespace only
      if (!fileData || fileData.trim() === '') {
        console.log('Events file exists but is empty, starting with empty array');
        cachedEvents = [];
      } else {
        try {
          const events = JSON.parse(fileData);
          console.log(`Successfully parsed JSON, found ${events.length} events`);
          
          if (Array.isArray(events) && events.length > 0) {
            console.log(`Loaded ${events.length} events from data file`);
            // Log a sample event for debugging
            console.log('Sample event:', JSON.stringify(events[0], null, 2));
            
            cachedEvents = events;
            lastFetched = now;
            
            // If we're not forcing a refresh, return the file data
            if (!forceRefresh) {
              return NextResponse.json(filterPastEvents(cachedEvents));
            }
          } else {
            console.log('Events file contained an empty array or non-array data');
          }
        } catch (parseError) {
          console.error('Error parsing events JSON:', parseError);
          console.log('Starting with empty events array due to parse error');
          // Initialize with an empty array since the file couldn't be parsed
          cachedEvents = [];
          
          // Try to back up the corrupted file
          try {
            const backupPath = `${EVENTS_FILE}.backup.${Date.now()}`;
            fs.copyFileSync(EVENTS_FILE, backupPath);
            console.log(`Backed up corrupted events file to ${backupPath}`);
            
            // Initialize file with empty array
            fs.writeFileSync(EVENTS_FILE, '[]');
            console.log('Initialized events file with empty array');
          } catch (backupError) {
            console.error('Error backing up corrupted events file:', backupError);
          }
        }
      }
    } catch (error) {
      console.error('Error loading events from file:', error);
    }
  }
  
  // Check if cache is still valid and we're not forcing a refresh
  if (!forceRefresh && cachedEvents.length > 0 && now - lastFetched < CACHE_TTL) {
    return NextResponse.json(filterPastEvents(cachedEvents));
  }
  
  try {
    // Scrape fresh events data
    console.log('Scraping fresh events data...');
    const events = await scrapeAllVenues();
    
    // Update cache
    cachedEvents = events;
    lastFetched = now;
    
    // Save to file
    try {
      if (!fs.existsSync(DATA_FOLDER)) {
        fs.mkdirSync(DATA_FOLDER, { recursive: true });
      }
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
      console.log(`Saved ${events.length} events to data file`);
    } catch (fileError) {
      console.error('Error saving events to file:', fileError);
    }
    
    return NextResponse.json(filterPastEvents(events));
  } catch (error) {
    console.error('Error fetching events:', error);
    
    // If there's an error but we have cached data, return that instead
    if (cachedEvents.length > 0) {
      return NextResponse.json(filterPastEvents(cachedEvents));
    }
    
    // Otherwise return an error
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

/**
 * Filter out past events
 */
function filterPastEvents(events: Event[]): Event[] {
  // For debugging
  console.log(`Total events before filtering: ${events.length}`);
  
  // Get today's date at midnight for comparison (to include all of today's events)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const filteredEvents = events.filter(event => {
    // Parse the event date
    const eventDate = new Date(event.date);
    
    // Keep events that are today or in the future
    const keepEvent = eventDate >= today;
    
    return keepEvent;
  });
  
  console.log(`Events after filtering: ${filteredEvents.length}`);
  
  // Dump the first few events for debugging
  if (filteredEvents.length > 0) {
    console.log("First event:", JSON.stringify(filteredEvents[0], null, 2));
  }
  
  return filteredEvents;
} 