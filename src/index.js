import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './components/App'
import { ModelStoreProvider } from './modelStore'

ReactDOM.render(
  <BrowserRouter>
    <ModelStoreProvider>
      <App />
    </ModelStoreProvider>
  </BrowserRouter>
  ,
  document.getElementById('root')
)

