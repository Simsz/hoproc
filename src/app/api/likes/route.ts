import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to the likes data file
const DATA_FOLDER = path.join(process.cwd(), 'data');
const LIKES_FILE = path.join(DATA_FOLDER, 'likes.json');

// Define the likes data structure
interface LikeData {
  eventId: string;
  count: number;
  boosted: boolean; // Flag to indicate boosted events
  lastUpdated: string;
}

interface LikesStore {
  likes: Record<string, LikeData>;
}

// Initialize the likes file if it doesn't exist
function initLikesFile() {
  if (!fs.existsSync(DATA_FOLDER)) {
    fs.mkdirSync(DATA_FOLDER, { recursive: true });
  }
  
  if (!fs.existsSync(LIKES_FILE)) {
    const initialData: LikesStore = { likes: {} };
    fs.writeFileSync(LIKES_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  
  try {
    const data = fs.readFileSync(LIKES_FILE, 'utf-8');
    return JSON.parse(data) as LikesStore;
  } catch (error) {
    console.error('Error reading likes file:', error);
    const initialData: LikesStore = { likes: {} };
    fs.writeFileSync(LIKES_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

// Save likes data to file
function saveLikesData(data: LikesStore) {
  fs.writeFileSync(LIKES_FILE, JSON.stringify(data, null, 2));
}

// GET endpoint to retrieve all likes or a specific event's likes
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventId = searchParams.get('eventId');
  
  const likesData = initLikesFile();
  
  if (eventId) {
    // Return likes for a specific event
    const eventLikes = likesData.likes[eventId] || {
      eventId,
      count: 0,
      boosted: false,
      lastUpdated: new Date().toISOString()
    };
    return NextResponse.json(eventLikes);
  }
  
  // Return all likes
  return NextResponse.json(likesData);
}

// POST endpoint to update likes for an event
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { eventId, action } = data;
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }
    
    // Valid actions: "like", "unlike", "boost", "unboost"
    if (!['like', 'unlike', 'boost', 'unboost'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    const likesData = initLikesFile();
    
    // Initialize event likes if it doesn't exist
    if (!likesData.likes[eventId]) {
      likesData.likes[eventId] = {
        eventId,
        count: 0,
        boosted: false,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Update the likes count based on the action
    switch (action) {
      case 'like':
        likesData.likes[eventId].count += 1;
        break;
      case 'unlike':
        likesData.likes[eventId].count = Math.max(0, likesData.likes[eventId].count - 1);
        break;
      case 'boost':
        // Boost adds 15-30 random likes and sets the boosted flag
        const boostAmount = Math.floor(Math.random() * 16) + 15; // 15-30 likes
        likesData.likes[eventId].count += boostAmount;
        likesData.likes[eventId].boosted = true;
        break;
      case 'unboost':
        likesData.likes[eventId].boosted = false;
        break;
    }
    
    // Update the last updated timestamp
    likesData.likes[eventId].lastUpdated = new Date().toISOString();
    
    // Save the updated data
    saveLikesData(likesData);
    
    return NextResponse.json(likesData.likes[eventId]);
  } catch (error) {
    console.error('Error updating likes:', error);
    return NextResponse.json({ error: 'Failed to update likes' }, { status: 500 });
  }
} 