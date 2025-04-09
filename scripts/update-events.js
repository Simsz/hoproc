#!/usr/bin/env node

// Script to update events data weekly
// This can be run manually with: npm run update-events
// Or scheduled with cron/systemd/etc.

// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cron = require('node-cron');
const axios = require('axios');

// Path to store event data
const DATA_FOLDER = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_FOLDER, 'events.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_FOLDER)) {
  fs.mkdirSync(DATA_FOLDER, { recursive: true });
}

// Function to fetch events
async function fetchEvents() {
  try {
    console.log('Updating events data...');
    
    // In a production environment, this would directly use your scraper code
    // But for simplicity, we'll call the API endpoint that does the scraping
    
    // For local development, call the local API
    let apiUrl = 'http://localhost:3000/api/events';
    
    // If running in production, use the production URL
    if (process.env.VERCEL_URL) {
      apiUrl = `https://${process.env.VERCEL_URL}/api/events`;
    } else if (process.env.NEXT_PUBLIC_APP_URL) {
      apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/events`;
    }
    
    console.log(`Fetching events from: ${apiUrl}`);
    
    // Force refresh by adding a timestamp parameter
    const response = await axios.get(`${apiUrl}?refresh=true&t=${Date.now()}`);
    const events = response.data;
    
    if (!Array.isArray(events)) {
      throw new Error('Received invalid data format');
    }
    
    console.log(`Fetched ${events.length} events`);
    
    // Compare with existing data to avoid duplicates
    let existingEvents = [];
    
    if (fs.existsSync(EVENTS_FILE)) {
      try {
        existingEvents = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
      } catch (err) {
        console.warn('Could not parse existing events file, replacing it entirely');
      }
    }
    
    // Merge existing and new events, removing duplicates
    // We consider events to be duplicates if they have the same title, venue, and date
    const mergedEvents = [];
    const eventKeys = new Set();
    
    // First add existing events that are still in the future
    const now = new Date();
    existingEvents.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate >= now) {
        const key = `${event.title}-${event.venue}-${event.date}`;
        eventKeys.add(key);
        mergedEvents.push(event);
      }
    });
    
    // Then add new events that aren't duplicates
    events.forEach(event => {
      const key = `${event.title}-${event.venue}-${event.date}`;
      if (!eventKeys.has(key)) {
        eventKeys.add(key);
        mergedEvents.push(event);
      }
    });
    
    console.log(`Total merged events: ${mergedEvents.length}`);
    
    // Save the events data
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(mergedEvents, null, 2));
    
    console.log('Events data updated successfully!');
    return true;
  } catch (error) {
    console.error('Error updating events:', error);
    return false;
  }
}

// Check if this script is being run directly
if (require.main === module) {
  // If --cron flag is provided, schedule the task
  if (process.argv.includes('--cron')) {
    console.log('Setting up weekly schedule for event updates (every Wednesday at 1 AM)');
    
    // Schedule the task to run every Wednesday at 1 AM
    // Cron format: [minute] [hour] [day of month] [month] [day of week]
    cron.schedule('0 1 * * 3', () => {
      console.log(`Running scheduled event update: ${new Date().toISOString()}`);
      fetchEvents();
    });
    
    console.log('Cron job scheduled. Keep this process running to maintain the schedule.');
  } else {
    // Otherwise, run once immediately
    console.log('Running one-time event update');
    fetchEvents().then(() => {
      console.log('Update complete');
      process.exit(0);
    }).catch(err => {
      console.error('Update failed:', err);
      process.exit(1);
    });
  }
} 