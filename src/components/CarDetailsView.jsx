import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, useModel } from '../useModel'
import { EventDetailsDialog } from './EventDetailsDialog'
import { EditCarDialog } from './EditCarDialog'
import moment from 'moment'

import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { Accordion, AccordionSummary, Button } from '@material-ui/core'
import { DeleteEventDialog } from './DeleteEventDialog'
import { DeleteCarDialog } from './DeleteCarDialog'

export function CarDetailsView({ }) {

  const params = useParams()
  const eventId = parseInt(params.eventId)
  const events = useModel(api.events.all())
  const event = events?.find(e => e.eventId === eventId)
  const carId = parseInt(params.carId)
  const cars = useModel(api.cars.getByEventId(eventId))
  const car = cars?.find(c => c.carId === carId)
  const results = useModel(api.results.getByEventId(eventId))

  const [editEventDialogOpen, setEditEventDialogOpen] = React.useState(false)
  const [editCarDialogOpen, setEditCarDialogOpen] = React.useState(false)
  const [deleteCarDialogOpen, setDeleteCarDialogOpen] = React.useState(false)
  const [deleteAllResultsDialogOpen, setDeleteAllResultsDialogOpen] = React.useState(false)

  const [imageData, setImageData] = React.useState(null)

  const [showAdvanced, setShowAdvanced] = React.useState(false)

  const [debugMode, setDebugMode] = React.useState(false)

  let duplicateName
  var allNames = []
  if (cars) {
    for (var i = 0; i < cars.length; i++) {
      allNames.push(cars[i].name)
    }
    allNames.sort()
    for (var i = 0; i < allNames.length - 1; i++) {
      if (allNames[i] === allNames[i + 1]) {
        duplicateName = allNames[i]
      }
    }
  }

  function handleDeleteResult() {
    alert('handleDeleteResult')
  }

  function getCarFromResult(result) {
    return cars.filter(c => c.carId === result.carId)[0]
  }
  const loaded = (car && results && event)
  if (!loaded) {

    return (
      <div className='eventsListView' style={{ margin: 16 }}>
        <Link to={`/event-details/${eventId}`}>Back to event</Link>
        <p>Loading...</p>
      </div>
    )
  } else {
    return (
      <div className='eventsListView' style={{ margin: 16 }}>
        <Link to={`/event-details/${eventId}`}>Back to {event.eventName}</Link>

        <h1>{car.carName}</h1>
        <h2>{car.nickname}</h2>

        <img src={`/cars/${carId}.jpg?v=${car.imageVersion}`} />
        <p>
          <Button variant='contained' color='primary' onClick={() => setEditCarDialogOpen(true)}>Edit Car</Button>
        </p>
        <hr />
        <div className='AdvancedHeader' onClick={() => setShowAdvanced(!showAdvanced)}>Advanced ▼</div>
        {showAdvanced && <div className='AdvancedContent'>
          <p>
            <Button variant='contained' color='secondary' onClick={() => setDeleteCarDialogOpen(true)}>Delete Car</Button>
          </p>
        </div>}
        <hr />

        <EditCarDialog open={editCarDialogOpen} onClose={() => setEditCarDialogOpen(false)} event={event} car={car} />
        <DeleteCarDialog open={deleteCarDialogOpen} onClose={() => setDeleteCarDialogOpen(false)} event={event} car={car} />








      </div>
    )
  }
}