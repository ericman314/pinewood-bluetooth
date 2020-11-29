import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './components/App'
import { ModelStoreProvider } from './modelStore'
import { AppStateProvider } from './useAppState'

ReactDOM.render(
  <BrowserRouter>
    <AppStateProvider>
      <ModelStoreProvider>
        <App />
      </ModelStoreProvider>
    </AppStateProvider>
  </BrowserRouter>
  ,
  document.getElementById('root')
)

