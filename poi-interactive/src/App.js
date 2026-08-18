import React, { useState } from "react";
import { BaseProvider, LightTheme, DarkTheme } from "baseui";
import { Client as Styletron } from "styletron-engine-atomic";
import { Provider as StyletronProvider } from "styletron-react";
import './styles/index.css';
import './App.css';
import MapController from './controllers/MapController';

const engine = new Styletron();

function App() {
  const [isDarkMode, setIsDarkMode] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
  );

  return (
    <StyletronProvider value={engine}>
      <BaseProvider theme={isDarkMode ? DarkTheme : LightTheme}>
        <div className={`App ${isDarkMode ? "dark" : "light"}`}>
          <MapController
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode((value) => !value)}
          />
        </div>
      </BaseProvider>
    </StyletronProvider>
  );
}

export default App;
