import React from 'react'
import { Link } from 'react-router-dom'
import { Button, List, ListItem } from '@material-ui/core'
import { api, useModel } from '../useModel'
import { EventDetailsDialog } from './EventDetailsDialog'
import moment from 'moment'

export function EventsListView(props) {

  const events = useModel(api.events.all())
  if (events) events.sort((a, b) => -moment(a.eventDate).valueOf() + moment(b.eventDate).valueOf())
  
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
      <List component='nav' style={{ maxWidth: 400 }} >
      {events?.map(event => (
        <Link to={`/event-details/${event.eventId}`}>
          <ListItem button key={event.eventId} divider>
            <div>
              <h3 style={{ marginTop: 4 }}>{event.eventName}</h3>
              {moment(event.eventDate).format('YYYY-MM-DD')}
            </div>
          </ListItem>
        </Link>
      ))}
      </List>

      <EventDetailsDialog open={newEventDialogOpen} onClose={handleClose} event={null} />

    </div>
  )
}