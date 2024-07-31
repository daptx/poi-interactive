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
  const [points, setPoints] = useState([]);
  const [map, setMap] = useState(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
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

    map.on('click', (e) => {
        if (points.length < 2) {
            const newPoint = [e.lngLat.lng, e.lngLat.lat];
            console.log({points})
            points.push(newPoint); // use state isn't synchronous
            new mapboxgl.Marker()
                .setLngLat(newPoint)
                .addTo(map);
        } else {
            map.off('click');
            console.warn('Only two points allowed'); 
        }
    });

    setMap(map);
    return () => map.remove();
  }, []);

  return (
    <div>
      <div ref={mapContainerRef} style={{ width: '100vw', height: '100vh' }} />
    </div>
  );
};

export default Map;



