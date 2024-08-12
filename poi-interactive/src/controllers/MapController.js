import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapControls from "../components/MapControls";
import { fetchRoute, createCircle, createRouteArc } from "../models/MapModel";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const MapController = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null); // Store map instance here
  const [mapState, setMapState] = useState({
    latitude: 40.74,
    longitude: -73.99,
    zoom: 13,
    bearing: 0,
    pitch: 0,
  });
  const [points, setPoints] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [lineWidth, setLineWidth] = useState(2.5);
  const [lineColor, setLineColor] = useState("#000000");
  const radiusMilesRef = useRef(0.05);
  const [radiusMiles, setRadiusMiles] = useState(0.05);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [animationId, setAnimationId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [poiList, setPoiList] = useState([]);
  const steps = 500; // Number of steps for the animation

  useEffect(() => {
    // Ensure the map is only initialized once
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/light-v10",
        center: [mapState.longitude, mapState.latitude],
        zoom: mapState.zoom,
        bearing: mapState.bearing,
        pitch: mapState.pitch,
      });

      mapRef.current.on("load", () => {

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
      });

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
  }, []); 

  useEffect(() => {
    radiusMilesRef.current = radiusMiles;
  }, [radiusMiles]);

  useEffect(() => {
    if (points.length === 2 && mapRef.current) {
      drawRoute(points[0], points[1]);
    }
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

    setMarkers((prevMarkers) => {
      if (prevMarkers.length >= 2) {
        prevMarkers[0].remove();
        return [...prevMarkers.slice(1), marker];
      } else {
        return [...prevMarkers, marker];
      }
    });
  };

  const drawRoute = async (start, end) => {
    if (!mapRef.current) return;

    const route = await fetchRoute(start, end);
    if (!route) {
      console.error("No route found");
      return;
    }

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
  };

  const toggleAnimation = () => {
    if (animationId) {
      stopAnimation();
    } else {
      animatePoint(currentStep);
    }
  };

  const stopAnimation = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      setAnimationId(null);
    }
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
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
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
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default MapController;