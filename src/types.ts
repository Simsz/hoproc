export interface Event {
  id: string;
  title: string;
  venue: string;
  date: Date;
  time: string;
  description: string;
  link: string;
  imageUrl?: string;
  tags?: string[];
  price?: string;
  genres?: string[];
  vibe?: EventVibe[];
}

export enum EventVibe {
  DANCING = 'dancing',
  WATCHING = 'watching',
  LISTENING = 'listening',
  INTERACTIVE = 'interactive',
  DINING = 'dining',
  DRINKING = 'drinking',
  OUTDOORS = 'outdoors',
  CASUAL = 'casual',
  FORMAL = 'formal',
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  website: string;
}

export enum VenueId {
  LUX_LOUNGE = 'lux-lounge',
  FLOUR_CITY_STATION = 'flour-city-station',
  BUG_JAR = 'bug-jar',
  MONTAGE_MUSIC_HALL = 'montage-music-hall',
  PHOTO_CITY = 'photo-city',
  RADIO_SOCIAL = 'radio-social',
} 