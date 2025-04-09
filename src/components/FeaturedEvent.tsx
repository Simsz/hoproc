import { Event } from '@/types';
import GridPattern from './GridPattern';
import EventCard from './EventCard';
import { useEffect, useState } from 'react';

interface LikeData {
  eventId: string;
  count: number;
  boosted: boolean;
  lastUpdated: string;
}

export default function FeaturedEvent({ event }: { event: Event }) {
  const [likeData, setLikeData] = useState<LikeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Fetch like data from our API
    const fetchLikeData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/likes?eventId=${event.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setLikeData(data);
        }
      } catch (error) {
        console.error('Error fetching like data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (event) {
      fetchLikeData();
    }
  }, [event]);
  
  // If we have no event, don't render anything
  if (!event) return null;
  
  // Get like count
  const likeCount = likeData?.count || 0;
  const isBoosted = likeData?.boosted || false;
  
  return (
    <div className="brutalist-box bg-black relative overflow-hidden p-4 md:p-8 card-highlight">
      <GridPattern size={40} opacity={0.1} variant="circuit" className="absolute inset-0 decorative" />
      <div className="absolute -top-4 right-4 text-xs font-mono text-gray-600 tertiary-content">
        {isBoosted ? 'BOOSTED EVENT' : 'TRENDING'}
      </div>
      <div className="absolute -top-px left-0 w-32 h-px bg-[#e01414] opacity-30 decorative"></div>
      
      <div className="relative z-10">
        <h2 className="text-2xl md:text-3xl mb-3 md:mb-6 asymm-accent primary-content">
          <span className="text-[#e01414] stable-glow">HOT</span> PICK
        </h2>
        
        {/* Interest indicator */}
        <div className="mb-4 flex items-center">
          <div className="bg-[#1d1d1d] px-3 py-1 text-xs flex items-center">
            <span className="text-[#e01414] mr-1">★</span>
            <span className="text-white secondary-content">
              {isLoading ? (
                <span className="inline-block w-12 h-4 bg-gray-700 animate-pulse rounded"></span>
              ) : (
                <>{likeCount} {likeCount === 1 ? 'user' : 'users'} interested</>
              )}
            </span>
          </div>
          <div className="h-px flex-grow ml-3 bg-[#333] decorative"></div>
        </div>
        
        {/* Featured event card */}
        <EventCard event={event} />
        
        {/* Boost controls (hidden for regular users, add admin check in real app) */}
        <div className="mt-4 flex space-x-2">
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/likes', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    eventId: event.id,
                    action: 'boost',
                  }),
                });
                
                if (response.ok) {
                  const data = await response.json();
                  setLikeData(data);
                }
              } catch (error) {
                console.error('Error boosting event:', error);
              }
            }}
            className="bg-[#300707] text-[#e01414] border border-[#e01414] px-3 py-1 text-xs hover:bg-[#3a0808] transition-colors"
          >
            B
          </button>
          
          {isBoosted && (
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/likes', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      eventId: event.id,
                      action: 'unboost',
                    }),
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    setLikeData(data);
                  }
                } catch (error) {
                  console.error('Error unboosting event:', error);
                }
              }}
              className="bg-[#333] text-gray-300 border border-gray-600 px-3 py-1 text-xs"
            >
              Unboost
            </button>
          )}
        </div>
        
        {/* Decorative tech element */}
        <div className="mt-4 grid grid-cols-5 gap-1 decorative">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i} 
              className={`h-1 ${i % 3 === 0 ? 'bg-[#e01414] opacity-40' : 'bg-[#333]'}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
} 