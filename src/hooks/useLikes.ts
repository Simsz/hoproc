import { useState, useEffect, useCallback } from 'react';

interface LikeData {
  eventId: string;
  count: number;
  boosted: boolean;
  lastUpdated: string;
}

interface UseLikesResult {
  likeCount: number;
  isLiked: boolean;
  isBoosted: boolean;
  handleLike: () => Promise<void>;
  handleUnlike: () => Promise<void>;
  toggleLike: () => Promise<void>;
  boostEvent: () => Promise<void>;
  unboostEvent: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useLikes = (eventId: string): UseLikesResult => {
  const [likeData, setLikeData] = useState<LikeData | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current like data for the event
  const fetchLikeData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/likes?eventId=${eventId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch likes');
      }
      
      const data: LikeData = await response.json();
      setLikeData(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error fetching like data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Check if the user has liked this event (from localStorage)
  const checkUserLike = useCallback(() => {
    try {
      const likedEvents = JSON.parse(localStorage.getItem('likedEvents') || '[]');
      setIsLiked(likedEvents.includes(eventId));
    } catch (err) {
      console.error('Error checking user likes:', err);
    }
  }, [eventId]);

  // Update local storage when the user likes/unlikes
  const updateLocalStorage = useCallback((liked: boolean) => {
    try {
      const likedEvents = JSON.parse(localStorage.getItem('likedEvents') || '[]');
      
      if (liked) {
        if (!likedEvents.includes(eventId)) {
          likedEvents.push(eventId);
        }
      } else {
        const index = likedEvents.indexOf(eventId);
        if (index !== -1) {
          likedEvents.splice(index, 1);
        }
      }
      
      localStorage.setItem('likedEvents', JSON.stringify(likedEvents));
      setIsLiked(liked);
    } catch (err) {
      console.error('Error updating localStorage:', err);
    }
  }, [eventId]);

  // Like event
  const handleLike = useCallback(async () => {
    if (isLiked) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          action: 'like',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to like event');
      }
      
      const data: LikeData = await response.json();
      setLikeData(data);
      updateLocalStorage(true);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error liking event:', err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, isLiked, updateLocalStorage]);

  // Unlike event
  const handleUnlike = useCallback(async () => {
    if (!isLiked) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          action: 'unlike',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to unlike event');
      }
      
      const data: LikeData = await response.json();
      setLikeData(data);
      updateLocalStorage(false);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error unliking event:', err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, isLiked, updateLocalStorage]);

  // Toggle like (like or unlike)
  const toggleLike = useCallback(async () => {
    if (isLiked) {
      await handleUnlike();
    } else {
      await handleLike();
    }
  }, [isLiked, handleLike, handleUnlike]);

  // Boost event
  const boostEvent = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          action: 'boost',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to boost event');
      }
      
      const data: LikeData = await response.json();
      setLikeData(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error boosting event:', err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Unboost event
  const unboostEvent = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          action: 'unboost',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to unboost event');
      }
      
      const data: LikeData = await response.json();
      setLikeData(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error unboosting event:', err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Initialize on component mount
  useEffect(() => {
    fetchLikeData();
    checkUserLike();
  }, [fetchLikeData, checkUserLike]);

  return {
    likeCount: likeData?.count || 0,
    isLiked,
    isBoosted: likeData?.boosted || false,
    handleLike,
    handleUnlike,
    toggleLike,
    boostEvent,
    unboostEvent,
    isLoading,
    error,
  };
}; 