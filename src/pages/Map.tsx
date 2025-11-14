import React, { useRef, useState, Suspense, lazy } from 'react';
import { MapContainer, useMap } from "react-leaflet";
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { mapLayers } from '@/data/mockData';
import { invoke } from '@tauri-apps/api/core';
import RightPanel from '@/components/map/RightPanel';
import { sampleBlocks, type Map3DBlock } from '@/components/map/Map3DOverlay';
import { NodeText } from '@/components/map/node-text';
import MapLayerSelector from '@/components/map/MapLayerSelector';
import '@/components/map/Map.css';
import { X, MapPin } from 'lucide-react';
import 'leaflet-routing-machine';
import polyline from 'polyline';

// Lazy load Map3DOverlay to avoid loading @react-three/fiber until needed
const Map3DOverlay = lazy(() => import('@/components/map/Map3DOverlay'));
const iconUrl = '/marker-icon.png';
const iconRetinaUrl = '/marker-icon-2x.png';
const shadowUrl = '/marker-shadow.png';
// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});
// Interface for map layer configuration
interface MapLayer {
  name: string;
  url: string;
  visible: boolean;
  isHeatmap?: boolean;
  style: {
    strokeColor: string;
    strokeOpacity: number;
    weight: number;
    fillColor: string;
    fillOpacity: number;
  };
}

// TaxiVehicle interface to match the Rust struct
interface TaxiVehicle {
  id: string;
  driver_name: string;
  vehicle_number: string;
  coordinates: [number, number];
  status: string;
  rating: number;
  phone: string;
  vehicle_type: string;
  company?: string;
  bearing?: number;
  icon_url?: string;
  icon_id?: string;
  icon_type?: string;
  icon_group?: string;
}

// Interface for pickup and destination points
interface LocationPoint {
  lat: number;
  lng: number;
  address?: string;
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

const DefaultIcon = L.icon({
  iconUrl: iconUrl,
  iconRetinaUrl: iconRetinaUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;


declare global {
  interface Window {
    geojsonLayer?: L.GeoJSON;
    invokeTaxi?: (taxiId: string) => void;
  }
}

function styles(feature: GeoJSON.Feature | undefined, layerStyle: any): L.PathOptions {
  const props = feature?.properties || {};
  
  // Check if feature has style object
  if (props.style && typeof props.style === 'object') {
    return {
      fillColor: props.style.fillColor || layerStyle.fillColor,
      weight: props.style['stroke-width'] || layerStyle.weight,
      color: props.style.stroke || layerStyle.strokeColor,
      fillOpacity: props.style.fillOpacity || layerStyle.fillOpacity,
      opacity: props.style.stroke ? 1 : layerStyle.strokeOpacity,
      dashArray: props.style.stroke ? "5,10" : undefined,
    };
  }
  
  // Fallback to old style properties (for backward compatibility)
  if (Object.keys(props).length > 0 && (props.fillColor || props.stroke)) {
    return {
      fillColor: props.fillColor || layerStyle.fillColor,
      weight: props['stroke-width'] || layerStyle.weight,
      color: props.stroke || layerStyle.strokeColor,
      fillOpacity: props.fillOpacity || layerStyle.fillOpacity,
      opacity: props.stroke ? 1 : layerStyle.strokeOpacity,
      dashArray: props.stroke ? "5,10" : undefined,
    };
  }
  
  // Use layer default style for features without properties
  return {
    fillColor: layerStyle.fillColor,
    weight: layerStyle.weight,
    color: layerStyle.strokeColor,
    fillOpacity: layerStyle.fillOpacity,
    opacity: layerStyle.strokeOpacity,
  };
}

function highlightFeature(e: L.LeafletMouseEvent) {
  const layer = e.target as L.Path;
  // Only apply highlighting to path objects (GeoJSON features), not markers
  if (layer.setStyle && typeof layer.setStyle === 'function') {
    layer.setStyle({
      weight: 2,
      color: 'black',
      dashArray: '5',
    });
  }
}

function resetHighlight(e: L.LeafletMouseEvent) {
  const layer = e.target as L.Path;
  const feature = (layer as any).feature;
  
  // Only apply reset highlighting to path objects (GeoJSON features), not markers
  if (feature && window.geojsonLayer && layer.setStyle && typeof layer.setStyle === 'function') {
    // Find the layer style from mapLayers
    const layerStyle = mapLayers.find(layer => layer.name === 'Blocks')?.style || {} as L.PathOptions;
    
    // Reapply the original styling with custom properties
    const props = feature.properties || {};
    
    // Check if feature has style object
    if (props.style && typeof props.style === 'object') {
      layer.setStyle({
        fillColor: props.style.fillColor || layerStyle.fillColor,
        weight: props.style['stroke-width'] || layerStyle.weight,
        color: props.style.stroke || (layerStyle as any).strokeColor,
        fillOpacity: props.style.fillOpacity || layerStyle.fillOpacity,
        opacity: props.style.stroke ? 1 : (layerStyle as any).strokeOpacity,
        dashArray: props.style.stroke ? "5,10" : undefined,
      });
    } else if (Object.keys(props).length > 0 && (props.fillColor || props.stroke)) {
      // Fallback to old style properties
      layer.setStyle({
        fillColor: props.fillColor || layerStyle.fillColor,
        weight: props['stroke-width'] || layerStyle.weight,
        color: props.stroke || (layerStyle as any).strokeColor,
        fillOpacity: props.fillOpacity || layerStyle.fillOpacity,
        opacity: props.stroke ? 1 : (layerStyle as any).strokeOpacity,
        dashArray: props.stroke ? "5,10" : undefined,
      });
    } else {
      // Use layer default style for features without properties
      layer.setStyle({
        fillColor: layerStyle.fillColor,
        weight: layerStyle.weight,
        color: (layerStyle as any).strokeColor,
        fillOpacity: layerStyle.fillOpacity,
        opacity: (layerStyle as any).strokeOpacity,
      });
    }
  }
}


function zoomToFeature(e: L.LeafletMouseEvent | L.Layer, setSelectedFeature: (feature: any) => void) {
  let layer: L.Layer;
  if ((e as L.LeafletMouseEvent).target) {
    layer = (e as L.LeafletMouseEvent).target;
  } else {
    layer = e as L.Layer;
  }
  const map = (layer as any)._map;
  if (!map) return;
  // @ts-ignore
  const bounds = layer.getBounds();
  map.flyToBounds(bounds, { padding: [50, 50] });

  const feature = (layer as any).feature;
  const properties = feature.properties || {};
  
  // Set the selected feature for the right panel
  setSelectedFeature(properties);

  const { name, building_name } = properties;

  const template = `
    <div class="simple-popup">
      <h3>${building_name || name || "Building"}</h3>
    </div>`;
  
  (layer as any).bindPopup(template, {
    maxWidth: 350,
    className: 'custom-popup'
  }).openPopup();
}

// Create pickup marker icon
function createPickupIcon(): L.DivIcon {
  return L.divIcon({
    html: `
      <div style="
        background-color: #22c55e;
        border: 3px solid white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="color: white; font-weight: bold;">P</div>
      </div>
    `,
    className: 'pickup-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
}

// Create destination marker icon
function createDestinationIcon(): L.DivIcon {
  return L.divIcon({
    html: `
      <div style="
        background-color: #ef4444;
        border: 3px solid white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="color: white; font-weight: bold;">D</div>
      </div>
    `,
    className: 'destination-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
}

function createTaxiIcon(taxi: TaxiVehicle): L.DivIcon {
  if (taxi.icon_url) {
    // Use custom icon with rotation based on bearing
    const rotation = taxi.bearing ? `transform: rotate(${taxi.bearing}deg);` : '';
    
    return L.divIcon({
      html: `<img src="${taxi.icon_url}" style="width: 32px; height: 32px; object-fit: contain; ${rotation}" />`,
      className: 'taxi-marker',
      iconSize: taxi.icon_group === 'motorbike' ? [28, 28] : [32, 32],
      iconAnchor: taxi.icon_group === 'motorbike' ? [14, 14] : [16, 16],
      popupAnchor: [0, taxi.icon_group === 'motorbike' ? -14 : -16]
    });
  }

  // Fallback to emoji-based markers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#22c55e'; // green
      case 'busy': return '#f59e0b'; // orange
      case 'offline': return '#6b7280'; // gray
      default: return '#22c55e';
    }
  };

  const getVehicleIcon = (vehicleType: string, iconType?: string) => {
    // Use icon_type if available, otherwise fall back to vehicle_type
    const type = iconType || vehicleType;
    
    switch (type.toLowerCase()) {
      case 'premium': return '🚗';
      case 'xl': return '🚐';
      case 'boda': return '🏍️';
      case 'motorbike': return '🏍️';
      case 'bajaji': return '🛺';
      case 'electric': return '🛵';
      default: return '🚕';
    }
  };

  const color = getStatusColor(taxi.status);
  const icon = getVehicleIcon(taxi.vehicle_type, taxi.icon_type);

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${icon}
        ${taxi.status === 'available' ? '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background-color: #22c55e; border-radius: 50%; border: 2px solid white;"></div>' : ''}
      </div>
    `,
    className: 'taxi-marker',
    iconSize: [35, 35],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
}

function zoomToTaxi(e: L.LeafletMouseEvent, setSelectedFeature: (feature: any) => void) {
  const layer = e.target as L.Marker;
  const taxi = (layer as any).taxiData as TaxiVehicle;
  
  // Only handle taxi markers, not GeoJSON features
  if (!taxi || !layer.getLatLng) return;

  const map = (layer as any)._map;
  if (!map) return;

  map.flyTo(taxi.coordinates, 18);

  // Set the selected feature for the right panel
  setSelectedFeature(taxi);

  const template = `
    <div class="taxi-popup">
      <h3>${taxi.driver_name}</h3>
      <p><strong>Vehicle:</strong> ${taxi.vehicle_number}</p>
      <p><strong>Company:</strong> ${taxi.company ? taxi.company.toUpperCase() : 'LOCAL'}</p>
      <p><strong>Type:</strong> ${taxi.icon_type ? taxi.icon_type.toUpperCase() : taxi.vehicle_type.toUpperCase()}</p>
      ${taxi.icon_group ? `<p><strong>Category:</strong> ${taxi.icon_group.toUpperCase()}</p>` : ''}
      <p><strong>Status:</strong> <span style="color: ${taxi.status === 'available' ? '#22c55e' : taxi.status === 'busy' ? '#f59e0b' : '#6b7280'}">${taxi.status.toUpperCase()}</span></p>
      <p><strong>Rating:</strong> ⭐ ${taxi.rating}</p>
      ${taxi.phone ? `<p><strong>Phone:</strong> ${taxi.phone}</p>` : ''}
      ${taxi.bearing ? `<p><strong>Direction:</strong> ${Math.round(taxi.bearing)}°</p>` : ''}
      ${taxi.icon_id ? `<p><strong>Icon ID:</strong> ${taxi.icon_id}</p>` : ''}
      ${taxi.status === 'available' ? '<button onclick="invokeTaxi(\'' + taxi.id + '\')" style="background: #22c55e; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 8px;">Book Now</button>' : ''}
    </div>`;
  
  layer.bindPopup(template, {
    maxWidth: 300,
    className: 'taxi-popup-custom'
  }).openPopup();
}

const GeoJSONLayer: React.FC<{ setSelectedFeature: (feature: any) => void }> = ({ setSelectedFeature }) => {
  const map = useMap();
  const currentGeojsonLayerRef = React.useRef<L.GeoJSON | null>(null);
  const layerControlRef = React.useRef<L.Control.Layers | null>(null);
  
  React.useEffect(() => {
    return () => {
      if (currentGeojsonLayerRef.current) {
        map.removeLayer(currentGeojsonLayerRef.current);
        currentGeojsonLayerRef.current = null;
        if (window.geojsonLayer === currentGeojsonLayerRef.current) {
          window.geojsonLayer = undefined;
        }
      }
      if (layerControlRef.current) {
        map.removeControl(layerControlRef.current);
        layerControlRef.current = null;
      }
    };
  }, [map]);

  React.useEffect(() => {
    if (!map) return;
    
    // Load all GeoJSON layers
    const loadLayers = async () => {
      const overlayMaps: Record<string, L.Layer> = {};
      const layerRefs: L.Layer[] = [];
      const regularLayers: L.Layer[] = [];

      // First pass: load regular layers
      for (let i = mapLayers.length - 1; i >= 0; i--) {
        const layer: MapLayer = mapLayers[i];
        const { name, url, style, visible } = layer;
        
        console.log(`Loading layer: ${name}, visible: ${visible}`);
        
        // Only load visible layers
        if (!visible) {
          console.log(`Skipping ${name} - not visible`);
          continue;
        }
        
        try {
          console.log(`Fetching ${name} from ${url}`);
          const res = await fetch(url);
          if (!res.ok) {
            console.error(`Failed to fetch ${name}: ${res.status}`);
            continue;
          }
          const data = await res.json();
          console.log(`Loaded ${name} data:`, data);
          
          let geoLayer: L.GeoJSON;
          
          // Create regular GeoJSON layer
          geoLayer = L.geoJSON(data, {
            style: (feature) => styles(feature, style),
            interactive: true,
            onEachFeature: function onEachFeature(feature, layer) {
              // Only add interactions for features with properties and ensure it's a path object
              if (feature.properties && Object.keys(feature.properties).length > 0 && (layer as any).setStyle) {
                layer.on({
                  mouseover: highlightFeature,
                  mouseout: resetHighlight,
                  click: (e) => zoomToFeature(e, setSelectedFeature),
                });
              }
            },
          });
          
          // Add regular layer immediately
          console.log(`Adding ${name} to map`);
          geoLayer.addTo(map);
          regularLayers.push(geoLayer);
          
          overlayMaps[name] = geoLayer;
          layerRefs.push(geoLayer);
          
          // Set the first layer as the global reference for resetStyle
          if (i === 0) { // Changed from mapLayers.length - 1 to i === 0
            window.geojsonLayer = geoLayer;
          }

          // --- ROUTE DRAWING LOGIC REMOVED ---
        } catch (e) {
          console.error(`Failed to load ${name}:`, e);
        }
      }
      
      // Fit bounds to topmost layer
      if (layerRefs.length > 0) {
        try {
          const bounds = (layerRefs[0] as L.GeoJSON).getBounds();
          if (bounds.isValid()) map.fitBounds(bounds.pad(0.2));
        } catch {}
      }

      // Layer control removed - no longer showing on map
    };

    loadLayers();
  }, [map, setSelectedFeature]);

  return null;
};

const TileLayerComponent: React.FC<{ selectedLayer?: string }> = ({ selectedLayer = 'Google Street' }) => {
  const map = useMap();
  const currentLayerRef = React.useRef<L.TileLayer | null>(null);
  
  React.useEffect(() => {
    // Remove existing layer
    if (currentLayerRef.current) {
      map.removeLayer(currentLayerRef.current);
      currentLayerRef.current = null;
    }

    let newLayer: L.TileLayer;

    // Create tile layer based on selection
    switch (selectedLayer) {
      case 'Google Street':
        newLayer = L.tileLayer(
          'https://tiles.stadiamaps.com/tiles/stamen_terrain_lines/{z}/{x}/{y}{r}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            minZoom: 12,
            maxZoom: 19,
            opacity: 0.8
          }
        );
        break;
      case 'Google Satellite':
        newLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19,
            opacity: 1.0
          }
        );
        break;
      case 'Jigaw Street':
        newLayer = L.tileLayer(
          'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=47c287e79a6a4fc4829bc578954a75d2',
          {
            attribution: 'Tiles &copy; Thunderforest',
            maxZoom: 19,
            opacity: 1.0
          }
        );
        break;
      case 'Jigaw Satellite':
        newLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19,
            opacity: 0.7
          }
        );
        break;
      case 'OpenStreetMap':
        newLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            opacity: 1.0
          }
        );
        break;
      default:
        newLayer = L.tileLayer(
          'https://tiles.stadiamaps.com/tiles/stamen_terrain_lines/{z}/{x}/{y}{r}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            minZoom: 12,
            maxZoom: 19,
            opacity: 0.8
          }
        );
    }

    // Add new layer
    newLayer.addTo(map);
    currentLayerRef.current = newLayer;

    return () => {
      if (currentLayerRef.current) {
        map.removeLayer(currentLayerRef.current);
        currentLayerRef.current = null;
      }
    };
  }, [map, selectedLayer]);

  return null;
};

const TaxiLayer: React.FC<{ setSelectedFeature: (feature: any) => void, onTaxiSelect: (id: string) => void }> = ({ setSelectedFeature, onTaxiSelect }) => {
  const map = useMap();
  const taxiMarkersRef = React.useRef<L.Marker[]>([]);
  const [taxis, setTaxis] = React.useState<TaxiVehicle[]>([]);
  const [currentZoom, setCurrentZoom] = React.useState<number>(map.getZoom());

  React.useEffect(() => {
    if (!map) return;
    let intervalId: NodeJS.Timeout;
    let isUnmounted = false;

    const fetchTaxis = async () => {
      try {
        const taxiData = await invoke<TaxiVehicle[]>('get_taxi_vehicles');
        if (!isUnmounted) {
          if (Array.isArray(taxiData)) {
            setTaxis(taxiData);
          } else {
            setTaxis([]);
          }
        }
      } catch (error) {
        if (!isUnmounted) setTaxis([]);
      }
    };

    // Initial fetch
    fetchTaxis();
    // Polling every 3 seconds
    intervalId = setInterval(fetchTaxis, 3000);

    // Add zoom event listener
    const handleZoom = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);
    };

    map.on('zoom', handleZoom);
    // Set initial zoom
    setCurrentZoom(map.getZoom());

    return () => {
      isUnmounted = true;
      clearInterval(intervalId);
      map.off('zoom', handleZoom);
    };
  }, [map]);
  
  React.useEffect(() => {
    if (!map || taxis.length === 0) return;
    
    // Set up global invoke function
    window.invokeTaxi = (taxiId: string) => {
      const taxi = taxis.find(t => t.id === taxiId);
      if (taxi) {
        console.log(`Invoking taxi booking for: ${taxi.driver_name} (${taxi.vehicle_number})`);
        alert(`Booking ${taxi.vehicle_type.toUpperCase()} with ${taxi.driver_name}!\nVehicle: ${taxi.vehicle_number}\nPhone: ${taxi.phone}`);
        
        // Here you would typically call your Tauri command or API
        // invoke('book_taxi', { taxiId: taxi.id, driverName: taxi.driver_name });
      }
    };
    
    // Only show markers when zoom level is 15-20
    const shouldShowMarkers = currentZoom >= 14 && currentZoom <= 20;
    console.log(`Current zoom: ${currentZoom}, should show markers: ${shouldShowMarkers}`);
    
    // Create markers for each taxi (only if zoom level is appropriate)
    const markers: L.Marker[] = [];
    
    if (shouldShowMarkers) {
      taxis.forEach((taxi) => {
        const icon = createTaxiIcon(taxi);
        const marker = L.marker(taxi.coordinates, { icon });
        
        // Store taxi data on the marker
        (marker as any).taxiData = taxi;
        
        // Add click event
        marker.on('click', (e) => {
          setSelectedFeature(taxi);
          if (onTaxiSelect) onTaxiSelect(taxi.id);
          zoomToTaxi(e, setSelectedFeature);
        });
        
        // Add to map
        marker.addTo(map);
        markers.push(marker);
      });
    }
    
    taxiMarkersRef.current = markers;
    
    // Cleanup function
    return () => {
      markers.forEach(marker => {
        map.removeLayer(marker);
      });
      taxiMarkersRef.current = [];
      // Clean up global function
      delete window.invokeTaxi;
    };
  }, [map, taxis, setSelectedFeature, currentZoom, onTaxiSelect]);

  return null;
};

// ZoomLevelControl displays the map zoom in a fixed overlay
const ZoomLevelControl: React.FC = () => {
  const map = useMap();
  const [zoom, setZoom] = React.useState(map.getZoom());
  React.useEffect(() => {
    const update = () => setZoom(map.getZoom());
    map.on('zoom', update);
    return () => { map.off('zoom', update); };
  }, [map]);
  return (
    <div style={{
      position: 'absolute',
      top: 14,
      right: 20,
      background: 'rgba(34,34,34,0.85)',
      color: 'white',
      borderRadius: 8,
      padding: '4px 12px',
      fontSize: 16,
      fontWeight: 'bold',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      pointerEvents: 'none',
      zIndex: 1200
    }}>Zoom: {zoom}</div>
  );
};

const PickupDestinationLayer: React.FC<{
  pickup: LocationPoint | null;
  destination: LocationPoint | null;
  onSetPickup: (point: LocationPoint) => void;
  onSetDestination: (point: LocationPoint) => void;
  openPickupPopup: number;
  openDestinationPopup: number;
}> = ({ pickup, destination, onSetPickup, onSetDestination, openPickupPopup, openDestinationPopup }) => {
  const map = useMap();
  const pickupMarkerRef = React.useRef<L.Marker | null>(null);
  const destinationMarkerRef = React.useRef<L.Marker | null>(null);
  const routeLineRef = React.useRef<L.Polyline | null>(null);

  React.useEffect(() => {
    if (!map) return;

    // Clear existing markers and route
    if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      map.removeLayer(destinationMarkerRef.current);
      destinationMarkerRef.current = null;
    }
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    // Add pickup marker
    if (pickup) {
      const pickupIcon = createPickupIcon();
      const marker = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon });
      marker.bindPopup(`
        <div style="text-align: center;">
          <h3 style="margin: 0 0 8px 0; color: #22c55e;">📍 Pickup Location</h3>
          <p style="margin: 0; font-size: 14px;">${pickup.address || 'Selected location'}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
            ${pickup.lat.toFixed(6)}, ${pickup.lng.toFixed(6)}
          </p>
        </div>
      `);
      marker.addTo(map);
      pickupMarkerRef.current = marker;
    }

    // Add destination marker
    if (destination) {
      const destinationIcon = createDestinationIcon();
      const marker = L.marker([destination.lat, destination.lng], { icon: destinationIcon });
      marker.bindPopup(`
        <div style="text-align: center;">
          <h3 style="margin: 0 0 8px 0; color: #ef4444;">🎯 Destination</h3>
          <p style="margin: 0; font-size: 14px;">${destination.address || 'Selected location'}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
            ${destination.lat.toFixed(6)}, ${destination.lng.toFixed(6)}
          </p>
        </div>
      `);
      marker.addTo(map);
      destinationMarkerRef.current = marker;
    }

    // Route line drawing removed - handled by RoutePlanLayer

    // Fit map to show both points if both markers exist
    if (pickup && destination && pickupMarkerRef.current && destinationMarkerRef.current) {
      const group = new L.FeatureGroup([pickupMarkerRef.current, destinationMarkerRef.current]);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      if (pickupMarkerRef.current) {
        map.removeLayer(pickupMarkerRef.current);
      }
      if (destinationMarkerRef.current) {
        map.removeLayer(destinationMarkerRef.current);
      }
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
      }
    };
  }, [map, pickup, destination]);

  React.useEffect(() => {
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const point: LocationPoint = { lat, lng };

      // If no pickup set, set pickup
      if (!pickup) {
        onSetPickup(point);
      }
      // If pickup set but no destination, set destination
      else if (!destination) {
        onSetDestination(point);
      }
      // If both set, replace pickup (start new route)
      else {
        onSetPickup(point);
        // Note: We can't set destination to null directly, so we'll handle this in the parent component
      }
    };

    // map.on('click', handleMapClick); // Removed map click listener

    return () => {
      // map.off('click', handleMapClick); // Removed map click listener
    };
  }, [map, pickup, destination, onSetPickup, onSetDestination]);

  React.useEffect(() => {
    if (pickupMarkerRef.current && pickup) {
      pickupMarkerRef.current.openPopup();
    }
    // eslint-disable-next-line
  }, [openPickupPopup]);
  React.useEffect(() => {
    if (destinationMarkerRef.current && destination) {
      destinationMarkerRef.current.openPopup();
    }
    // eslint-disable-next-line
  }, [openDestinationPopup]);

  return null;
};

// MOCK: Replace with a real Bolt/Taxi API request
async function getRideOptions(pickup: LocationPoint, destination: LocationPoint) {
  // Demo polyline for Dar es Salaam area
  return {
    data: {
      routes: {
        taxi: [
          [
            { points: '_seK_EgmiSwC{KqEyIoJuMkOurBqC`BkAaGc@sA{BwKaAmK' }
          ]
        ]
      }
    }
  };
}

const RoutePlanLayer: React.FC<{
  pickup: LocationPoint | null,
  destination: LocationPoint | null
}> = ({ pickup, destination }) => {
  const map = useMap();
  const routingRef = React.useRef<any>(null);
  const polylineLayerRef = React.useRef<L.Polyline | null>(null);
  // NEW REFS FOR MARKERS
  const pickupMarkerRef = React.useRef<L.Marker | null>(null);
  const destinationMarkerRef = React.useRef<L.Marker | null>(null);

  React.useEffect(() => {
    if (!pickup || !destination || !map) return;
    let cancelled = false;
    let newRouting = null;

    // --- Remove any old layers/control ---
    if (routingRef.current) {
      map.removeControl(routingRef.current);
      routingRef.current = null;
    }
    if (polylineLayerRef.current) {
      map.removeLayer(polylineLayerRef.current);
      polylineLayerRef.current = null;
    }
    if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      map.removeLayer(destinationMarkerRef.current);
      destinationMarkerRef.current = null;
    }

    // --- Add Markers for Pickup and Destination ---
    const pickupIcon = createPickupIcon();
    const destinationIcon = createDestinationIcon();
    pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(map);
    destinationMarkerRef.current = L.marker([destination.lat, destination.lng], { icon: destinationIcon }).addTo(map);

    (async () => {
      try {
        const rideOptions = await getRideOptions(pickup, destination);
        let routePoints: any[] = [];
        let encoded = null;
        if (rideOptions?.data?.routes?.taxi?.[0]?.[0]?.points) {
          encoded = rideOptions.data.routes.taxi[0][0].points;
          routePoints = polyline.decode(encoded).map(([lat, lng]: [number, number]) => L.latLng(lat, lng));
        }
        if (routePoints.length > 0) {

          // OSRM Routing if no polyline; else custom router using polyline
          newRouting = L.Routing.control({
            waypoints: [
              L.latLng(pickup.lat, pickup.lng),
              L.latLng(destination.lat, destination.lng)
            ],
            routeWhileDragging: true,
            addWaypoints: true,
            draggableWaypoints: true,
            fitSelectedRoutes: true,
            showAlternatives: true,
            suppressDemoServerWarning: false,
            lineOptions: {
              styles: [{ color: '#34BB78', opacity: 0.8, weight: 12 }]
            },
            createMarker: function() { return null; },
            router: encoded ? L.Routing.osrmv1({
              serviceUrl: 'http://router.project-osrm.org/route/v1',
              profile: 'driving',
              polyline: routePoints,
              overview: true,
              alternatives: true,
              steps: true,
              hints: true,
              buildRouteUrl: function(waypoints, options) {
                // Replace default waypoints with your encoded polyline route
                console.log('Route points:', routePoints);
                return `http://router.project-osrm.org/route/v1/driving/polyline(${routePoints})?overview=false`;
              }
            }) : undefined
          })
          .on('routingerror', function(e) {
            console.error('Routing error:', e.error);
          })
          .addTo(map);
          routingRef.current = newRouting;
        }
      } catch (e) {
        console.error('Error fetching/planning route:', e);
      }
    })();
    // Cleanup
    return () => {
      if (routingRef.current) {
        map.removeControl(routingRef.current);
        routingRef.current = null;
      }
      if (polylineLayerRef.current) {
        map.removeLayer(polylineLayerRef.current);
        polylineLayerRef.current = null;
      }
      if (pickupMarkerRef.current) {
        map.removeLayer(pickupMarkerRef.current);
        pickupMarkerRef.current = null;
      }
      if (destinationMarkerRef.current) {
        map.removeLayer(destinationMarkerRef.current);
        destinationMarkerRef.current = null;
      }
    };
  }, [pickup, destination, map]);

  return null;
};

const MapPage: React.FC = () => {
  const mapRef = useRef<L.Map>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [pickup, setPickup] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(16);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.771, 39.240]);
  const [show3DBlocks, setShow3DBlocks] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [pickupResults, setPickupResults] = useState<any[]>([]);
  const [destinationResults, setDestinationResults] = useState<any[]>([]);
  const [showPickupResults, setShowPickupResults] = useState<boolean>(false);
  const [showDestinationResults, setShowDestinationResults] = useState<boolean>(false);
  const [isSearchingPickup, setIsSearchingPickup] = useState<boolean>(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState<boolean>(false);
  const [pickupPopupKey, setPickupPopupKey] = useState(0);
  const [destinationPopupKey, setDestinationPopupKey] = useState(0);
  const [pickupSearch, setPickupSearch] = useState<string>('');
  const [destinationSearch, setDestinationSearch] = useState<string>('');
  const [activeTaxiId, setActiveTaxiId] = useState<string|null>(null);
  const [selectedMapLayer, setSelectedMapLayer] = useState<string>('Google Street');


  const handleFeatureSelect = (feature: any) => {
    setSelectedFeature(feature);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedFeature(null);
  };

  const handleSetPickup = (point: LocationPoint, label?: string) => {
    setPickup(point);
    // Update the input text to the selected label if provided
    if (label) {
      setPickupSearch(label);
    } else if (point.address) {
      setPickupSearch(point.address);
    }
  };

  const handleSetDestination = (point: LocationPoint, label?: string) => {
    setDestination(point);
    // Update the input text to the selected label if provided
    if (label) {
      setDestinationSearch(label);
    } else if (point.address) {
      setDestinationSearch(point.address);
    }
  };

  const handleClearPoints = () => {
    setPickup(null);
    setDestination(null);
    setPickupSearch('');
    setDestinationSearch('');
  };

  const handleMapMove = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      setMapCenter([center.lat, center.lng]);
      setCurrentZoom(mapRef.current.getZoom());
    }
  };

  const handleBlockClick = (block: Map3DBlock) => {
    console.log('3D Block clicked:', block);
    setSelectedFeature({
      ...block,
      type: '3d_block',
      name: block.label || `Block ${block.id}`,
      building_type: block.buildingType
    });
    setIsPanelOpen(true);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await invoke<string>('get_location_suggestions', { searchString: query });
      console.log('Raw response from Rust:', response);
      
      // Check if response looks like valid JSON
      if (response.trim().startsWith('{') || response.trim().startsWith('[')) {
        const data = JSON.parse(response);
        
        if (data.data && data.data.suggestions && Array.isArray(data.data.suggestions)) {
          setSearchResults(data.data.suggestions);
          setShowSearchResults(true);
        } else {
          console.log('No suggestions found in response:', data);
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } else {
        console.error('Invalid JSON response:', response);
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePickupSearch = async (query: string) => {
    if (!query.trim()) {
      setPickupResults([]);
      setShowPickupResults(false);
      return;
    }

    setIsSearchingPickup(true);
    try {
      const response = await invoke<string>('get_location_suggestions', { searchString: query });
      
      if (response.trim().startsWith('{') || response.trim().startsWith('[')) {
        const data = JSON.parse(response);
        
        if (data.data && data.data.suggestions && Array.isArray(data.data.suggestions)) {
          setPickupResults(data.data.suggestions);
          setShowPickupResults(true);
        } else {
          setPickupResults([]);
          setShowPickupResults(false);
        }
      } else {
        setPickupResults([]);
        setShowPickupResults(false);
      }
    } catch (error) {
      console.error('Error searching pickup locations:', error);
      setPickupResults([]);
      setShowPickupResults(false);
    } finally {
      setIsSearchingPickup(false);
    }
  };

  const handleDestinationSearch = async (query: string) => {
    if (!query.trim()) {
      setDestinationResults([]);
      setShowDestinationResults(false);
      return;
    }

    setIsSearchingDestination(true);
    try {
      const response = await invoke<string>('get_location_suggestions', { searchString: query });
      
      if (response.trim().startsWith('{') || response.trim().startsWith('[')) {
        const data = JSON.parse(response);
        
        if (data.data && data.data.suggestions && Array.isArray(data.data.suggestions)) {
          setDestinationResults(data.data.suggestions);
          setShowDestinationResults(true);
        } else {
          setDestinationResults([]);
          setShowDestinationResults(false);
        }
      } else {
        setDestinationResults([]);
        setShowDestinationResults(false);
      }
    } catch (error) {
      console.error('Error searching destination locations:', error);
      setDestinationResults([]);
      setShowDestinationResults(false);
    } finally {
      setIsSearchingDestination(false);
    }
  };

  const handleSearchResultClick = (result: any) => {
    if (result.lat && result.lng) {
      const location: LocationPoint = {
        lat: result.lat,
        lng: result.lng,
        address: result.full_address || result.address_name || result.address_extra
      };
      
      // Set as pickup if no pickup is set, otherwise set as destination
      if (!pickup) {
        handleSetPickup(location);
      } else if (!destination) {
        handleSetDestination(location);
      } else {
        // If both are set, replace pickup
        handleSetPickup(location);
      }
      
      // Center map on the selected location
      if (mapRef.current) {
        mapRef.current.flyTo([result.lat, result.lng], 18);
      }
    }
    
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handlePickupResultClick = (result: any) => {
    if (result.lat && result.lng) {
      const label = result.address_name || result.full_address || result.address_extra;
      const location: LocationPoint = { lat: result.lat, lng: result.lng, address: label };
      handleSetPickup(location, label);
      setPickupPopupKey(k => k + 1);
      if (mapRef.current) mapRef.current.flyTo([result.lat, result.lng], 18);
    }
    setShowPickupResults(false);
  };

  const handleDestinationResultClick = (result: any) => {
    if (result.lat && result.lng) {
      const label = result.address_name || result.full_address || result.address_extra;
      const location: LocationPoint = { lat: result.lat, lng: result.lng, address: label };
      handleSetDestination(location, label);
      setDestinationPopupKey(k => k + 1);
      if (mapRef.current) mapRef.current.flyTo([result.lat, result.lng], 18);
    }
    setShowDestinationResults(false);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };



  // Close search results when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container') && 
          !target.closest('.pickup-search-container') && 
          !target.closest('.destination-search-container')) {
        setShowSearchResults(false);
        setShowPickupResults(false);
        setShowDestinationResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="w-full bg-[#fafaff] h-[calc(100vh-4rem)] relative p-4">
                  {/* Grid lines overlay */}
                  <div className="absolute -z-50 inset-0 bg-[linear-gradient(to_right,#1a1a1a,transparent_1px),linear-gradient(to_bottom,#1a1a1a33_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      {/* Search Bar */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[1000] search-container w-96 max-w-[calc(100vw-3rem)]">
        <div className="relative">

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className=" bottom-full left-50 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto z-[1001]">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleSearchResultClick(result)}
                  className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-shrink-0 mr-3">
                    {result.image?.url ? (
                      <img 
                        src={result.image.url} 
                        alt={result.place_type || 'location'} 
                        className="w-4 h-4 object-contain"
                      />
                    ) : (
                      <MapPin className="w-4 h-4 text-blue-500" />
                    )}
        </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.address_name || result.full_address || 'Unknown location'}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate">
                        {result.address_extra || result.full_address}
                      </p>
                      {result.trailing_label && (
                        <span className="text-xs text-blue-600 font-medium ml-2">
                          {result.trailing_label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* No Results */}
          {showSearchResults && searchResults.length === 0 && searchQuery.trim() && !isSearching && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-[1001]">
              <p className="text-sm text-gray-500 text-center">No locations found</p>
            </div>
          )}
          
          {/* Loading Indicator */}
          {isSearching && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-[1001]">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                <p className="text-sm text-gray-500">Searching...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Layer Selector - Bottom Right */}
      <div className="absolute bottom-6 right-6 z-[1000]">
        <MapLayerSelector 
          onLayerChange={(layer) => {
            console.log('Selected map layer:', layer);
            setSelectedMapLayer(layer);
          }}
          className="w-96 h-32"
        />
      </div>

      {/* Pickup and Destination Search */}
      <div className="absolute bottom-6 left-6 z-[1000] max-w-xs flex flex-col gap-4">
        {/* Pickup Search */}
        <div className="relative pickup-search-container">
          <NodeText
            value={pickupSearch}
            onChange={handleSearchInputChange}
            placeholder="Please search for the place..."
            label="Pickup Location"
            placeholderIcon={<MapPin className="w-4 h-4" />}
            charLimit={100}
            className="bg-white shadow-lg"
            showCounters={false}
            showTopBar={true}
            disabled={false}
          />

        </div>
        {/* Destination Search */}
        <div className="relative destination-search-container">
          <NodeText
            value={destinationSearch}
            onChange={handleSearchInputChange}
            placeholder="Please search for the place..."
            label="Dropoff Location"
            placeholderIcon={<MapPin className="w-4 h-4" />}
            charLimit={100}
            className="bg-white shadow-lg"
            showCounters={false}
            showTopBar={true}
            disabled={false}
          />

        </div>
        {/* Control Buttons */}
        <div className="flex flex-row gap-2">
          {(pickup || destination) && (
            <button
              onClick={handleClearPoints}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Route
            </button>
          )}
          <button
            onClick={() => setShow3DBlocks(!show3DBlocks)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              show3DBlocks 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            <span className="text-lg">🏢</span>
            {show3DBlocks ? 'Hide 3D Blocks' : 'Show 3D Blocks'}
          </button>
        </div>
      </div>

      <MapContainer
        center={[-6.771, 39.240]}
        zoom={16}
        maxZoom={19}
        minZoom={12}
        className="w-full h-full rounded-lg shadow-lg"
        zoomControl={true}
        attributionControl={false}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        dragging={true}
        ref={mapRef as any}
        whenReady={() => {
          if (mapRef.current) {
            mapRef.current.on('moveend', handleMapMove);
            mapRef.current.on('zoomend', handleMapMove);
            handleMapMove(); // Initial call
          }
        }}
      >
        <TileLayerComponent selectedLayer={selectedMapLayer} />
        <GeoJSONLayer setSelectedFeature={handleFeatureSelect} />
        <TaxiLayer setSelectedFeature={handleFeatureSelect} onTaxiSelect={setActiveTaxiId} />
        {/* 1. Markers are handled in PickupDestinationLayer */}
        {/* 2. Route is handled using Bolt polyline in RoutePlanLayer */}
        {/* These are both rendered inside your MapContainer so that marker and route overlays never interfere. */}
        {/* */}
        {/* Place like this inside your MapContainer: */}
        {/* <PickupDestinationLayer */}
        {/*   pickup={pickup} */}
        {/*   destination={destination} */}
        {/*   onSetPickup={handleSetPickup} */}
        {/*   onSetDestination={handleSetDestination} */}
        {/* /> */}
        {/* <RoutePlanLayer pickup={pickup} destination={destination} /> */}
        {/* ...other overlays... */}
        <PickupDestinationLayer
          pickup={pickup}
          destination={destination}
          onSetPickup={handleSetPickup}
          onSetDestination={handleSetDestination}
          openPickupPopup={pickupPopupKey}
          openDestinationPopup={destinationPopupKey}
        />
        <RoutePlanLayer pickup={pickup} destination={destination} />
        {/* TaxiRouteLayer shows route from LIVE taxi to pickup */}
        <TaxiRouteLayer
          activeTaxiId={activeTaxiId}
          pickup={pickup}
        />
        <ZoomLevelControl />
      </MapContainer>
      
      {/* 3D Blocks Overlay */}
      {show3DBlocks && (
        <Suspense fallback={null}>
          <Map3DOverlay
            blocks={sampleBlocks}
            mapCenter={mapCenter}
            mapZoom={currentZoom}
            onBlockClick={handleBlockClick}
            className="z-[500]"
          />
        </Suspense>
      )}
      
      <RightPanel 
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        selectedFeature={selectedFeature}
      />
    </div>
  );
};

export default MapPage;

// New TaxiRouteLayer component
const TaxiRouteLayer: React.FC<{ activeTaxiId: string | null, pickup: LocationPoint | null }> = ({ activeTaxiId, pickup }) => {
  const map = useMap();
  const [taxi, setTaxi] = React.useState<TaxiVehicle | null>(null);
  const [routeControl, setRouteControl] = React.useState<any>(null);

  React.useEffect(() => {
    if (!activeTaxiId || !pickup) {
      if (routeControl) {
        map.removeControl(routeControl);
        setRouteControl(null);
      }
      return;
    }
    let isUnmounted = false;
    let interval: any;
    // function to poll live taxis and keep the latest for the selected ID
    const fetchAndRoute = async () => {
      try {
        const taxis: TaxiVehicle[] = await invoke('get_taxi_vehicles');
        const matchedTaxi = taxis.find(t => t.id === activeTaxiId);
        if (matchedTaxi && !isUnmounted) {
          setTaxi(matchedTaxi);
          // Draw or update the route
          if (routeControl) {
            map.removeControl(routeControl);
            setRouteControl(null);
          }
          const LRouting = (window as any).L?.Routing || (L as any).Routing;
          if (!LRouting) return;
          const control = LRouting.control({
            waypoints: [
              L.latLng(matchedTaxi.coordinates[0], matchedTaxi.coordinates[1]),
              L.latLng(pickup.lat, pickup.lng)
            ],
            lineOptions: { styles: [{ color: '#0074D9', weight: 8, opacity: 0.8 }] },
            fitSelectedRoutes: true,
            draggableWaypoints: true,
            addWaypoints: false,
            routeWhileDragging: true,
            show: false,
          }).addTo(map);
          setRouteControl(control);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchAndRoute();
    interval = setInterval(fetchAndRoute, 3000);
    return () => {
      isUnmounted = true;
      clearInterval(interval);
      if (routeControl) {
        map.removeControl(routeControl);
        setRouteControl(null);
      }
    };
  }, [activeTaxiId, pickup]);
  return null;
};
