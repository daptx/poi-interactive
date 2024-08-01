import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';

mapboxgl.accessToken = 'pk.eyJ1IjoiZGFwdHgyMSIsImEiOiJjbHl6YWlvMjEwOWVjMmtwc2kzeXA2dTY0In0.hAsyBVcUyaOTUhGLG-kW4w';

const Map = () => {
  const mapContainerRef = useRef(null);
  const [mapState, setMapState] = useState({
    latitude: 40.74,
    longitude: -73.99,
    zoom: 13,
    bearing: 0,
    pitch: 0
  });
  const [points, setPoints] = useState([]);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [lineWidth, setLineWidth] = useState(2.5);
  const [lineColor, setLineColor] = useState('#000000');
  const [radiusMiles, setRadiusMiles] = useState(0.1);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [animationId, setAnimationId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const steps = 500; // Number of steps for the animation

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
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

      const marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat(newPoint)
        .addTo(map)
        .on('dragend', () => handleMarkerDragEnd(map));

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

    setMap(map);
    return () => map.remove();
  }, []);

  const handleMarkerDragEnd = (map) => {
    const updatedPoints = markers.map(marker => marker.getLngLat().toArray());
    console.log('Updated points after drag:', updatedPoints);
    stopAnimation(); // Stop animation if points are dragged
    setPoints(updatedPoints.slice(0, 2)); // Ensure only two points are kept
    if (updatedPoints.length === 2) {
      drawRoute(updatedPoints[0], updatedPoints[1], map);
    }
  };

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
        'fill-outline-color': '#0d5176', // Solid outline
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
        setCurrentStep(0);
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

      // Create a new circle around the animated point for the radius
      const circle = turf.circle(arc[counter], radiusMiles, {
        units: 'miles'
      });

      map.getSource('radius-circle').setData(circle);

      counter++;
      setCurrentStep(counter);

      if (counter < arc.length) {
        const id = requestAnimationFrame(animate);
        setAnimationId(id);
      } else {
        stopAnimation(); // Reset animation state when done
        setCurrentStep(0); // Reset step to allow restart from the beginning
      }
    };

    animate();
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
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '220px',
          padding: '15px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          fontFamily: 'Arial, sans-serif',
          zIndex: 1
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Route Settings</h3>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Line Width</label>
          <input
            type="number"
            value={lineWidth}
            onChange={handleLineWidthChange}
            style={{ width: '100%', padding: '5px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
            min="0"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Line Color</label>
          <input
            type="color"
            value={lineColor}
            onChange={(e) => setLineColor(e.target.value)}
            style={{ width: '100%', padding: '5px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Radius (miles)</label>
          <input
            type="number"
            value={radiusMiles}
            onChange={handleRadiusChange}
            style={{ width: '100%', padding: '5px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
            min="0"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Bearing</label>
          <input
            type="number"
            value={mapState.bearing}
            onChange={handleBearingChange}
            style={{ width: '100%', padding: '5px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Pitch</label>
          <input
            type="number"
            value={mapState.pitch}
            onChange={handlePitchChange}
            style={{ width: '100%', padding: '5px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <button
          onClick={toggleAnimation}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            borderRadius: '4px',
            backgroundColor: animationId ? '#ff4d4d' : '#007cbf',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {animationId ? 'Stop Animation' : 'Start Animation'}
        </button>
      </div>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default Map;
