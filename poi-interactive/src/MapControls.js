import React from 'react';

const MapControls = ({
  poiList,
  lineWidth,
  lineColor,
  radiusMiles,
  mapState,
  animationId,
  handleLineWidthChange,
  setLineColor,
  handleRadiusChange,
  handleBearingChange,
  handlePitchChange,
  toggleAnimation
}) => {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          width: '220px',
          padding: '15px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          fontFamily: 'Arial, sans-serif',
          zIndex: 1
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>POIs Highlighted</h3>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {poiList.map((poi, index) => (
            <li key={index} style={{ fontSize: '14px', color: '#666' }}>{poi}</li>
          ))}
        </ul>
      </div>
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
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Route Design Settings</h3>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Route Width</label>
          <input
            type="number"
            value={lineWidth}
            onChange={handleLineWidthChange}
            style={{ width: '100%', padding: '5px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
            min="0"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Route Color</label>
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
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Bearing (-180 to 180)</label>
          <input
            type="number"
            value={mapState.bearing}
            onChange={handleBearingChange}
            style={{ width: '100%', padding: '5px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Pitch (0 to 85)</label>
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
          {animationId ? 'Pause Route' : 'Start Route'}
        </button>
      </div>
    </>
  );
};

export default MapControls;
