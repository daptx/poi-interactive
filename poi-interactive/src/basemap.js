import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoiZGFwdHgyMSIsImEiOiJjbHl6YWlvMjEwOWVjMmtwc2kzeXA2dTY0In0.hAsyBVcUyaOTUhGLG-kW4w';

const Map = () => {
  const mapContainerRef = useRef(null);
  const [mapState, setMapState] = useState({
    latitude: 40.74, // set using http://bboxfinder.com/ 
    longitude: -73.99, 
    zoom: 13
  });

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v10',
      center: [mapState.longitude, mapState.latitude],
      zoom: mapState.zoom
    });

    map.on('move', () => {
      setMapState({
        latitude: map.getCenter().lat,
        longitude: map.getCenter().lng,
        zoom: map.getZoom()
      });
    });

    return () => map.remove();
  }, []);

  return (
    <div>
      <div ref={mapContainerRef} style={{ width: '100vw', height: '100vh' }} />
    </div>
  );
};

export default Map;



