import { Event, EventVibe, VenueId } from '@/types';
import Button from './Button';
import { useState, useRef } from 'react';
import { useLikes } from '@/hooks/useLikes';

// Event card component with minimalist brutalist styling
export default function EventCard({ event, onLikeEvent }: { event: Event, onLikeEvent?: (eventId: string) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const lastTap = useRef<number>(0);
  
  // Use our new likes hook
  const {
    likeCount,
    isLiked,
    isBoosted,
    toggleLike,
    isLoading
  } = useLikes(event.id);
  
  const venueLabels: Record<string, string> = {
    [VenueId.LUX_LOUNGE]: 'Lux Lounge',
    [VenueId.FLOUR_CITY_STATION]: 'Flour City',
    [VenueId.BUG_JAR]: 'Bug Jar',
    [VenueId.MONTAGE_MUSIC_HALL]: 'Montage',
    [VenueId.PHOTO_CITY]: 'Photo City',
    [VenueId.RADIO_SOCIAL]: 'Radio Social',
  };
  
  // Format cover or price information
  let coverInfo = null;
  let coverColorClass = "bg-[#e01414]"; // Default red for expensive
  let priceSymbol = "●"; // Default price symbol
  let priceTooltip = "Price: Expensive";

  // Handle like/unlike
  const handleLikeClick = async () => {
    await toggleLike();
    
    // Call the parent callback if provided
    if (onLikeEvent) {
      onLikeEvent(event.id);
    }
  };

  // Handle double tap on mobile
  const handleDoubleTap = (e: React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms
    
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      e.preventDefault(); // Prevent zoom on double tap
      handleLikeClick();
    }
    
    lastTap.current = now;
  };

  if (event.price) {
    if (event.price === "0" || event.price.toLowerCase() === "free") {
      coverInfo = "FREE";
      coverColorClass = "bg-[#14e050]"; // Green for free
      priceSymbol = "○"; // Open circle for free
      priceTooltip = "Price: Free";
    } else if (!isNaN(Number(event.price))) {
      const price = Number(event.price);
      coverInfo = `$${price.toFixed(0)}`;
      
      // Color based on price range
      if (price <= 10) {
        coverColorClass = "bg-[#14e050]"; // Green for cheap ($10 or less)
        priceSymbol = "◐"; // Half circle for cheap
        priceTooltip = "Price: Affordable ($10 or less)";
      } else if (price <= 20) {
        coverColorClass = "bg-[#e0a014]"; // Yellow/amber for moderate ($11-$20)
        priceSymbol = "◑"; // Half circle for moderate
        priceTooltip = "Price: Moderate ($11-$20)";
      } else {
        priceTooltip = "Price: Premium ($21+)";
      }
    } else {
      coverInfo = event.price;
      priceTooltip = `Price: ${event.price}`;
    }
  }
  
  // Map event type to icon symbol
  const getVibeIcon = (vibe: EventVibe) => {
    switch(vibe) {
      case EventVibe.DANCING:
        return "♪";
      case EventVibe.WATCHING:
        return "◎";
      case EventVibe.LISTENING:
        return "♫";
      case EventVibe.INTERACTIVE:
        return "⧉";
      case EventVibe.DINING:
        return "▣";
      case EventVibe.DRINKING:
        return "◈";
      case EventVibe.OUTDOORS:
        return "◇";
      case EventVibe.CASUAL:
        return "○";
      case EventVibe.FORMAL:
        return "◆";
      default:
        return "•";
    }
  };
  
  return (
    <div 
      className={`border border-[#222] bg-[#111] hover:bg-[#161616] transition-colors relative 
                 ${isHovered ? 'card-border-animation' : ''} 
                 ${isLiked ? 'border-l-2 border-l-[#e01414]' : ''}
                 ${isBoosted ? 'border-t-2 border-t-[#e01414]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleDoubleTap}
    >
      <div className={isLiked ? "absolute top-0 right-0 w-0 h-0 border-t-[18px] border-t-[#e01414] border-l-[18px] border-l-transparent z-10" : "hidden"}>
      </div>
      
      {/* Boosted indicator */}
      {isBoosted && (
        <div className="absolute top-0 left-0 px-2 py-1 bg-[#300707] text-[#e01414] text-xs z-10">
          HOT
        </div>
      )}
      
      {/* Left accent border - color based on price */}
      <div className={`w-1 absolute top-0 left-0 h-full ${coverColorClass.replace('bg-', '')}`}></div>
      
      {/* Top-right accent corner for brutalist feel */}
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-t-[#e01414] border-l-[12px] border-l-transparent opacity-70"></div>
      
      {/* Chasing border animation elements - only visible on hover */}
      {isHovered && (
        <>
          <div className="card-border-animation-vertical-left"></div>
          <div className="card-border-animation-vertical-right"></div>
        </>
      )}
      
      <div className="flex relative">
        {/* Image section (hidden on mobile) */}
        {event.imageUrl ? (
          <div className="hidden md:block w-24 h-24 ml-1 flex-shrink-0 my-3 relative overflow-hidden">
            <img 
              src={event.imageUrl} 
              alt={event.title} 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
            />
            
            {/* Subtle glow on image when hovered */}
            {isHovered && (
              <div className="absolute inset-0 bg-[#e01414] opacity-10 mix-blend-overlay"></div>
            )}
            
            {/* Brutalist frame accent */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#e01414]"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#e01414]"></div>
          </div>
        ) : null}
        
        {/* Content section */}
        <div className="flex flex-col p-3 pl-4 flex-grow">
          <div className="flex justify-between items-start">
            <div>
              {/* Title with prominence */}
              <h3 className="font-bold text-sm text-white mb-1">
                {event.title}
              </h3>
              
              {/* Venue and time */}
              <div className="text-xs text-[#e01414] mono flex items-center mt-1">
                <span>{venueLabels[event.venue as VenueId] || event.venue}</span> 
                <span className="mx-1">•</span> 
                <span>{event.time}</span>
              </div>
            </div>
            
            {/* Cover info with brutalist styling */}
            {coverInfo && (
              <div 
                className={`${coverColorClass} text-white text-xs px-2 py-1 font-bold relative flex items-center`}
                title={priceTooltip}
              >
                <span className="mr-1 text-[9px]">{priceSymbol}</span>
                {coverInfo}
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#111]"></div>
              </div>
            )}
          </div>
          
          {/* Description - truncated */}
          <p className="text-xs text-gray-400 mt-2 line-clamp-2">{event.description}</p>
          
          {/* Bottom row with tags and view button */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#222]">
            <div className="flex flex-wrap gap-1">
              {/* Event vibes - show as geometric symbols - no animation */}
              {event.vibe && event.vibe.length > 0 && (
                <div className="flex space-x-1 mr-3">
                  {event.vibe.slice(0, 3).map((vibe) => (
                    <span 
                      key={vibe} 
                      className="text-[#e01414] text-xs"
                      title={vibe}
                    >
                      {getVibeIcon(vibe)}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Like count indicator */}
              {likeCount > 0 && (
                <div className="text-xs text-gray-400 flex items-center mr-1">
                  <span className={`mr-1 ${isBoosted ? 'text-[#e01414]' : ''}`}>{likeCount}</span>
                  <span className="text-[#e01414]">♥</span>
                </div>
              )}
              
              {/* Genre tags - limit to 3 with asymmetrical styling */}
              {event.genres && event.genres.slice(0, 3).map((genre, index) => (
                <span 
                  key={genre} 
                  className={`bg-[#1a1a1a] text-white text-xs px-1.5 py-0.5 ${
                    index === 0 ? 'border-l-2 border-[#e01414]' : ''
                  }`}
                >
                  {genre}
                </span>
              ))}
              
              {/* Show more indicator if there are more genres */}
              {event.genres && event.genres.length > 3 && (
                <span className="text-gray-500 text-xs">+{event.genres.length - 3}</span>
              )}
            </div>
            
            <div className="flex items-center">
              {/* Mobile hint - now inside the card */}
              <div className="md:hidden text-xs text-gray-500 mr-3">
                Double-tap to like
              </div>
              
              {/* Interest/Like button with brutalist styling */}
              <button 
                onClick={handleLikeClick}
                disabled={isLoading}
                className={`mr-2 px-2.5 py-1.5 border ${isLiked ? 'border-[#e01414] bg-[#300707]' : 'border-[#333] bg-[#111]'} transition-colors ${isLoading ? 'opacity-50' : ''}`}
                title={isLiked ? 'Remove interest' : 'Show interest'}
              >
                <span className={`text-base ${isLiked ? 'text-[#e01414]' : 'text-gray-500'} transition-colors`}>
                  {isLiked ? '★' : '☆'}
                </span>
              </button>
              
              {/* View link with brutalist enhancement - now larger */}
              <div className="relative">
                <a 
                  href={event.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white no-underline"
                >
                  <Button variant="primary" className="text-xs py-2 px-4">
                    <span className="text-white">VIEW</span>
                  </Button>
                </a>
                
                {/* Tech decoration element */}
                <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-[#e01414]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom accent line for brutalist style */}
      <div className="h-px w-1/4 bg-[#e01414] opacity-40 absolute bottom-0 right-0"></div>
    </div>
  );
} 