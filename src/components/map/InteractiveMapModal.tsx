import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, Navigation, Compass, Check } from 'lucide-react';
import L from 'leaflet';
import { LocationData } from '../../types';

interface InteractiveMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendLocation: (location: LocationData) => void;
  initialLocation?: LocationData;
  isReadOnly?: boolean;
}

export const InteractiveMapModal: React.FC<InteractiveMapModalProps> = ({
  isOpen,
  onClose,
  onSendLocation,
  initialLocation,
  isReadOnly = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLocation?.latitude || 37.7749,
    lng: initialLocation?.longitude || -122.4194,
  });
  const [addressLabel, setAddressLabel] = useState<string>(
    initialLocation?.label || 'San Francisco, California, USA'
  );
  const [isLiveShare, setIsLiveShare] = useState<boolean>(false);
  const [liveDuration, setLiveDuration] = useState<number>(60); // minutes
  const [isLocating, setIsLocating] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Fix leaflet default icon path issues
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const lat = initialLocation?.latitude || 37.7749;
    const lng = initialLocation?.longitude || -122.4194;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap high-contrast tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      className: 'leaflet-dark-tiles',
    }).addTo(map);

    const customMarkerIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: #00d2b4;
          border: 3px solid #0f172a;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0, 210, 180, 0.4);
        ">
          <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker([lat, lng], {
      icon: customMarkerIcon,
      draggable: !isReadOnly,
    }).addTo(map);
    markerRef.current = marker;

    if (!isReadOnly) {
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setCoords({ lat: position.lat, lng: position.lng });
        reverseGeocode(position.lat, position.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [isOpen, initialLocation, isReadOnly]);

  const reverseGeocode = (lat: number, lng: number) => {
    // Generate readable address format
    setAddressLabel(`Near Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setAddressLabel(`Current GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
        }
      },
      () => {
        setIsLocating(false);
        // Fallback default
      },
      { timeout: 8000 }
    );
  };

  const handleConfirm = () => {
    onSendLocation({
      latitude: coords.lat,
      longitude: coords.lng,
      label: addressLabel,
      liveUntil: isLiveShare ? Date.now() + liveDuration * 60 * 1000 : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                {isReadOnly ? 'Location View' : 'Share Location'}
              </h3>
              <p className="text-xs text-slate-400">Interactive OpenStreetMap</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-[360px] bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full" />

          {!isReadOnly && (
            <button
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 bg-slate-900/90 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-medium shadow-lg hover:bg-slate-800 transition-colors"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'My Location'}</span>
            </button>
          )}
        </div>

        {/* Location Details & Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800/80 space-y-3">
          <div className="flex items-start gap-3">
            <Compass className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
            <div className="text-xs">
              <div className="font-medium text-slate-200">{addressLabel}</div>
              <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                Lat: {coords.lat.toFixed(5)} · Lng: {coords.lng.toFixed(5)}
              </div>
            </div>
          </div>

          {!isReadOnly && (
            <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsLiveShare(!isLiveShare)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isLiveShare
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isLiveShare ? 'bg-teal-400 animate-ping' : 'bg-slate-500'}`} />
                  Live Location
                </button>

                {isLiveShare && (
                  <div className="flex items-center gap-1">
                    {[15, 60, 480].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setLiveDuration(mins)}
                        className={`px-2 py-1 text-[11px] rounded transition-colors ${
                          liveDuration === mins
                            ? 'bg-teal-500 text-slate-950 font-semibold'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-teal-500 text-slate-950 rounded-xl hover:bg-teal-400 shadow-md shadow-teal-500/20 active:scale-95 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Send Location</span>
                </button>
              </div>
            </div>
          )}

          {isReadOnly && (
            <div className="flex justify-end pt-1">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30 rounded-xl hover:bg-teal-500/20 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                Open External Navigation
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
