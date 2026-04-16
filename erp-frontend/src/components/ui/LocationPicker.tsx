import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  value?: { lat: number; lng: number };
  onChange: (value: { lat: number; lng: number }) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange }) => {
  const defaultCenter: [number, number] = [30.1575, 71.5249]; // Multan center
  const center = value ? [value.lat, value.lng] as [number, number] : defaultCenter;

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  };

  return (
    <div className="h-64 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapEvents />
        {value && <Marker position={[value.lat, value.lng]} />}
      </MapContainer>
    </div>
  );
};
