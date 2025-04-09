import { Event, EventVibe, VenueId } from '@/types';
import { generateUniqueId } from './utils';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import axios from 'axios';
import sharp from 'sharp';

interface NormalizationOptions {
  extractDateFromText?: boolean;
  cleanDescription?: boolean;
  inferTags?: boolean;
  inferGenres?: boolean;
  inferVibes?: boolean;
  maxDescriptionLength?: number;
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
});

/**
 * Uses Claude to normalize and enrich event data
 * 
 * @param rawEventData Raw scraped event data (could be HTML, text, etc.)
 * @param venue Venue ID
 * @param options Customization options for normalization
 * @returns Normalized Event object
 */
export async function normalizeWithLLM(
  rawEventData: string,
  venue: string,
  options: NormalizationOptions = {}
): Promise<Partial<Event>> {
  try {
    console.log('Normalizing data with Claude...', { venue });
    
    const prompt = `
      You're helping to normalize event data for a Rochester, NY events aggregator.
      I have extracted this event information from the website of venue "${venue}".
      Please parse through this data and extract the following information:
      
      - Event title/name
      - Date (in YYYY-MM-DD format)
      - Time (in HH:MM AM/PM format)
      - Brief description (2-3 sentences maximum)
      - Price/cover charge
      - Music genres [list a few relevant genres as an array]
      - Vibes [select from: dancing, watching, listening, interactive, outdoors, dining, drinking, casual, formal]

      Here's the raw event data:
      ${rawEventData}
      
      Format your response as clean JSON so I can parse it directly. For example:
      {
        "title": "Example Event",
        "date": "2023-04-15",
        "time": "8:00 PM",
        "description": "A brief description of the event.",
        "price": "$10 cover",
        "genres": ["indie", "rock", "alternative"],
        "vibes": ["listening", "drinking", "casual"]
      }
    `;

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1000,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    // Parse JSON from Claude's response
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('Failed to parse JSON from Claude response');
      return {};
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Convert vibes from strings to EventVibe enum values
    const eventVibes: EventVibe[] = [];
    if (parsedData.vibes && Array.isArray(parsedData.vibes)) {
      parsedData.vibes.forEach((vibe: string) => {
        const normalizedVibe = vibe.toUpperCase() as keyof typeof EventVibe;
        if (EventVibe[normalizedVibe]) {
          eventVibes.push(EventVibe[normalizedVibe]);
        }
      });
    }

    // Parse date string into Date object
    let eventDate: Date | undefined;
    if (parsedData.date) {
      eventDate = new Date(parsedData.date);
    }
    
    return {
      title: parsedData.title,
      description: parsedData.description,
      date: eventDate,
      time: parsedData.time,
      price: parsedData.price,
      genres: parsedData.genres,
      vibe: eventVibes.length > 0 ? eventVibes : undefined,
    };
  } catch (error) {
    console.error('Error using Claude for normalization:', error);
    return {};
  }
}

/**
 * Uses Claude API to process an image of an event flyer/poster
 * and extract structured information
 * 
 * @param imageUrl Base64 encoded image or URL
 * @param venue Venue ID
 * @param isUrl Whether imageUrl is a URL (true) or base64 string (false)
 * @param customPrompt Optional custom prompt to use instead of the default
 * @returns Parsed event data
 */
export async function processEventImageWithLLM(
  imageUrl: string,
  venue: VenueId,
  isUrl: boolean = true,
  customPrompt?: string
): Promise<Partial<Event>> {
  try {
    console.log('Processing event image with Claude...', { venue, imageUrl });
    
    // Prepare image for Claude API
    let base64Image: string;
    
    if (isUrl) {
      // If we have a URL, fetch the image first
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data, 'binary');
      
      // Resize image if needed (Claude has limits on image size)
      const resizedImage = await sharp(imageBuffer)
        .resize({ width: 1000, fit: 'inside' })
        .toBuffer();
      
      base64Image = resizedImage.toString('base64');
    } else {
      // If we already have a base64 string
      base64Image = imageUrl;
    }
    
    // Create prompt for Claude - use custom prompt if provided
    const claudePrompt = customPrompt || `
      This is an event flyer/poster from a venue in Rochester, NY called "${venue}".
      Please extract as much information as possible about this event including:
      
      - Event title/name
      - Date (in YYYY-MM-DD format if possible)
      - Time (in HH:MM AM/PM format)
      - Artists/performers/DJs
      - Cover charge/ticket price if mentioned
      - Music genre or type of event
      - Any special features of the event
      
      Also categorize the event into one or more of these vibes:
      - DANCING (if it's a dance-focused event)
      - WATCHING (if it's more of a performance to watch)
      - LISTENING (if it's focused on music listening)
      - INTERACTIVE (if audience participation is expected)
      - OUTDOORS (if it appears to be an outdoor event)
      - DRINKING (if drinking is a focus)
      
      Format your response as clean JSON, for example:
      {
        "title": "Example Event",
        "date": "2023-04-15",
        "time": "8:00 PM",
        "description": "A brief description of the event.",
        "price": "$10 cover",
        "genres": ["indie", "rock", "alternative"],
        "vibes": ["listening", "drinking", "casual"]
      }
    `;

    // Call Claude API with the image
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: [
        { 
          role: "user", 
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64Image } },
            { type: "text", text: claudePrompt }
          ] 
        }
      ]
    });

    // Parse JSON from Claude's response
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('Failed to parse JSON from Claude response for image');
      return {};
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Convert vibes from strings to EventVibe enum values
    const eventVibes: EventVibe[] = [];
    if (parsedData.vibes && Array.isArray(parsedData.vibes)) {
      parsedData.vibes.forEach((vibe: string) => {
        const normalizedVibe = vibe.toUpperCase() as keyof typeof EventVibe;
        if (EventVibe[normalizedVibe]) {
          eventVibes.push(EventVibe[normalizedVibe]);
        }
      });
    }

    // Parse date string into Date object
    let eventDate: Date | undefined;
    if (parsedData.date) {
      eventDate = new Date(parsedData.date);
      // Make sure date is valid
      if (isNaN(eventDate.getTime())) {
        eventDate = undefined;
      }
    }
    
    return {
      id: generateUniqueId(),
      title: parsedData.title,
      venue: venue,
      date: eventDate,
      time: parsedData.time,
      description: parsedData.description,
      price: parsedData.price,
      genres: parsedData.genres,
      vibe: eventVibes.length > 0 ? eventVibes : undefined,
      imageUrl: imageUrl,
    };
  } catch (error) {
    console.error('Error processing image with Claude:', error);
    return {};
  }
}

/**
 * Extracts structured date information from a text string
 */
export async function extractDateFromText(text: string): Promise<{ date: Date; time: string } | null> {
  try {
    const prompt = `
      Extract the date and time from this text: '${text}'
      Return only a JSON object with the date in YYYY-MM-DD format and the time in HH:MM AM/PM format.
      For example: {"date": "2023-04-15", "time": "8:00 PM"}
    `;

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 100,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('Failed to parse JSON from Claude response for date extraction');
      return null;
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    if (!parsedData.date || !parsedData.time) {
      return null;
    }
    
    return {
      date: new Date(parsedData.date),
      time: parsedData.time
    };
  } catch (error) {
    console.error('Error extracting date with Claude:', error);
    return null;
  }
}

/**
 * Summarizes text with Claude
 */
export async function summarizeText(text: string): Promise<string> {
  try {
    const prompt = `
      Summarize this text in 1-2 concise sentences:
      
      ${text}
    `;

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 300,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    return message.content[0].text.trim();
  } catch (error) {
    console.error('Error summarizing text with Claude:', error);
    return "";
  }
} 