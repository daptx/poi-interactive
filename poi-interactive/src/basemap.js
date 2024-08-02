// Import the necessary libraries
import React, { useRef, useEffect, useState } from 'react'; // hooks
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import MapControls from './MapControls';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const Map = () => {
  const mapContainerRef = useRef(null);
  const [mapState, setMapState] = useState({
    latitude: 40.74,
    longitude: -73.99,
    zoom: 13,
    bearing: 0,
    pitch: 0
  });
  // define the state variables
  const [points, setPoints] = useState([]);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [lineWidth, setLineWidth] = useState(2.5);
  const [lineColor, setLineColor] = useState('#000000');
  const radiusMilesRef = useRef(0.1);
  const [radiusMiles, setRadiusMiles] = useState(0.1);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [animationId, setAnimationId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [poiList, setPoiList] = useState([]);
  const steps = 500; // Number of steps for the animation

  useEffect(() => {
    radiusMilesRef.current = radiusMiles;
  }, [radiusMiles]);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v10', // light-v11 won't load maki icons?
      center: [mapState.longitude, mapState.latitude],
      zoom: mapState.zoom,
      bearing: mapState.bearing,
      pitch: mapState.pitch
    });

    map.on('move', () => {
      setMapState({
        latitude: map.getCenter().lat,
        longitude: map.getCenter().lng,
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
      });
    });

    map.on('click', (e) => {
      const newPoint = [e.lngLat.lng, e.lngLat.lat];
      console.log('New point:', newPoint);

      stopAnimation(); // Stop animation if a new point is added

      setPoints(prevPoints => {
        let updatedPoints = [...prevPoints, newPoint];
        if (updatedPoints.length > 2) {
          updatedPoints = updatedPoints.slice(-2); // Keep only the last two points
        }
        if (updatedPoints.length === 2) {
          drawRoute(updatedPoints[0], updatedPoints[1], map);
        }
        return updatedPoints;
      });

      // Add a marker for each point
      const marker = new mapboxgl.Marker()
        .setLngLat(newPoint)
        .addTo(map);

      setMarkers(prevMarkers => {
        if (prevMarkers.length >= 2) {
          // Remove the first marker if more than two markers
          prevMarkers[0].remove();
          return [...prevMarkers.slice(1), marker];
        } else {
          return [...prevMarkers, marker];
        }
      });
    });

    // Adding points of interest (POI) maki icons
    // https://labs.mapbox.com/maki-icons/
    map.on('load', () => {
      map.addLayer({
        id: 'poi-icons',
        type: 'symbol',
        source: {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-streets-v8'
        },
        'source-layer': 'poi_label',
        layout: {
          'icon-image': ['concat', ['get', 'maki'], '-15'], // Maki icon name
          'icon-size': 1
        }
      });

      // Add a layer for highlighted POIs
      map.addSource('highlighted-pois', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] } // Empty initial data
      });

      map.addLayer({
        id: 'highlighted-pois-layer',
        type: 'circle',
        source: 'highlighted-pois',
        paint: {
          'circle-radius': 12,
          'circle-color': '#ffc413', 
          'circle-opacity': 0.1, 
          'circle-stroke-width': 0.5, 
          'circle-stroke-color': '#000000', 
        }
      });
    });

    setMap(map);
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (points.length === 2 && map) {
      drawRoute(points[0], points[1], map);
    }
  }, [lineWidth, lineColor, radiusMiles]);

  const drawRoute = async (start, end, map) => {
    if (!map) return;

    console.log('Drawing route between:', start, end);

    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
    console.log('Directions API URL:', url);

    const response = await fetch(url);
    const data = await response.json();
    console.log('Directions API response:', data);

    const route = data.routes[0]?.geometry.coordinates;
    if (!route) {
      console.error('No route found');
      return;
    }

    setRouteCoordinates(route);

    if (map.getLayer('route')) {
      map.removeLayer('route');
      map.removeSource('route');
    }

    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route
          }
        }
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': lineColor, // Line color for the route
        'line-width': lineWidth // Line width for the route
      }
    });

    // Add a layer for the point that will be animated along the route.
    if (map.getLayer('point')) {
      map.removeLayer('point');
      map.removeSource('point');
    }

    map.addLayer({
      id: 'point',
      type: 'circle',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: start
            }
          }]
        }
      },
      paint: {
        'circle-radius': 6,
        'circle-color': '#007cbf'
      }
    });

    // Add a layer for the radius circle.
    if (map.getLayer('radius-circle')) {
      map.removeLayer('radius-circle');
      map.removeSource('radius-circle');
    }
    if (map.getLayer('radius-circle-outline')) {
      map.removeLayer('radius-circle-outline');
      map.removeSource('radius-circle-outline');
    }

    // Use Turf to create a circle polygon representing the radius
    const circle = turf.circle(start, radiusMiles, {
      units: 'miles'
    });

    map.addLayer({
      id: 'radius-circle',
      type: 'fill',
      source: {
        type: 'geojson',
        data: circle
      },
      paint: {
        'fill-color': 'rgba(100, 164, 199, 0.2)', // Transparent fill
      }
    });

    map.addLayer({
      id: 'radius-circle-outline',
      type: 'line',
      source: {
        type: 'geojson',
        data: circle
      },
      paint: {
        'line-color': '#0d5176', // Outline color
        'line-width': 1, // Width of the outline
      }
    });

    console.log('Route drawn');
  };

  const stopAnimation = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      setAnimationId(null);
    }
  };

  const toggleAnimation = () => {
    if (animationId) {
      stopAnimation();
    } else {
      animatePoint(currentStep);
    }
  };

const animatePoint = (startStep = 0) => {
  const path = turf.lineString(routeCoordinates);
  const distance = turf.length(path);
  const arc = [];

  // Generate arc points
  for (let i = 0; i < distance; i += distance / steps) {
    const segment = turf.along(path, i);
    arc.push(segment.geometry.coordinates);
  }

  let counter = startStep;

  const animate = () => {
    if (counter >= arc.length) {
      stopAnimation();
      setCurrentStep(0); // Reset step when animation completes
      return;
    }

    const pointData = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: arc[counter]
        }
      }]
    };

    map.getSource('point').setData(pointData);

    // Use the ref value for radiusMiles to ensure latest value is used
    const circle = turf.circle(arc[counter], radiusMilesRef.current, {
      units: 'miles'
    });

    map.getSource('radius-circle').setData(circle);
    map.getSource('radius-circle-outline').setData(circle);

    updatePOIList(circle); // Update POIs during animation

    counter++;
    setCurrentStep(counter);

    if (counter < arc.length) {
      const id = requestAnimationFrame(animate);
      setAnimationId(id);
    } else {
      setCurrentStep(0); // Reset step to allow restart from the beginning
      setAnimationId(null); // Ensure animation is marked as stopped
    }
  };

  animate();
};

// Rest of your Map component code...



  const updatePOIList = (circle) => {
    const features = map.querySourceFeatures('poi-icons', {
      sourceLayer: 'poi_label',
      filter: ['within', circle]
    });

    const currentPOIs = new Set(features.map(feature => feature.properties.name));
    setPoiList(Array.from(currentPOIs));

    const highlightedPOIs = {
      type: 'FeatureCollection',
      features: features.map(feature => ({
        type: 'Feature',
        properties: feature.properties,
        geometry: feature.geometry
      }))
    };

    // Update the map with highlighted POIs
    if (map.getSource('highlighted-pois')) {
      map.getSource('highlighted-pois').setData(highlightedPOIs);
    }
  };

  const handleLineWidthChange = (e) => {
    const value = Math.max(0, Number(e.target.value));
    setLineWidth(value);
  };

  const handleRadiusChange = (e) => {
    const value = Math.max(0, Number(e.target.value));
    setRadiusMiles(value);
  };

  const handleBearingChange = (e) => {
    const value = Number(e.target.value);
    setMapState(prevState => ({ ...prevState, bearing: value }));
    if (map) map.setBearing(value);
  };

  const handlePitchChange = (e) => {
    const value = Number(e.target.value);
    setMapState(prevState => ({ ...prevState, pitch: value }));
    if (map) map.setPitch(value);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <MapControls
        poiList={poiList}
        lineWidth={lineWidth}
        lineColor={lineColor}
        radiusMiles={radiusMiles}
        mapState={mapState}
        animationId={animationId}
        handleLineWidthChange={handleLineWidthChange}
        setLineColor={setLineColor}
        handleRadiusChange={handleRadiusChange}
        handleBearingChange={handleBearingChange}
        handlePitchChange={handlePitchChange}
        toggleAnimation={toggleAnimation}
      />
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default Map;