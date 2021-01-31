import { Grid } from '@material-ui/core'
import React from 'react'
import { useAppState } from '../useAppState'
import './css/HomeView.css'
import { HomeCardLink } from './HomeCardLink'

export function HomeView(props) {

  const { state, dispatch } = useAppState()

  return (
    <div className='homeView'>
      <Grid container>
        <HomeCardLink title='Events' caption='View event details, add cars, run a race' to='/events-list' />
        <HomeCardLink title='Race Now' caption='Run an unmanaged race' to='/race-unmanaged' />
        {state.user?.admin === 1 &&
          <HomeCardLink title='Users' caption='View and manage users' to='/users' />
        }
      </Grid>

   

    </div>
  )

}