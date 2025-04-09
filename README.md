# Rochester Events Aggregator

A Next.js + TypeScript web app that aggregates bar and club events in Rochester, NY.

## Features

- Scrapes event information from multiple venues
- Normalizes data into a consistent format
- Uses AI (Claude) to enhance and extract structured data from unstructured content
- Displays events in a clean, filterable interface
- Groups events by day
- Filter events by genre, vibe, and venue
- Weekly automatic updates of event data (every Wednesday)

## Tech Stack

- Next.js 15.2 with App Router
- TypeScript
- Tailwind CSS
- Cheerio for web scraping
- Axios for HTTP requests
- Claude API for image/text processing and data extraction
- node-cron for scheduling updates

## Project Structure

```
src/
├── app/                    # Next.js app
│   ├── api/                # API routes
│   │   ├── events/         # Events API
│   │   │   └── route.ts    # GET handler for events
│   ├── page.tsx            # Homepage with event listings
│   └── layout.tsx          # Layout component
├── scrapers/               # Website scrapers
│   ├── index.ts            # Exports all scrapers
│   ├── luxLounge.ts        # Lux Lounge scraper
│   ├── bugJar.ts           # Bug Jar scraper
│   ├── flourCityStation.ts # Flour City Station scraper
│   ├── montage.ts          # Montage Music Hall scraper
│   ├── photoCity.ts        # Photo City scraper
│   └── radioSocial.ts      # Radio Social scraper
├── lib/                    # Utility functions
│   ├── utils.ts            # General utilities
│   └── normalizeWithLLM.ts # AI text processing
└── types.ts                # TypeScript type definitions
scripts/
└── update-events.js        # Weekly update script
data/
└── events.json             # Cached events data
```

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and add your Claude API key:

```bash
cp .env.example .env
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Claude AI Integration

The project uses Claude API for:

1. Processing event flyer images to extract structured data
2. Normalizing and enhancing scraped text content
3. Extracting dates and times from unstructured text

To use Claude:

1. Get an API key from [Anthropic](https://www.anthropic.com/)
2. Add it to your `.env` file as `CLAUDE_API_KEY`

We're using the `claude-3-5-haiku-20240307` model for all processing, which is cost-effective and fast enough for our needs.

## Scheduled Updates

The app will automatically update event data every Wednesday to ensure you have the latest weekend events.

### Manual Updates

You can manually trigger an update:

```bash
npm run update-events
```

### Setting Up the Scheduler

For production, you can set up a cron job or use a service like Vercel Cron:

#### Using node-cron (keeps a process running)

```bash
node scripts/update-events.js --cron
```

#### Using system cron (Linux/Mac)

```
0 1 * * 3 cd /path/to/project && npm run update-events
```

#### Using Vercel Cron

If deploying to Vercel, set up a cron job in your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/events?refresh=true",
      "schedule": "0 1 * * 3"
    }
  ]
}
```

## Adding a New Venue

To add a new venue:

1. Create a new scraper in `src/scrapers/` following the existing pattern
2. Add the venue to the `VenueId` enum in `src/types.ts`
3. Update the `scrapeAllVenues` function in `src/scrapers/index.ts`

## Filtering

The UI supports filtering events by:
- Genre (music/event type)
- Vibe (dancing, watching, interactive, etc.)
- Venue

## Deployment

The project can be deployed to Vercel:

```bash
npm run build
```

## License

MIT
