import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@material-ui/core'
import { api, useModel } from '../useModel'
import { EventDetailsDialog } from './EventDetailsDialog'

export function EventsListView(props) {

  const events = useModel(api.events.all())
  
  const [newEventDialogOpen, setNewEventDialogOpen] = React.useState(false)

  function handleClose() {
    setNewEventDialogOpen(false)
  }

  return (
    <div className='eventsListView' style={{ margin: 16 }}>

      <h1>Events</h1>
      <Button variant='contained' color='primary' onClick={() => setNewEventDialogOpen(true)}>New Event</Button>
      {/* <button class="btn btn-primary" ng-click="newEvent()">New Event</button> */}


      <br /><br />
      {events?.map(event => (
        <p key={event.eventId}>
          <Link to={`/event-details/${event.eventId}`}>{event.eventName} &mdash; {event.eventDate}</Link>
        </p>
      ))}

      <EventDetailsDialog open={newEventDialogOpen} onClose={handleClose} event={null} />

    </div>
  )
}