import React from "react";
import { BaseProvider, LightTheme } from "baseui";
import { Client as Styletron } from "styletron-engine-atomic";
import { Provider as StyletronProvider } from "styletron-react";
import './styles/index.css';
import MapController from './controllers/MapController'; 

const engine = new Styletron();

function App() {
  return (
    <StyletronProvider value={engine}>
      <BaseProvider theme={LightTheme}>
        <div className="App">
          <MapController />
        </div>
      </BaseProvider>
    </StyletronProvider>
  );
}

export default App;
