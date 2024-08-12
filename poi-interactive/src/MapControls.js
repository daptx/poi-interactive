import React from "react";
import { Card } from "baseui/card";
import { Button } from "baseui/button";
import { Input } from "baseui/input";
import { Slider } from "baseui/slider";
import { HeadingSmall, LabelMedium, ParagraphXSmall } from "baseui/typography";
import { Block } from "baseui/block";

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
  toggleAnimation,
}) => {
  return (
    <>
      <Card
        overrides={{
          Root: {
            style: {
              position: "absolute",
              top: "10px",
              left: "10px",
              width: "240px", 
              zIndex: 1,
              padding: "scale400", 
            },
          },
        }}
      >
        <HeadingSmall marginTop="0" marginBottom="scale300"> 
          POIs Highlighted
        </HeadingSmall>
        <ul
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            marginBottom: "10px",
            padding: 0,
          }}
        >
          {poiList.map((poi, index) => (
            <ParagraphXSmall key={index} margin="scale100">
              {poi}
            </ParagraphXSmall>
          ))}
        </ul>
      </Card>

      <Card
        overrides={{
          Root: {
            style: {
              position: "absolute",
              top: "10px",
              right: "10px",
              width: "240px", 
              zIndex: 1,
              padding: "scale400",
            },
          },
        }}
      >
        <HeadingSmall marginTop="0" marginBottom="scale300"> 
          Route Design Settings
        </HeadingSmall>
        <Block marginBottom="scale300">
          <LabelMedium>Route Width</LabelMedium>
          <Slider
            value={[lineWidth]}
            onChange={({ value }) =>
              handleLineWidthChange({ target: { value: value[0] } })
            }
            min={0}
            max={10}
            step={0.1}
          />
        </Block>
        <Block marginBottom="scale300">
          <LabelMedium>Route Color</LabelMedium>
          <Input
            type="color"
            value={lineColor}
            onChange={(e) => setLineColor(e.target.value)}
          />
        </Block>
        <Block marginBottom="scale300">
          <LabelMedium>Radius (miles)</LabelMedium>
          <Input
            type="number"
            value={radiusMiles}
            onChange={handleRadiusChange}
            step={0.05}
          />
        </Block>
        <Block marginBottom="scale300">
          <LabelMedium>Bearing (-180 to 180)</LabelMedium>
          <Input
            type="number"
            value={mapState.bearing}
            onChange={handleBearingChange}
          />
        </Block>
        <Block marginBottom="scale300">
          <LabelMedium>Pitch (0 to 85)</LabelMedium>
          <Input
            type="number"
            value={mapState.pitch}
            onChange={handlePitchChange}
          />
        </Block>
        <Button
          onClick={toggleAnimation}
          overrides={{
            Root: {
              style: {
                width: "100%",
                marginTop: "scale400",
              },
            },
          }}
        >
          {animationId ? "Pause Route" : "Start Route"}
        </Button>
      </Card>
    </>
  );
};

export default MapControls;