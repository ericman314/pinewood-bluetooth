import React from 'react'
import './App.css'
import { Switch, Route, Link } from 'react-router-dom'
import { HomeView } from './HomeView'
import { EventsListView } from './EventsListView'

function App() {
  return (
    <div className="App">
      <Link to='/'>Home</Link>
      <Switch>
        <Route path='/events-list'>
          <EventsListView />
        </Route>
        <Route path='/'>
          <HomeView />
        </Route>
      </Switch>
    </div>
  )
}

export default App
