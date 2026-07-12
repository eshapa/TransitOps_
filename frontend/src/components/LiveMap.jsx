import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issues in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom colored icons for status
const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const greenIcon = createCustomIcon('green'); // Moving / Dispatched
const goldIcon = createCustomIcon('gold');   // Delayed / Warning
const greyIcon = createCustomIcon('grey');   // Draft / Completed
const blueIcon = createCustomIcon('blue');   // Hubs / Source

// Dictionary mapping common city/location strings to coordinates (Lat, Lng)
const locationDictionary = {
  // US Cities
  'New York': [40.7128, -74.0060],
  'Los Angeles': [34.0522, -118.2437],
  'Chicago': [41.8781, -87.6298],
  'Houston': [29.7604, -95.3698],
  // India Cities (Top 50 Transport Hubs)
  'Nashik': [20.0110, 73.7909],
  'Pune': [18.5204, 73.8567],
  'Malegaon': [20.5537, 74.5292],
  'Amalner': [21.0455, 75.0594],
  'Mumbai': [19.0760, 72.8777],
  'Delhi': [28.7041, 77.1025],
  'Bengaluru': [12.9716, 77.5946],
  'Hyderabad': [17.3850, 78.4867],
  'Ahmedabad': [23.0225, 72.5714],
  'Ahemedabad': [23.0225, 72.5714], // spelling variation
  'Chennai': [13.0827, 80.2707],
  'Kolkata': [22.5726, 88.3639],
  'Surat': [21.1702, 72.8311],
  'Jaipur': [26.9124, 75.7873],
  'Lucknow': [26.8467, 80.9462],
  'Kanpur': [26.4499, 80.3319],
  'Nagpur': [21.1458, 79.0882],
  'Indore': [22.7196, 75.8577],
  'Thane': [19.2183, 72.9781],
  'Bhopal': [23.2599, 77.4126],
  'Visakhapatnam': [17.6868, 83.2185],
  'Patna': [25.5941, 85.1376],
  'Vadodara': [22.3072, 73.1812],
  'Ghaziabad': [28.6692, 77.4538],
  'Ludhiana': [30.9010, 75.8573],
  'Agra': [27.1767, 78.0081],
  'Faridabad': [28.4089, 77.3178],
  'Meerut': [28.9845, 77.7064],
  'Rajkot': [22.3039, 70.8022],
  'Varanasi': [25.3176, 82.9739],
  'Srinagar': [34.0837, 74.7973],
  'Aurangabad': [19.8762, 75.3433],
  'Dhanbad': [23.7957, 86.4304],
  'Amritsar': [31.6340, 74.8723],
  'Navi Mumbai': [19.0330, 73.0297],
  'Allahabad': [25.4358, 81.8463],
  'Ranchi': [23.3441, 85.3096],
  'Gwalior': [26.2183, 78.1828],
  'Jabalpur': [23.1815, 79.9864],
  'Coimbatore': [11.0168, 76.9558],
  'Vijayawada': [16.5062, 80.6480],
  'Jodhpur': [26.2389, 73.0243],
  'Madurai': [9.9252, 78.1198],
  'Raipur': [21.2514, 81.6296],
  'Kota': [25.2138, 75.8648],
  'Guwahati': [26.1445, 91.7362],
  'Chandigarh': [30.7333, 76.7794],
  // Europe Cities
  'Munich': [48.1351, 11.5820],
  'Berlin': [52.5200, 13.4050],
};

// Helper function to loosely match a location string to our dictionary
const getCoordinates = (locationString) => {
  if (!locationString) return null;
  const lowerLoc = locationString.toLowerCase();
  
  for (const [key, coords] of Object.entries(locationDictionary)) {
    if (lowerLoc.includes(key.toLowerCase())) {
      return coords;
    }
  }
  return null;
};

// Helper to simulate a point along a line between two coordinates (0.0 to 1.0 progress)
const interpolatePosition = (start, end, progress) => {
  return [
    start[0] + (end[0] - start[0]) * progress,
    start[1] + (end[1] - start[1]) * progress
  ];
};

const LiveMap = ({ trips = [], vehicles = [] }) => {
  // Center map on India as default, where most of our data is
  const center = [20.5937, 78.9629];
  const defaultZoom = 5;

  // We only want to track "Dispatched" trips on the live map
  const activeTrips = trips.filter(t => t.status === 'Dispatched');

  const mapElements = activeTrips.map(trip => {
    const startCoords = getCoordinates(trip.source_location);
    const endCoords = getCoordinates(trip.destination_location);
    const vehicle = vehicles.find(v => v.id === trip.vehicle_id);

    if (!startCoords || !endCoords) {
      return null; // Skip if we can't map the location
    }

    // Simulate progress based on actual_distance vs planned_distance
    let progress = 0.5; // default midway
    if (trip.actual_distance && trip.planned_distance && trip.planned_distance > 0) {
      progress = Math.min(trip.actual_distance / trip.planned_distance, 1.0);
    }
    
    // Simulate current vehicle position
    const currentPos = interpolatePosition(startCoords, endCoords, progress);
    
    // Use gold icon if progress seems stuck or delayed (just a simple mock rule: if it's over 80% but not completed, maybe it's delayed)
    const iconToUse = progress > 0.9 ? goldIcon : greenIcon;

    return (
      <React.Fragment key={trip.id}>
        {/* Draw the route line */}
        <Polyline 
          positions={[startCoords, endCoords]} 
          color="#3498db" 
          weight={3} 
          opacity={0.6}
          dashArray="5, 10" 
        />
        
        {/* Hub Markers (Source/Destination) */}
        <Marker position={startCoords} icon={blueIcon}>
          <Popup>
            <div style={{ fontSize: '0.8rem' }}>
              <strong>Source:</strong> {trip.source_location}
            </div>
          </Popup>
        </Marker>
        <Marker position={endCoords} icon={blueIcon}>
          <Popup>
            <div style={{ fontSize: '0.8rem' }}>
              <strong>Destination:</strong> {trip.destination_location}
            </div>
          </Popup>
        </Marker>

        {/* The Live Vehicle Marker */}
        <Marker position={currentPos} icon={iconToUse}>
          <Popup>
            <div style={{ minWidth: '150px' }}>
              <h4 style={{ margin: '0 0 5px 0', color: 'var(--primary-accent)' }}>
                {vehicle ? vehicle.registration_number : `Vehicle #${trip.vehicle_id}`}
              </h4>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                <div><strong>Trip:</strong> {trip.trip_number || `TRIP-${trip.id}`}</div>
                <div><strong>Driver ID:</strong> {trip.driver_id}</div>
                <div><strong>Status:</strong> En Route ({(progress * 100).toFixed(0)}%)</div>
                <div><strong>Progress:</strong> {trip.actual_distance || 0} / {trip.planned_distance || '?'} km</div>
              </div>
            </div>
          </Popup>
        </Marker>
      </React.Fragment>
    );
  });

  return (
    <div className="glass-card" style={{ height: '600px', width: '100%', overflow: 'hidden', position: 'relative', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <MapContainer 
        center={center} 
        zoom={defaultZoom} 
        style={{ height: '100%', width: '100%', background: '#1a1a1a' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ScaleControl position="bottomright" />
        {mapElements}
      </MapContainer>
    </div>
  );
};

export default LiveMap;
