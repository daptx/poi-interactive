import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MapView = ({ mapState, onMapLoad, onMapClick }) => {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v10",
      center: [mapState.longitude, mapState.latitude],
      zoom: mapState.zoom,
      bearing: mapState.bearing,
      pitch: mapState.pitch,
    });

    map.on("load", () => onMapLoad(map));
    map.on("click", onMapClick);

    return () => map.remove();
  }, [mapState, onMapLoad, onMapClick]);

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />;
};

export default MapView;