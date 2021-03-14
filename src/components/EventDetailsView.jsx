import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, useModel } from '../useModel'
import { EventDetailsDialog } from './EventDetailsDialog'
import { EditCarDialog } from './EditCarDialog'
import moment from 'moment'

import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { Accordion, AccordionSummary, Button } from '@material-ui/core'
import { DeleteEventDialog } from './DeleteEventDialog'

export function EventDetailsView({ }) {

  const params = useParams()
  const eventId = parseInt(params.eventId)
  const events = useModel(api.events.all())
  const event = events?.find(e => e.eventId === eventId)
  const cars = useModel(api.cars.getByEventId(eventId))

  const results = useModel(api.results.getByEventId(eventId))
  
  const [editEventDialogOpen, setEditEventDialogOpen] = React.useState(false)
  const [editCarDialogOpen, setEditCarDialogOpen] = React.useState(false)
  const [deleteEventDialogOpen, setDeleteEventDialogOpen] = React.useState(false)
  const [deleteAllResultsDialogOpen, setDeleteAllResultsDialogOpen] = React.useState(false)

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

  function handleEditEvent() {
    alert('handleEditEvent')
  }

  function handleDeleteEvent() {
    alert('handleDeleteEvent')
  }

  function handleDeleteEventResults() {
    alert('handleDeleteEventResults')
  }

  function handleStartRace() {
    alert('handleStartRace')
  }

  function handleGotoWelcome() {
    alert('handleGotoWelcome')
  }

  function handleAddCar() {
    alert('handleAddCar')
  }

  function handleDeleteResult() {
    alert('handleDeleteResult')
  }

  function getCarFromResult(result) {
    return cars.filter(c => c.carId === result.carId)[0]
  }
  console.log(event)
  const loaded = (event && cars && results)
  if (!loaded) {

    return (
      <div className='eventsListView' style={{ margin: 16 }}>
        <Link to='/events-list'>Back to all events</Link>
        <p>Loading...</p>
      </div>
    )
  } else {
    return (
      <div className='eventsListView' style={{ margin: 16 }}>
        <Link to='/events-list'>Back to all events</Link>

        <h1>{event.eventName}</h1>

        <p>{moment(event.eventDate).format('YYYY-MM-DD')}</p>

        <p>
          <Button variant='contained' color='primary' onClick={handleStartRace}>Start Race</Button>
        </p>

        <hr />
        <div className='AdvancedHeader' onClick={() => setShowAdvanced(!showAdvanced)}>Advanced ▼</div>
        {showAdvanced && <div className='AdvancedContent'>
          {/* <label><input type='checkbox' value={debugMode} onClick={(evt) => setDebugMode(evt.target.checked)} /> Debug mode</label> */}

          <p>
            <a href="/api/results.csv?eventId={{event.eventId}}" className='link' target='_blank'>Download results</a>
          </p>
          <p>
            <Button variant='contained' color='primary' onClick={() => setEditEventDialogOpen(true)}>Edit Event</Button>
          </p>
          <p>
            <Button variant='contained' color='secondary' onClick={() => setDeleteEventDialogOpen(true)}>Delete Event</Button>
          </p>
          <p>
            <Button variant='contained' color='secondary' onClick={() => setDeleteAllResultsDialogOpen(true)}>Delete All Results</Button>
          </p>
        </div>}
        <hr />

      
        <EventDetailsDialog open={editEventDialogOpen} onClose={() => setEditEventDialogOpen(false)} event={event} />
        <DeleteEventDialog open={deleteEventDialogOpen} onClose={() => setDeleteEventDialogOpen(false)} event={event} />
        <EditCarDialog open={editCarDialogOpen} onClose={() => setEditCarDialogOpen(false)} event={event} car={null} />

        <h2>Cars ({cars.length})</h2>
        <Button variant='contained' color='primary' onClick={() => setEditCarDialogOpen(true)}>Add car</Button>
        <br /><br />
        {duplicateName && <p style={{ color: 'red', fontWeight: 'bold' }}>Duplicate name: {duplicateName}</p>}

        <div style={{ clear: 'both' }}></div>

        {cars.map(car => (

          <div style={{ float: 'left', width: '320px', textAlign: 'center', marginBottom: '20px' }}>
            <Link to={`/event-details/${eventId}/car/${car.carId}`}>
              <img src={`/cars/${car.carId}.jpg?v=${car.imageVersion}`} style={{ width: '95%' }} />
              <br />
              <p style={{ fontSize: '22pt', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{car.carName}</p>
              <p style={{ fontSize: '14pt', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><i>{car.nickname ?? <span>&nbsp;</span>}</i></p>
            </Link>
          </div>
        ))}

        <h2 style={{ clear: 'both' }}>Results</h2>

        <div class="results-pane">

          <ul>
            {results.map(result =>
              <li class="x-angular-animate list-item" style={{ borderTop: 'solid gray 1px' }}>

                <div uib-dropdown>
                  <a href className='name' uib-dropdown-toggle id="simple-dropdown-{{result.resultId}}">
                    <div class="name result-name">{result.resultDate} {getCarFromResult(result)?.carName}</div>
                    <div class="result-time lane-color-{{result.lane}}" style={{ top: '-6px' }}>{result.time}</div>
                    <div style={{ clear: 'both' }}></div>
                  </a>
                  <span onClick={result => handleDeleteResult(result)}></span>
                  <ul class="dropdown-menu" uib-dropdown-menu id="simple-dropdown-{{result.resultId}}">
                    <li><a href ng-click="deleteResult(result)">Delete result</a></li>
                  </ul>
                </div>

              </li>
            )}
          </ul>

        </div>




      </div>
    )
  }
}