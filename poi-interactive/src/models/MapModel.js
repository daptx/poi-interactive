import * as turf from "@turf/turf";

export const fetchRoute = async (start, end) => {
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.routes[0]?.geometry.coordinates;
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