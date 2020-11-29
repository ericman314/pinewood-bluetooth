import React from 'react'
import './App.css'
import { Switch, Route, Link } from 'react-router-dom'
import { HomeView } from './HomeView'
import { EventsListView } from './EventsListView'
import { EventDetailsView } from './EventDetailsView'
import { EventDetailsViewWrapper } from './EventDetailsViewWrapper'
import logoColorFlat from './img/logo-color-flat.png'
import { useAppState } from '../useAppState'
import { modelStore } from '../modelStore'
import { LoginControl } from './LoginControl'
import constants from '../constants'
import { api } from '../useModel'

function App() {

  const { state, dispatch } = useAppState()

  React.useEffect(() => {

    (async () => {
      let token = localStorage.getItem('uvpd-jwt-token')
      if (token) {
        const data = await api.user.verify().execute()
        if (data.user) {
          loginSuccess(token, data.user)
        }
      }
    })()

  }, [])

  function loginSuccess(token, user) {
    localStorage.setItem('uvpd-jwt-token', token)
    console.log(user)
    dispatch({ type: constants.ACTION_USER_IS_LOGGED_IN, user })
  }

  function logout() {
    localStorage.removeItem('uvpd-jwt-token')
    dispatch({ type: constants.ACTION_LOGOUT_USER })
  }


  return (
    <div className="App">
      <div className='header'>
        <Link to='/'>
          <img src={logoColorFlat} />
        </Link>
      </div>
      <LoginControl loginSuccess={loginSuccess} logout={logout} user={state.user} />
      <Switch>
        <Route path='/event-details/:eventId'>
          <EventDetailsViewWrapper />
        </Route>
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
