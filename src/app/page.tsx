'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDate, groupEventsByDay } from '@/lib/utils';
import { Event, EventVibe, VenueId } from '@/types';
// import Astronaut from '@/components/Astronaut'; // Commented out as requested
import GridPattern from '@/components/GridPattern';
import EventCard from '@/components/EventCard';
import Button from '@/components/Button';
import FeaturedEvent from '@/components/FeaturedEvent';

// Define the LikeData interface
interface LikeData {
  eventId: string;
  count: number;
  boosted: boolean;
  lastUpdated: string;
}

interface LikesStore {
  likes: Record<string, LikeData>;
}

// Component for the minimalist event page
export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [likesData, setLikesData] = useState<LikesStore | null>(null);
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [showMobileHint, setShowMobileHint] = useState(false);

  // For infinite scrolling
  const [visibleDates, setVisibleDates] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const ITEMS_PER_PAGE = 5;

  // Loading splash screen effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);
  
  // Show mobile hint
  useEffect(() => {
    if (!showSplash) {
      // Check if it's a mobile device
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setShowMobileHint(true);
        // Hide it after 3 seconds
        const hideTimer = setTimeout(() => {
          setShowMobileHint(false);
        }, 3000);
        
        return () => clearTimeout(hideTimer);
      }
    }
  }, [showSplash]);

  // Fetching events client-side
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 250);
      }
    }

    fetchEvents();
  }, []);

  // Fetch all likes data
  useEffect(() => {
    async function fetchAllLikes() {
      try {
        const response = await fetch('/api/likes');
        
        if (!response.ok) {
          throw new Error('Failed to fetch likes');
        }
        
        const data = await response.json();
        setLikesData(data);
        
        // Find featured event
        if (events.length > 0 && data.likes) {
          updateFeaturedEvent(data.likes, events);
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
      }
    }
    
    if (events.length > 0) {
      fetchAllLikes();
    }
  }, [events]);
  
  // Function to update featured event
  const updateFeaturedEvent = (likes: Record<string, LikeData>, eventList: Event[]) => {
    if (eventList.length === 0) return;
    
    // First check for boosted events
    const boostedEvents = Object.values(likes)
      .filter(like => like.boosted)
      .sort((a, b) => b.count - a.count);
    
    if (boostedEvents.length > 0) {
      // Find the boosted event with the highest like count
      const topBoostedEvent = eventList.find(e => e.id === boostedEvents[0].eventId);
      if (topBoostedEvent) {
        setFeaturedEvent(topBoostedEvent);
        return;
      }
    }
    
    // If no boosted events, find the most liked event
    let maxLikes = 0;
    let mostLikedEventId = '';
    
    Object.entries(likes).forEach(([eventId, likeData]) => {
      if (likeData.count > maxLikes) {
        maxLikes = likeData.count;
        mostLikedEventId = eventId;
      }
    });
    
    // Set featured event
    if (mostLikedEventId) {
      const featured = eventList.find(e => e.id === mostLikedEventId);
      if (featured) {
        setFeaturedEvent(featured);
        return;
      }
    }
    
    // If no likes, just use the first event
    setFeaturedEvent(eventList[0]);
  };
  
  // Handle like event callback
  const handleLikeEvent = (eventId: string) => {
    // Refresh likes data when an event is liked
    fetch('/api/likes')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch likes');
      })
      .then(data => {
        setLikesData(data);
        
        if (events.length > 0 && data.likes) {
          updateFeaturedEvent(data.likes, events);
        }
      })
      .catch(error => {
        console.error('Error updating likes data:', error);
      });
  };

  // Initialize visible dates when events change
  useEffect(() => {
    const eventsByDay = groupEventsByDay(events);
    const sortedDates = Object.keys(eventsByDay).sort();

    setVisibleDates(sortedDates.slice(0, ITEMS_PER_PAGE));
    setHasMore(sortedDates.length > ITEMS_PER_PAGE);
  }, [events]);

  // Infinite scroll last element ref callback
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        const eventsByDay = groupEventsByDay(events);
        const sortedDates = Object.keys(eventsByDay).sort();

        if (visibleDates.length < sortedDates.length) {
          const nextDates = sortedDates.slice(
            visibleDates.length,
            visibleDates.length + ITEMS_PER_PAGE
          );

          setVisibleDates(prev => [...prev, ...nextDates]);
          setHasMore(visibleDates.length + nextDates.length < sortedDates.length);
        } else {
          setHasMore(false);
        }
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, events, visibleDates]);

  // Get all dates and grouped events
  const eventsByDay = groupEventsByDay(events);
  const sortedDates = Object.keys(eventsByDay).sort();

  // Simple loading screen
  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        {/* CRT Overlay - Crisp version */}
        <div className="crt-overlay-crisp fixed inset-0 pointer-events-none"></div>

        <div className="relative">
          {/* Rochester coordinates */}
          <div className="absolute -top-16 left-0 font-mono text-xs text-[#e01414] opacity-70">
            <div>LAT: 43.1566° N</div>
            <div>LONG: 77.6088° W</div>
          </div>

          <h1 className="text-6xl relative">
            <span className="text-[#e01414] font-mono stable-glow">HOP</span>
            <span className="font-mono text-white">ROC</span>
            <div className=" -bottom-2 right-0 text-xs text-gray-500">v.2.3.4</div>
          </h1>

          <div className="mt-8 relative overflow-hidden">
            <div className="h-1 w-64 bg-[#222] relative">
              <div className=" top-0 left-0 h-full bg-[#e01414] animate-[loading_1.2s_cubic-bezier(0.1,0.85,0.7,1)_forwards]"></div>
            </div>
            <div className="mt-2 text-[10px] font-mono flex justify-between text-gray-500">
              <span>VALIDATING ACCESS</span>
              <span className="animate-[blink_1s_infinite]">SYSTEM LOADING</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative reduced-accents">
      {/* ROC Logo with Holographic Effect */}
      <div className="fixed inset-0 pointer-events-none decorative" style={{ zIndex: -10 }}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-2/3 h-2/3 max-w-3xl relative">
            {/* Base logo with subtle glow */}
            <div
              className="w-full h-full bg-no-repeat bg-contain bg-center"
              style={{
                backgroundImage: "url('/roc_logo.png')",
                opacity: 0.1
              }}
            ></div>

            {/* Holographic shader effect */}
            <div className="absolute inset-0 shader">
              <div className="absolute inset-0 opacity-0"></div>
              <div className="shader__layer specular" style={{
                backgroundImage: `linear-gradient(
                  0deg,
                  hsl(0, 0%, 0%) 20%,
                  hsl(358, 90%, 60%) 40%,
                  hsl(30, 100%, 70%) 50%, 
                  hsl(358, 90%, 60%) 80%,
                  hsl(0, 0%, 0%) 100%
                )`,
                backgroundSize: '200% 200%',
                animation: 'hologram-shift 8s infinite alternate ease-in-out'
              }}>
                <div className="shader__layer mask" style={{
                  backgroundImage: "url('/roc_logo.png')",
                  backgroundSize: "contain",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  filter: "contrast(2) brightness(2.5)",
                  mixBlendMode: "multiply"
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crisp CRT Overlay */}
      <div className="crt-overlay-crisp fixed inset-0 pointer-events-none z-30 decorative"></div>

      {/* Circuit patterns */}
      <div className="fixed top-0 right-0 w-24 h-full z-20 border-l border-[#333] hidden md:block decorative">
        <div className="h-full w-full relative">
          <div className="absolute top-[15%] left-0 w-3 h-3 bg-[#e01414] opacity-50"></div>
          <div className="absolute top-[15%] left-0 w-full h-px bg-[#e01414] opacity-30"></div>
          <div className="absolute top-[40%] left-0 w-5 h-1 bg-[#e01414] opacity-30"></div>
          <div className="absolute top-[65%] left-0 w-full h-px bg-[#e01414] opacity-30"></div>
          <div className="absolute top-[65%] left-0 w-2 h-2 bg-[#e01414] opacity-40"></div>
          <div className="absolute top-[90%] left-0 w-4 h-4 rounded-full border border-[#e01414] opacity-30"></div>

          {/* Status indicators */}
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 space-y-16">
            <div className="status-dot active"></div>
            <div className="w-px h-20 bg-[#333] mx-auto"></div>
            <div className="status-dot active"></div>
            <div className="w-px h-20 bg-[#333] mx-auto"></div>
            <div className="progress-bar w-10 mx-auto"></div>
          </div>
        </div>
      </div>

      {/* Mobile hint for double tap */}
      {showMobileHint && (
        <div className="mobile-hint">
          Double-tap any event to add it to your favorites!
        </div>
      )}

      {/* Blinking console in corner */}
      <div className="fixed bottom-4 right-4 z-40 w-64 h-32 bg-black border border-[#333] overflow-hidden hidden md:block decorative">
        <div className="absolute top-0 left-0 w-full h-5 bg-[#111] border-b border-[#333] flex items-center px-2">
          <div className="w-2 h-2 rounded-full bg-[#e01414] mr-1"></div>
          <span className="text-[10px] font-mono text-gray-500">SYSTEM.CONSOLE</span>
          <div className="ml-auto w-2 h-2 rounded-full bg-[#e01414] animate-pulse"></div>
        </div>
        <div className="p-2 pt-1 overflow-hidden font-mono text-[10px] text-gray-500 h-full">
          <div className="console-text">
            <div>&gt; SYS.INIT COMPLETE</div>
            <div>&gt; ESTABLISHING CONNECTION...</div>
            <div className="text-[#e01414]">&gt; EVENTS DB CONNECTED <span className="inline-block console-blink">_</span></div>
            <div>&gt; MONITORING ROCHESTER AREA</div>
            <div>&gt; STATUS: <span className="text-green-500">ONLINE</span></div>
            <div className="flex items-center">
              &gt; SCANNING <span className="ml-1 console-spinner"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="relative z-10 pt-24 md:pt-32">
        {/* Header Section */}
        <header className="tech-border py-8 md:py-28 mb-8 md:mb-16 relative overflow-hidden content-section">
          <GridPattern size={80} opacity={0.1} variant="brutalist" className="decorative" />
          
          {/* Rochester flower city symbol (simplified) */}
          <div className="absolute bottom-0 right-0 w-64 h-64 -z-0 opacity-5 transform translate-x-1/4 translate-y-1/4 decorative">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="50" cy="50" r="30" fill="none" stroke="#e01414" strokeWidth="1"></circle>
              <circle cx="50" cy="50" r="15" fill="none" stroke="#e01414" strokeWidth="1"></circle>
              <path d="M50,20 L50,10 M50,90 L50,80 M20,50 L10,50 M90,50 L80,50 M35,35 L25,25 M65,35 L75,25 M35,65 L25,75 M65,65 L75,75" 
                    stroke="#e01414" strokeWidth="1"></path>
            </svg>
          </div>
          
          <div className="container-wide header-container">
            <div className="relative">
              <div className="status-indicator">
                <div className="flex flex-col">
                  <h1 className="text-7xl md:text-9xl mb-8 md:mb-16 asymm-accent site-title flex items-baseline mt-2 md:mt-6 primary-content">
                    <span className="text-[#e01414] stable-glow">HOP</span><span className="title-roc">ROC</span>
                  </h1>
                  <div className="text-[10px] opacity-70 mt-2 tertiary-content">43.1566° N, 77.6088° W</div>
                  <div className="-right-1 top-0 font-mono">
                    <div className="text-right">
                      <span className="text-sm md:text-lg text-[#e01414] opacity-80 tertiary-content">_SYSTEM</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-base md:text-xl text-gray-300 max-w-xl mb-6 md:mb-12 leading-relaxed relative z-10 secondary-content">
                A brutalist guide to bar and club events this weekend in Rochester, NY.
              </p>
              <div className="flex flex-wrap gap-4 md:gap-6 relative z-10">
                <Button
                  onClick={() => window.scrollTo({ top: document.getElementById('events-section')?.offsetTop, behavior: 'smooth' })}
                  variant="primary"
                  className="px-4 md:px-8 py-2 md:py-4 text-sm md:text-base"
                >
                  VIEW EVENTS
                </Button>
                <Button
                  onClick={() => window.scrollTo({ top: document.getElementById('featured-section')?.offsetTop, behavior: 'smooth' })}
                  variant="secondary"
                  className="px-4 md:px-8 py-2 md:py-4 text-sm md:text-base"
                >
                  HOT PICK
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Event Section */}
        <section id="featured-section" className="container-wide spacer-y relative content-section">
          {featuredEvent && (
            <FeaturedEvent event={featuredEvent} />
          )}
        </section>

        {/* Events Section */}
        <section id="events-section" className="container-wide spacer-y-lg relative content-section">
          <div className="absolute -top-12 left-4 text-xs font-mono text-gray-600 tertiary-content">SECTOR 03</div>
          <div className="absolute -top-px right-0 w-32 h-px bg-[#e01414] opacity-30 decorative"></div>

          <div className="flex flex-col md:flex-row md:items-center mb-2 md:mb-4">
            <h2 className="text-2xl md:text-3xl asymm-accent pt-6 md:pt-10 primary-content">
              <span className="text-[#e01414] stable-glow">HOP</span>ROC DATABASE
            </h2>
            <div className="mt-2 md:mt-0 md:ml-4 flex items-center text-xs font-mono text-gray-500 tertiary-content">
              <span className="inline-block h-2 w-2 bg-[#e01414] mr-2 animate-ping"></span>
              <span className="typing-animation inline-block w-28">REAL-TIME FEED</span>
            </div>
          </div>

          {/* Events List */}
          <div>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#e01414] border-r-transparent"></div>
                <span className="ml-2">Loading...</span>
              </div>
            ) : (
              <div>
                {sortedDates.length === 0 ? (
                  <div className="border border-[#333] p-8 text-center">
                    <h3 className="text-xl">NO EVENTS FOUND</h3>
                    <p className="text-white mt-2">Check back soon for updates</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {visibleDates.map((dateStr, index) => {
                      const isLastElement = index === visibleDates.length - 1;

                      return (
                        <div
                          key={dateStr}
                          ref={isLastElement && hasMore ? lastElementRef : null}
                          className="relative"
                        >
                          <h3 className="text-sm pb-2 mb-4 border-b border-[#333] flex justify-between items-center">
                            <span className="bg-[#e01414] text-white px-2 py-1 text-xs font-bold relative primary-content">
                              {formatDate(new Date(dateStr))}
                              <div className="absolute -top-px -right-px w-2 h-2 border-r border-t border-white"></div>
                            </span>
                            <span className="text-xs text-gray-400 flex items-center tertiary-content">
                              <span className="inline-block w-3 h-px bg-[#e01414] mr-2"></span>
                              {eventsByDay[dateStr].length} EVENTS
                            </span>
                          </h3>
                          <div className="space-y-4">
                            {eventsByDay[dateStr].map((event: Event, eventIndex: number) => (
                              <div key={event.id} className="relative card-highlight">
                                {/* Event number marker */}
                                <div className="absolute -left-10 top-2 font-mono text-xs text-gray-600 hidden md:block tertiary-content">
                                  {(eventIndex + 1).toString().padStart(2, '0')}
                                  <div className="h-1 w-1 bg-[#e01414] opacity-50 absolute -left-3 top-1/2 transform -translate-y-1/2 animate-pulse"></div>
                                </div>
                                <EventCard 
                                  event={event} 
                                  onLikeEvent={handleLikeEvent}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {hasMore && !isLoading && (
                      <div className="text-center p-4 cursor-pointer"
                        onClick={() => {
                          const lastElement = document.querySelector('[ref="lastElementRef"]');
                          if (lastElement) {
                            lastElement.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}>
                        <Button variant="primary" className="w-full py-3">
                          <div className="flex items-center justify-center">
                            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
                            <span>LOAD MORE EVENTS</span>
                          </div>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <footer className="py-6 md:py-8 px-4 border-t border-[#333] mt-8 md:mt-16 relative content-section">
          <div className="absolute left-0 top-0 w-full h-px decorative">
            <div className="w-1/3 h-full bg-[#e01414] opacity-30"></div>
          </div>
          
          <div className="container-wide text-center text-xs md:text-sm text-gray-500 tertiary-content">
            <div className="grid grid-cols-3 mb-4">
              <div className="text-left text-xs font-mono hidden md:block">ELEVATION: 505 FT</div>
              <div>© {new Date().getFullYear()} <span className="text-[#e01414]">HOP</span>ROC</div>
              <div className="text-right text-xs font-mono hidden md:block">UPDATED WEDNESDAYS</div>
            </div>

            {/* Decorative flower city inspired icon */}
            <div className="flex justify-center mt-4 decorative">
              <svg width="40" height="20" viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0 L40 20 L0 20 Z" fill="none" stroke="#e01414" strokeWidth="1" opacity="0.4" />
              </svg>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
