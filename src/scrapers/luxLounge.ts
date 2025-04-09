import axios from 'axios';
import * as cheerio from 'cheerio';
import { Event, EventVibe, VenueId } from '@/types';
import { generateUniqueId } from '@/lib/utils';
import { processEventImageWithLLM, extractDateFromText, summarizeText } from '@/lib/normalizeWithLLM';

/**
 * Scrapes event data from Lux Lounge website
 * 
 * Lux's unique events are displayed as images with "More Details" links
 * in the "Upcoming Shows" section. We need to:
 * 1. Extract the image URLs and "More Details" links
 * 2. Process the images using Claude to extract event details
 * 3. Extract additional details from Facebook event pages when available
 */
export async function scrapeLuxLounge(): Promise<Event[]> {
  try {
    console.log('Scraping Lux Lounge events...');
    
    // Fetch the HTML from the Lux Lounge website
    const response = await axios.get('https://lux666.com/');
    const html = response.data;
    
    // Use cheerio to parse the HTML
    const $ = cheerio.load(html);
    const events: Event[] = [];
    
    // Find the specific 4-column row with events (as specified by the user)
    console.log('Looking for events in the 4-column row...');
    const eventRow = $('.et_pb_row_9, .et_pb_row_4col');
    
    if (!eventRow.length) {
      console.log('Could not find the 4-column row, trying alternate selectors...');
    }
    
    console.log(`Found event row: ${eventRow.length > 0}`);
    
    // Find all "More Details" links within the event row
    const eventLinks: string[] = [];
    const eventImages: string[] = [];
    
    // Only look for "More Details" links within the correct section
    eventRow.find('a:contains("More Details")').each((i: number, el: cheerio.Element) => {
      const href = $(el).attr('href');
      if (href) {
        console.log(`Found event link: ${href}`);
        eventLinks.push(href);
        
        // Try to find the closest image to this link
        const parentColumn = $(el).closest('.et_pb_column');
        const image = parentColumn.find('img').first();
        const imgSrc = image.attr('src');
        
        if (imgSrc) {
          console.log(`Found associated image: ${imgSrc}`);
          eventImages.push(imgSrc);
        } else {
          // Try looking in adjacent columns/modules for images
          const siblingColumns = parentColumn.siblings();
          let found = false;
          
          siblingColumns.each((j, sibling) => {
            if (!found) {
              const siblingImg = $(sibling).find('img').first();
              const sibImgSrc = siblingImg.attr('src');
              if (sibImgSrc) {
                console.log(`Found image in adjacent column: ${sibImgSrc}`);
                eventImages.push(sibImgSrc);
                found = true;
              }
            }
          });
          
          if (!found) {
            console.log('No image found for this event');
            // Push a placeholder so array indices match
            eventImages.push('');
          }
        }
      }
    });
    
    // If we didn't find any events in the specified row, try with broader search in the section
    if (eventLinks.length === 0) {
      console.log('No events found in the 4-column row, trying slightly broader search...');
      
      // Look within any 4-column row or upcoming shows section
      $('.et_pb_row_4col, .et_pb_section_3').find('a:contains("More Details")').each((i: number, el: cheerio.Element) => {
        const href = $(el).attr('href');
        if (href) {
          console.log(`Found event link (broad search): ${href}`);
          eventLinks.push(href);
          
          // Try to find any nearby image
          const nearbyModule = $(el).closest('.et_pb_module');
          const nearbyImages = nearbyModule.parent().find('img');
          
          if (nearbyImages.length > 0) {
            const imgSrc = nearbyImages.first().attr('src');
            if (imgSrc) {
              console.log(`Found associated image: ${imgSrc}`);
              eventImages.push(imgSrc);
            } else {
              eventImages.push('');
            }
          } else {
            eventImages.push('');
          }
        }
      });
    }
    
    // Process each event link and image
    for (let i = 0; i < Math.min(eventLinks.length, eventImages.length); i++) {
      const link = eventLinks[i];
      const imageUrl = eventImages[i];
      
      if (!imageUrl) {
        console.log(`Skipping event at index ${i} due to missing image`);
        continue;
      }
      
      console.log(`Processing event ${i+1}/${eventLinks.length}: ${link}`);
      
      try {
        // Check if the link is a Facebook event
        let facebookEventDescription = "";
        if (link.includes('facebook.com/events/')) {
          try {
            console.log(`Extracting description from Facebook event: ${link}`);
            const fbEventId = link.split('/').pop();
            if (fbEventId) {
              // Try to extract Facebook event description
              const fbEventData = await extractFacebookEventDetails(link);
              if (fbEventData) {
                facebookEventDescription = fbEventData;
                console.log(`Extracted Facebook description (${facebookEventDescription.length} chars)`);
              }
            }
          } catch (fbError) {
            console.error(`Error extracting Facebook event details:`, fbError);
          }
        }
        
        // Create a custom prompt specifically for Lux Lounge events
        // Include Facebook description if available
        const customPrompt = `
          This is an event flyer from Lux Lounge, a popular dive bar in Rochester, NY's South Wedge neighborhood at 666 South Ave.
          ${facebookEventDescription ? `\nFacebook event description: "${facebookEventDescription}"` : ''}
          
          Lux Lounge hosts a variety of events including live music, DJ nights, karaoke, and special performances.
          They are known for their signature Pabst Smear drink special ($3 for a PBR and a shot).
          
          Please extract as much information as possible about this event including:
          
          - Event title/name
          - Date (in YYYY-MM-DD format)
          - Time (in HH:MM AM/PM format)
          - Artists/performers/DJs (as an array of names)
          - Cover charge/ticket price
          - Music genre or type of event
          
          Also categorize the event into one or more of these vibes:
          - DANCING (if it's a dance-focused event)
          - LISTENING (if it's focused on music listening)
          - INTERACTIVE (if audience participation is expected)
          - OUTDOORS (if it appears to be an outdoor event) 
          - DRINKING (almost all Lux events involve drinking)
          - CASUAL (Lux is a casual venue)
          
          Write a brief description (1-2 sentences) that captures what this event is about.
          
          Format your response as clean JSON for direct parsing.
        `;
        
        // If we can extract basic information from image URL, do it
        const imageFileName = imageUrl.split('/').pop() || '';
        const fileNameWithoutExtension = imageFileName.split('.')[0] || '';
        
        // Default event details in case of API failure
        let eventDetails: Partial<Event> = {
          title: extractTitleFromFileName(fileNameWithoutExtension),
          date: new Date(),
          time: '9:00 PM',
          description: `Special event at Lux Lounge featuring ${extractTitleFromFileName(fileNameWithoutExtension)}.`,
          genres: ['music'],
          vibe: [EventVibe.DRINKING, EventVibe.CASUAL],
        };
        
        // Try to call the Claude API, but if it fails, we'll use the defaults
        try {
          const llmEventDetails = await processEventImageWithLLM(
            imageUrl, 
            VenueId.LUX_LOUNGE, 
            true, 
            customPrompt
          );
          
          // If the API call succeeds, use those details
          if (llmEventDetails.title) {
            eventDetails = llmEventDetails;
          }
        } catch (llmError) {
          console.error(`Error processing image with Claude, using default event details:`, llmError);
        }
        
        // The LLM might extract performers as a separate field, so we need to handle that
        let description = eventDetails.description || 'Special event at Lux Lounge';
        
        // Access performers from the raw data if available
        const rawData = eventDetails as any; // Cast to any to access potential performers field
        if (rawData.performers && Array.isArray(rawData.performers) && rawData.performers.length > 0) {
          description = `${description} Featuring: ${rawData.performers.join(', ')}`;
        }
        
        // Use Facebook description if available and no description was extracted
        if (facebookEventDescription && (!eventDetails.description || eventDetails.description === 'Special event at Lux Lounge')) {
          // Summarize the Facebook description
          try {
            const summary = await summarizeWithLLM(facebookEventDescription);
            if (summary) {
              description = summary;
            }
          } catch (summaryError) {
            console.error('Error summarizing Facebook description:', summaryError);
          }
        }
        
        // Create the event with either API-derived or default data
        events.push({
          id: generateUniqueId(),
          title: eventDetails.title || `Event at Lux Lounge ${i+1}`,
          venue: VenueId.LUX_LOUNGE,
          date: eventDetails.date || new Date(),
          time: eventDetails.time || '9:00 PM',
          description: description,
          link: link,
          imageUrl: imageUrl,
          genres: eventDetails.genres || ['music'],
          vibe: eventDetails.vibe || [EventVibe.DRINKING],
          price: eventDetails.price || 'No cover'
        });
        
        console.log(`Added event: ${eventDetails.title || `Event at Lux Lounge ${i+1}`}`);
      } catch (error) {
        console.error(`Error processing event ${i+1}:`, error);
      }
    }
    
    // Return only the unique events from the specified section
    // DO NOT add weekly recurring events as requested by the user
    return events;
  } catch (error) {
    console.error('Error scraping Lux Lounge:', error);
    return [];
  }
}

/**
 * Extract a title from a file name, replacing hyphens and underscores with spaces
 */
function extractTitleFromFileName(fileName: string): string {
  // Replace hyphens and underscores with spaces
  let title = fileName.replace(/[-_]/g, ' ');
  
  // Convert to title case (capitalize first letter of each word)
  title = title.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
    
  return title;
}

/**
 * Extracts event details from a Facebook event page
 */
async function extractFacebookEventDetails(url: string): Promise<string> {
  try {
    console.log(`Extracting details from Facebook event: ${url}`);
    
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Facebook wraps the event description in a div with data-testid="event-description-value"
    const eventDescription = $('[data-testid="event-description-value"]').text().trim();
    
    // Sometimes the description is in the meta tags
    if (!eventDescription) {
      const metaDescription = $('meta[property="og:description"]').attr('content');
      if (metaDescription) {
        return metaDescription;
      }
    }
    
    return eventDescription || '';
  } catch (error) {
    console.error('Error extracting Facebook event details:', error);
    return '';
  }
}

/**
 * Summarizes text content using the LLM summarization function
 */
async function summarizeWithLLM(text: string): Promise<string> {
  if (!text) return '';
  
  try {
    return await summarizeText(text);
  } catch (error) {
    console.error('Error summarizing text with LLM:', error);
    return text.substring(0, 150) + '...'; // Fallback to truncation if summarization fails
  }
} 