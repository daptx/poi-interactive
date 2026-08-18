import React from "react";
import { Card } from "baseui/card";
import { Button, KIND, SHAPE } from "baseui/button";
import { Input } from "baseui/input";
import { Slider } from "baseui/slider";
import { Notification, KIND as NOTIFICATION_KIND } from "baseui/notification";
import {
  HeadingSmall,
  LabelMedium,
  LabelXSmall,
  ParagraphXSmall,
} from "baseui/typography";
import { Block } from "baseui/block";

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
  </svg>
);

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
  </svg>
);

const cardOverrides = {
  Root: {
    style: ({ $theme }) => ({
      width: "220px",
      maxWidth: "100%",
      boxShadow: $theme.lighting.shadow500,
      borderTopLeftRadius: $theme.borders.radius400,
      borderTopRightRadius: $theme.borders.radius400,
      borderBottomLeftRadius: $theme.borders.radius400,
      borderBottomRightRadius: $theme.borders.radius400,
      "@media (max-width: 760px)": {
        width: "100%",
      },
    }),
  },
  Contents: {
    style: { marginTop: 0, marginBottom: 0 },
  },
};

const MapControls = ({
  poiList,
  lineWidth,
  lineColor,
  radiusMiles,
  mapState,
  animationId,
  hasRoute,
  isRouteLoading,
  routeError,
  onDismissRouteError,
  isDarkMode,
  onToggleDarkMode,
  handleLineWidthChange,
  setLineColor,
  handleRadiusChange,
  handleBearingChange,
  handlePitchChange,
  toggleAnimation,
}) => {
  return (
    <div className="controls-wrapper">
      <Card overrides={cardOverrides} className="control-panel">
        <Block display="flex" alignItems="center" justifyContent="space-between" marginBottom="scale300">
          <div>
            <HeadingSmall margin="0">POI Highlighting Tool</HeadingSmall>
            <LabelXSmall color="contentSecondary">
              Click two points on the map to draw a route
            </LabelXSmall>
          </div>
        </Block>

        <Block display="flex" alignItems="center" justifyContent="space-between" marginBottom="scale300">
          <LabelMedium>Nearby POIs</LabelMedium>
          {poiList.length > 0 && (
            <span className="poi-count-badge">{poiList.length}</span>
          )}
        </Block>

        {poiList.length > 0 ? (
          <ul className="poi-list">
            {poiList.map((poi, index) => (
              <ParagraphXSmall key={index} margin="scale100">
                {poi}
              </ParagraphXSmall>
            ))}
          </ul>
        ) : (
          <ParagraphXSmall color="contentTertiary" margin="0">
            Set a route and press Start Route to discover points of interest
            along the way.
          </ParagraphXSmall>
        )}
      </Card>

      <Card overrides={cardOverrides} className="control-panel">
        <Block display="flex" alignItems="center" justifyContent="space-between" marginBottom="scale300">
          <HeadingSmall margin="0">Route Settings</HeadingSmall>
          <Button
            onClick={onToggleDarkMode}
            kind={KIND.tertiary}
            shape={SHAPE.circle}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </Button>
        </Block>

        {routeError && (
          <Notification
            kind={NOTIFICATION_KIND.negative}
            closeable
            onClose={onDismissRouteError}
            overrides={{ Body: { style: { width: "auto", marginTop: 0, marginBottom: "12px" } } }}
          >
            {routeError}
          </Notification>
        )}

        <Block marginBottom="scale300">
          <LabelMedium marginBottom="scale100">Route Width: {lineWidth}</LabelMedium>
          <Slider
            value={[lineWidth]}
            onChange={({ value }) =>
              handleLineWidthChange({ target: { value: value[0] } })
            }
            min={0}
            max={10}
            step={0.1}
            overrides={{ ThumbValue: { style: { display: "none" } } }}
          />
        </Block>
        <Block marginBottom="scale300">
          <LabelMedium marginBottom="scale100">Route Color</LabelMedium>
          <Block display="flex" alignItems="center" $style={{ gap: "8px" }}>
            <input
              type="color"
              className="color-swatch"
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
              aria-label="Route color"
            />
            <LabelXSmall color="contentSecondary">{lineColor}</LabelXSmall>
          </Block>
        </Block>
        <Block marginBottom="scale300">
          <LabelMedium marginBottom="scale100">Radius (miles)</LabelMedium>
          <Input
            type="number"
            value={radiusMiles}
            onChange={handleRadiusChange}
            step={0.05}
            min={0}
            size="compact"
          />
        </Block>
        <Block marginBottom="scale300">
          <LabelMedium marginBottom="scale100">
            Bearing: {Math.round(mapState.bearing)}°
          </LabelMedium>
          <Slider
            value={[mapState.bearing]}
            onChange={({ value }) => handleBearingChange({ target: { value: value[0] } })}
            min={-180}
            max={180}
            step={1}
            overrides={{ ThumbValue: { style: { display: "none" } } }}
          />
        </Block>
        <Block marginBottom="scale400">
          <LabelMedium marginBottom="scale100">
            Pitch: {Math.round(mapState.pitch)}°
          </LabelMedium>
          <Slider
            value={[mapState.pitch]}
            onChange={({ value }) => handlePitchChange({ target: { value: value[0] } })}
            min={0}
            max={85}
            step={1}
            overrides={{ ThumbValue: { style: { display: "none" } } }}
          />
        </Block>

        <Button
          onClick={toggleAnimation}
          disabled={!hasRoute || isRouteLoading}
          isLoading={isRouteLoading}
          startEnhancer={() =>
            isRouteLoading ? null : animationId ? <PauseIcon /> : <PlayIcon />
          }
          overrides={{ Root: { style: { width: "100%" } } }}
        >
          {isRouteLoading ? "Fetching route…" : animationId ? "Pause Route" : "Start Route"}
        </Button>
      </Card>
    </div>
  );
};

export default MapControls;
