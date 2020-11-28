import React from 'react'
import { Link } from 'react-router-dom'

export function HomeView(props) {

  return (
    <div className='homeView'>
      <h1>Home</h1>
      <Link to="/events-list">Events</Link>
    </div>
  )

}