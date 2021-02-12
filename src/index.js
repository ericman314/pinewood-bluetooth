import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './components/App'
import { ModelStoreProvider } from './modelStore'
import { AppStateProvider } from './useAppState'
import { BluetoothProvider } from './hooks/useBluetooth'

ReactDOM.render(
  <BrowserRouter>
    <AppStateProvider>
      <ModelStoreProvider>
        <BluetoothProvider>
          <App />
        </BluetoothProvider>
      </ModelStoreProvider>
    </AppStateProvider>
  </BrowserRouter>
  ,
  document.getElementById('root')
)

