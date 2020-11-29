import React from 'react'
import './css/HomeView.css'
import { HomeCardLink } from './HomeCardLink'

export function HomeView(props) {


  return (
    <div className='homeView'>
      <HomeCardLink title='Events' caption='View event details, add cars, run a race' to='/events-list' />
      <HomeCardLink title='Race Now' caption='Run an unmanaged race' to='/race-unmanaged' />
    </div>
  )

}