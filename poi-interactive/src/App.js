import React from 'react';
import ReactDOM from "react-dom";
import { BaseProvider, LightTheme } from "baseui";
import { Client as Styletron } from "styletron-engine-atomic";
import { Provider as StyletronProvider } from "styletron-react";
import './App.css';
import Map from './basemap';

const engine = new Styletron();

ReactDOM.render(
  <StyletronProvider value={engine}>
    <BaseProvider theme={LightTheme}>
      <App />
    </BaseProvider>
  </StyletronProvider>,
  document.getElementById("root")
);

function App() {
  return (
    <div className="App">
      <Map />
    </div>
  );
}

export default App;
