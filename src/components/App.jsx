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
import { makeStyles } from '@material-ui/core'
import { UsersView } from './UsersView'
import { Race } from './Race'
import { RaceModelLoader } from './RaceModelLoader'
import { CarDetailsView } from './CarDetailsView'

const useStyles = makeStyles((theme) => ({
  button: {
    ...theme.typography.button,
    color: '#ccc',
    // backgroundColor: theme.palette.background.paper,
    display: 'inline-block',
    padding: theme.spacing(1),
  },
}))

function App() {

  const classes = useStyles()
  const { state, dispatch } = useAppState()
  

  React.useEffect(() => {

    (async () => {
      let token = localStorage.getItem('uvpd-jwt-token')
      if (token) {
        const data = await api.users.verify().execute()
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
        <LoginControl loginSuccess={loginSuccess} logout={logout} user={state.user} />
        <Link to='/'><div style={{ float: 'right' }}><div className={classes.button}>Home</div></div></Link>
        <Link to='/'>
          <img src={logoColorFlat} />
        </Link>
      </div>
      <Switch>
        <Route path='/event-details/:eventId/car/:carId'>
          <CarDetailsView />
        </Route>
        <Route path='/event-details/:eventId'>
          <EventDetailsView />
        </Route>
        <Route path='/events-list'>
          <EventsListView />
        </Route>
        <Route path='/race-unmanaged'>
          <Race cars={[]} />
        </Route>
        <Route path='/race/:eventId'>
          <RaceModelLoader>
            {({ cars }) =>
              <Race cars={cars} />
            }
          </RaceModelLoader>
        </Route>
        <Route path='/users'>
          <UsersView />
        </Route>
        <Route path='/'>
          <HomeView />
        </Route>
      </Switch>
    </div>
  )
}

export default App
