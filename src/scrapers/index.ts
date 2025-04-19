import { Event } from '@/types';
import { scrapeFlourCityStation } from './flourCityStation';
import { scrapeBugJar } from './bugJar';
import { scrapeMontage } from './montage';
import { scrapePhotoCity } from './photoCity';
import { scrapeRadioSocial } from './radioSocial';
import { scrapeLuxLounge } from './luxLounge';
import fs from 'fs';
import path from 'path';

export async function scrapeAllVenues(): Promise<Event[]> {
  try {
    const eventsPath = path.join(process.cwd(), 'data', 'events.json');
    const data = fs.readFileSync(eventsPath, 'utf-8');
    const events: Event[] = JSON.parse(data);
    return events;
  } catch (error) {
    console.error('Error reading events.json:', error);
    return [];
  }
}

export {
  scrapeLuxLounge,
  scrapeFlourCityStation,
  scrapeBugJar,
  scrapeMontage,
  scrapePhotoCity,
  scrapeRadioSocial,
}; 