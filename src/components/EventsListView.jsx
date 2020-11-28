import React from 'react'
import { Link } from 'react-router-dom'
import { api, useModel } from '../useModel'

export function EventsListView(props) {

  const events = useModel(api.events.all())

  return (
    <div className='eventsListView'>

      <h1>Events</h1>

      <button class="btn btn-primary" ng-click="newEvent()">New Event</button>


      <br /><br />
      {events?.map(event => (
        <p key={event.eventId}>
          <Link to={`/event-details/${event.eventId}`}>{event.eventName} &mdash; {event.eventDate}</Link>
        </p>
      ))}

    </div>
  )
}