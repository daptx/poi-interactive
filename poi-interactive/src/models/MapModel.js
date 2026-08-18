import * as turf from "@turf/turf";

export const fetchRoute = async (start, end) => {
  const params = new URLSearchParams({
    geometries: "geojson",
    access_token: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN,
  });
  const coords = `${start[0]},${start[1]};${end[0]},${end[1]}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox Directions request failed (${response.status})`);
  }

  const data = await response.json();
  const route = data.routes?.[0]?.geometry?.coordinates;
  if (!route) {
    throw new Error("No walking route found between these points");
  }
  return route;
};

export const createCircle = (center, radius) => {
  return turf.circle(center, radius, { units: "miles" });
};

export const createRouteArc = (routeCoordinates, steps) => {
  const path = turf.lineString(routeCoordinates);
  const distance = turf.length(path);
  const arc = [];

  for (let i = 0; i < distance; i += distance / steps) {
    const segment = turf.along(path, i);
    arc.push(segment.geometry.coordinates);
  }

  return arc;
};