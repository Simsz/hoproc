import { Event } from '@/types';
import { scrapeFlourCityStation } from './flourCityStation';
import { scrapeBugJar } from './bugJar';
import { scrapeMontage } from './montage';
import { scrapePhotoCity } from './photoCity';
import { scrapeRadioSocial } from './radioSocial';
import { scrapeLuxLounge } from './luxLounge';

export async function scrapeAllVenues(): Promise<Event[]> {
  try {
    const [
      luxEvents,
      flourCityEvents, 
      bugJarEvents, 
      montageEvents, 
      photoCityEvents,
      radioSocialEvents
    ] = await Promise.all([
      scrapeLuxLounge(),
      scrapeFlourCityStation(),
      scrapeBugJar(),
      scrapeMontage(),
      scrapePhotoCity(),
      scrapeRadioSocial()
    ]);

    return [
      ...luxEvents,
      ...flourCityEvents,
      ...bugJarEvents,
      ...montageEvents,
      ...photoCityEvents,
      ...radioSocialEvents
    ];
  } catch (error) {
    console.error('Error scraping venues:', error);
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