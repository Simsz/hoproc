#!/usr/bin/env node

// Script to validate the events.json file and fix date issues

const fs = require('fs');
const path = require('path');

// Path to events file
const DATA_FOLDER = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_FOLDER, 'events.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_FOLDER)) {
  fs.mkdirSync(DATA_FOLDER, { recursive: true });
}

// Function to validate and fix events
async function validateEvents() {
  try {
    console.log(`Validating events in ${EVENTS_FILE}...`);
    
    // Check if events file exists
    if (!fs.existsSync(EVENTS_FILE)) {
      console.error('Events file does not exist!');
      return false;
    }
    
    // Read the file
    const fileData = fs.readFileSync(EVENTS_FILE, 'utf8');
    console.log(`Read ${fileData.length} bytes from events file`);
    
    // Parse the JSON
    let events;
    try {
      events = JSON.parse(fileData);
      console.log(`Successfully parsed JSON, found ${events.length} events`);
    } catch (parseError) {
      console.error('Error parsing events JSON:', parseError);
      console.log('Creating a backup of the corrupted file and initializing a new one');
      
      // Backup the corrupted file
      const backupPath = `${EVENTS_FILE}.backup.${Date.now()}`;
      fs.copyFileSync(EVENTS_FILE, backupPath);
      console.log(`Backed up corrupted events file to ${backupPath}`);
      
      // Create empty events array
      events = [];
    }
    
    // Check if events is an array
    if (!Array.isArray(events)) {
      console.error('Events is not an array!');
      events = [];
    }
    
    let modified = false;
    const today = new Date();
    const futureYear = 2025; // Use 2025 for all future dates
    
    // Validate required fields and fix dates
    events = events.map(event => {
      // Add missing required fields
      if (!event.id) {
        event.id = generateId();
        modified = true;
      }
      
      if (!event.genres || !Array.isArray(event.genres) || event.genres.length === 0) {
        event.genres = ['music'];
        modified = true;
      }
      
      if (!event.vibe || !Array.isArray(event.vibe) || event.vibe.length === 0) {
        event.vibe = ['casual', 'drinking'];
        modified = true;
      }
      
      // Check and fix date
      try {
        const eventDate = new Date(event.date);
        
        // If date is in the past, update it to the future
        if (eventDate < today) {
          // Keep month/day but update year to 2025
          const newDate = new Date(eventDate);
          newDate.setFullYear(futureYear);
          event.date = newDate.toISOString();
          console.log(`Updated date for "${event.title}" from ${eventDate.toISOString()} to ${event.date}`);
          modified = true;
        }
      } catch (dateError) {
        console.error(`Invalid date for event "${event.title}":`, dateError);
        // Set to a default future date
        event.date = new Date(futureYear, today.getMonth(), today.getDate()).toISOString();
        modified = true;
      }
      
      return event;
    });
    
    // Save the events if modified
    if (modified) {
      console.log('Saving updated events...');
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
      console.log(`Saved ${events.length} events with fixes`);
    } else {
      console.log('No issues found, all events are valid');
    }
    
    // Print summary of events
    console.log('\nEvents Summary:');
    console.log(`Total events: ${events.length}`);
    
    const venueCount = {};
    events.forEach(event => {
      venueCount[event.venue] = (venueCount[event.venue] || 0) + 1;
    });
    
    console.log('\nEvents by venue:');
    Object.entries(venueCount).forEach(([venue, count]) => {
      console.log(`  ${venue}: ${count} events`);
    });
    
    return true;
  } catch (error) {
    console.error('Error validating events:', error);
    return false;
  }
}

// Generate a random ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Run the validation
validateEvents().then(() => {
  console.log('Validation complete');
  process.exit(0);
}).catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
}); 