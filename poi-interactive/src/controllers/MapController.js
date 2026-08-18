import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapControls from "../components/MapControls";
import { fetchRoute, createCircle, createRouteArc } from "../models/MapModel";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const LIGHT_STYLE = "mapbox://styles/mapbox/light-v10";
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

const MapController = ({ isDarkMode, onToggleDarkMode }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null); // Store map instance here
  const hasMountedRef = useRef(false);
  const [mapState, setMapState] = useState({
    latitude: 40.74,
    longitude: -73.99,
    zoom: 13,
    bearing: 0,
    pitch: 0,
  });
  const [points, setPoints] = useState([]);
  const markersRef = useRef([]);
  const [lineWidth, setLineWidth] = useState(2.5);
  const [lineColor, setLineColor] = useState("#000000");
  const radiusMilesRef = useRef(0.05);
  const [radiusMiles, setRadiusMiles] = useState(0.05);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [animationId, setAnimationId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [poiList, setPoiList] = useState([]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const steps = 500; // Number of steps for the animation

  const addBaseLayers = () => {
    if (!mapRef.current) return;

    mapRef.current.addLayer({
      id: "poi-icons",
      type: "symbol",
      source: {
        type: "vector",
        url: "mapbox://mapbox.mapbox-streets-v8",
      },
      "source-layer": "poi_label",
      layout: {
        "icon-image": ["concat", ["get", "maki"], "-15"],
        "icon-size": 1,
      },
    });

    mapRef.current.addSource("highlighted-pois", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    mapRef.current.addLayer({
      id: "highlighted-pois-layer",
      type: "circle",
      source: "highlighted-pois",
      paint: {
        "circle-radius": 12,
        "circle-color": "#ffc413",
        "circle-opacity": 0.1,
        "circle-stroke-width": 0.5,
        "circle-stroke-color": "#000000",
      },
    });
  };

  useEffect(() => {
    // Ensure the map is only initialized once
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: isDarkMode ? DARK_STYLE : LIGHT_STYLE,
        center: [mapState.longitude, mapState.latitude],
        zoom: mapState.zoom,
        bearing: mapState.bearing,
        pitch: mapState.pitch,
      });

      mapRef.current.on("load", addBaseLayers);
      mapRef.current.on("click", handleMapClick);

      mapRef.current.on("move", () => {
        setMapState({
          latitude: mapRef.current.getCenter().lat,
          longitude: mapRef.current.getCenter().lng,
          zoom: mapRef.current.getZoom(),
          bearing: mapRef.current.getBearing(),
          pitch: mapRef.current.getPitch(),
        });
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // Runs once on mount; mapRef.current guards re-initialization.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the basemap style when the theme toggles, then restore the custom
  // layers and any in-progress route (setStyle wipes everything but markers).
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (!mapRef.current) return;

    stopAnimation();
    mapRef.current.setStyle(isDarkMode ? DARK_STYLE : LIGHT_STYLE);
    mapRef.current.once("style.load", () => {
      addBaseLayers();
      if (points.length === 2) {
        drawRoute(points[0], points[1]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDarkMode]);

  useEffect(() => {
    radiusMilesRef.current = radiusMiles;
  }, [radiusMiles]);

  useEffect(() => {
    if (points.length === 2 && mapRef.current) {
      drawRoute(points[0], points[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineWidth, lineColor, radiusMiles]);

  const handleMapClick = (e) => {
    if (!mapRef.current) return;

    const newPoint = [e.lngLat.lng, e.lngLat.lat];
    setPoints((prevPoints) => {
      let updatedPoints = [...prevPoints, newPoint];
      if (updatedPoints.length > 2) {
        updatedPoints = updatedPoints.slice(-2);
      }
      if (updatedPoints.length === 2) {
        drawRoute(updatedPoints[0], updatedPoints[1]);
      }
      return updatedPoints;
    });

    const marker = new mapboxgl.Marker().setLngLat(newPoint).addTo(mapRef.current);

    const prevMarkers = markersRef.current;
    if (prevMarkers.length >= 2) {
      prevMarkers[0].remove();
      markersRef.current = [...prevMarkers.slice(1), marker];
    } else {
      markersRef.current = [...prevMarkers, marker];
    }
  };

  const drawRoute = async (start, end) => {
    if (!mapRef.current) return;

    setRouteError(null);
    setIsRouteLoading(true);

    try {
      const route = await fetchRoute(start, end);
      if (!mapRef.current) return; // component/map may have unmounted mid-flight

      setRouteCoordinates(route);

      if (mapRef.current.getLayer("route")) {
        mapRef.current.removeLayer("route");
        mapRef.current.removeSource("route");
      }

      mapRef.current.addLayer({
        id: "route",
        type: "line",
        source: {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: route,
            },
          },
        },
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": lineColor,
          "line-width": lineWidth,
        },
      });

      if (mapRef.current.getLayer("point")) {
        mapRef.current.removeLayer("point");
        mapRef.current.removeSource("point");
      }

      mapRef.current.addLayer({
        id: "point",
        type: "circle",
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Point",
                  coordinates: start,
                },
              },
            ],
          },
        },
        paint: {
          "circle-radius": 6,
          "circle-color": "#007cbf",
        },
      });

      if (mapRef.current.getLayer("radius-circle")) {
        mapRef.current.removeLayer("radius-circle");
        mapRef.current.removeSource("radius-circle");
      }
      if (mapRef.current.getLayer("radius-circle-outline")) {
        mapRef.current.removeLayer("radius-circle-outline");
        mapRef.current.removeSource("radius-circle-outline");
      }

      const circle = createCircle(start, radiusMiles);

      mapRef.current.addLayer({
        id: "radius-circle",
        type: "fill",
        source: {
          type: "geojson",
          data: circle,
        },
        paint: {
          "fill-color": "rgba(100, 164, 199, 0.2)",
        },
      });

      mapRef.current.addLayer({
        id: "radius-circle-outline",
        type: "line",
        source: {
          type: "geojson",
          data: circle,
        },
        paint: {
          "line-color": "#0d5176",
          "line-width": 1,
        },
      });
    } catch (error) {
      console.error(error);
      setRouteError(error.message || "Failed to fetch route");
    } finally {
      setIsRouteLoading(false);
    }
  };

  const toggleAnimation = () => {
    if (animationId) {
      stopAnimation();
    } else {
      animatePoint(currentStep);
    }
  };

  const stopAnimation = () => {
    setAnimationId((id) => {
      if (id) cancelAnimationFrame(id);
      return null;
    });
  };

  const animatePoint = (startStep = 0) => {
    const arc = createRouteArc(routeCoordinates, steps);

    let counter = startStep;

    const animate = () => {
      if (counter >= arc.length) {
        stopAnimation();
        setCurrentStep(0);
        return;
      }

      const pointData = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: arc[counter],
            },
          },
        ],
      };

      mapRef.current.getSource("point").setData(pointData);

      const circle = createCircle(arc[counter], radiusMilesRef.current);

      mapRef.current.getSource("radius-circle").setData(circle);
      mapRef.current.getSource("radius-circle-outline").setData(circle);

      updatePOIList(circle);

      counter++;
      setCurrentStep(counter);

      if (counter < arc.length) {
        const id = requestAnimationFrame(animate);
        setAnimationId(id);
      } else {
        setCurrentStep(0);
        setAnimationId(null);
      }
    };

    animate();
  };

  const updatePOIList = (circle) => {
    const features = mapRef.current.querySourceFeatures("poi-icons", {
      sourceLayer: "poi_label",
      filter: ["within", circle],
    });

    const currentPOIs = new Set(features.map((feature) => feature.properties.name));
    setPoiList(Array.from(currentPOIs));

    const highlightedPOIs = {
      type: "FeatureCollection",
      features: features.map((feature) => ({
        type: "Feature",
        properties: feature.properties,
        geometry: feature.geometry,
      })),
    };

    if (mapRef.current.getSource("highlighted-pois")) {
      mapRef.current.getSource("highlighted-pois").setData(highlightedPOIs);
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
    setMapState((prevState) => ({ ...prevState, bearing: value }));
    if (mapRef.current) mapRef.current.setBearing(value);
  };

  const handlePitchChange = (e) => {
    const value = Number(e.target.value);
    setMapState((prevState) => ({ ...prevState, pitch: value }));
    if (mapRef.current) mapRef.current.setPitch(value);
  };

  return (
    <div className="app-shell">
      <MapControls
        poiList={poiList}
        lineWidth={lineWidth}
        lineColor={lineColor}
        radiusMiles={radiusMiles}
        mapState={mapState}
        animationId={animationId}
        hasRoute={points.length === 2}
        isRouteLoading={isRouteLoading}
        routeError={routeError}
        onDismissRouteError={() => setRouteError(null)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
        handleLineWidthChange={handleLineWidthChange}
        setLineColor={setLineColor}
        handleRadiusChange={handleRadiusChange}
        handleBearingChange={handleBearingChange}
        handlePitchChange={handlePitchChange}
        toggleAnimation={toggleAnimation}
      />
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
};

export default MapController;
