import { Place } from '@/lib/types';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface PlaceCardProps {
  place: Place;
  isSaved?: boolean;
  onSaveToggle?: (placeId: string, isSaved: boolean) => void;
}

export default function PlaceCard({ place, isSaved = false, onSaveToggle }: PlaceCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const { data: session } = useSession();
  
  // isSaved prop 변경 시 saved state 업데이트
  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);
  
  const priceLabels = ['$', '$$', '$$$', '$$$$'];
  const priceText = place.price_range ? priceLabels[place.price_range - 1] : '';

  // Debug logging
  console.log('PlaceCard - Place:', place.name_en);
  console.log('PlaceCard - Specialties:', place.specialties);
  console.log('PlaceCard - Specialty Images:', place.specialty_images);

  // Generate Google Maps URL if coordinates exist
  const mapUrl = place.coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${place.coordinates.lat},${place.coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`;

  // Static map image URL (using Google Static Maps or placeholder)
  const staticMapUrl = place.coordinates
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${place.coordinates.lat},${place.coordinates.lng}&zoom=15&size=600x200&markers=color:red%7C${place.coordinates.lat},${place.coordinates.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`
    : '';

  // Use actual image or fallback to Unsplash placeholder
  const getCategoryImage = () => {
    if (place.image_url) return place.image_url;
    
    // Unsplash fallback images based on category
    const categoryImages: Record<string, string> = {
      restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
      cafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=400&fit=crop',
      accommodation: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=400&fit=crop',
      attraction: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=400&fit=crop',
      shopping: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
    };
    
    return categoryImages[place.category] || categoryImages.restaurant;
  };

  const placeImage = getCategoryImage();

  const handleSaveToggle = async () => {
    if (!session) {
      alert('Please login to save favorites');
      return;
    }

    setSaving(true);
    try {
      if (saved) {
        // Remove from favorites
        const response = await fetch(`/api/favorites?placeId=${place.id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setSaved(false);
          onSaveToggle?.(place.id, false);
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placeId: place.id }),
        });
        if (response.ok) {
          setSaved(true);
          onSaveToggle?.(place.id, true);
        } else if (response.status === 409) {
          // Already in favorites
          setSaved(true);
          onSaveToggle?.(place.id, true);
        } else {
          const data = await response.json();
          console.error('Failed to save:', data.error);
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-gray-700 dark:to-gray-600">
        <Image
          src={placeImage}
          alt={place.name_en}
          fill
          className="object-cover"
          unoptimized
        />
        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold capitalize">
          {place.category}
        </div>
        {/* Local Business Badge */}
        {place.is_local_business && (
          <div className="absolute bottom-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Local
          </div>
        )}
        {/* Save Button */}
        <button
          onClick={handleSaveToggle}
          disabled={saving}
          className="absolute top-3 right-3 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 p-2 rounded-full shadow-lg transition-all disabled:opacity-50"
          title={saved ? 'Remove from favorites' : 'Add to favorites'}
        >
          {saved ? (
            <svg className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title and Price */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {place.name_en}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {place.name}
            </p>
          </div>
          {priceText && (
            <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">
              {priceText}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
          {place.description_en}
        </p>

        {/* Features Tags */}
        {place.features && place.features.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {place.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
              >
                {feature.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Specialties */}
        {place.specialties && place.specialties.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-red-500 dark:text-red-400 mb-2 font-bold uppercase tracking-wide">
              Top Picks
            </p>
            
            {/* Menu Images Carousel */}
            {place.specialty_images && place.specialty_images.length > 0 ? (
              <div className="relative">
                {/* Carousel Container */}
                <div className="flex gap-2 overflow-hidden">
                  {place.specialty_images.slice(0, 3).map((imgUrl, index) => (
                    <div
                      key={index}
                      className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 group"
                    >
                      <Image
                        src={imgUrl}
                        alt={place.specialties?.[index] || 'Menu item'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {/* Netflix-style ranking number */}
                      <div className="absolute bottom-0 left-0 w-full h-full flex items-end">
                        <span 
                          className="text-white font-black text-5xl leading-none px-1 pb-0.5"
                          style={{
                            textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 8px rgba(0,0,0,0.8)',
                            WebkitTextStroke: '1px black',
                          }}
                        >
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Menu Names with Numbers */}
                <div className="text-sm text-gray-800 dark:text-gray-200 font-medium mt-2 space-y-1">
                  {place.specialties.slice(0, 3).map((specialty, index) => (
                    <div key={index} className="flex items-start gap-1">
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">{index + 1}:</span>
                      <span>{specialty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Fallback to text only
              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                {place.specialties.slice(0, 2).join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Location Info */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{place.district}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{place.address}</p>
            </div>
          </div>

          {place.opening_hours && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">{place.opening_hours}</p>
            </div>
          )}

          {place.contact && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">{place.contact}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          View on Map
        </a>
      </div>
    </div>
  );
}
