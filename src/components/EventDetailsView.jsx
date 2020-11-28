import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, useModel } from '../useModel'

export function EventDetailsView(props) {

  const params = useParams()
  const eventId = parseInt(params.eventId)
  const events = useModel(api.events.all())
  const event = events?.find(e => e.eventId.toString() === eventId)
  const cars = useModel(api.cars.getByEventId(eventId))
  const results = useModel(api.results.getByEventId(eventId))

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
    return cars?.filter(c => c.carId === result.carId)[0]
  }


  return (
    <div className='eventsListView'>
      <Link to='/events-list'>Back to all events</Link>

      <h1>{event?.eventName}</h1>

      <p>{event?.eventDate}</p>

      <div className='link' onClick={handleEditEvent}>Edit event</div>
      <label><input type='checkbox' value={debugMode} onClick={(evt) => setDebugMode(evt.target.checked)} /> Debug mode</label>
      <a href="/api/results.csv?eventId={{event.eventId}}" target='_blank'>Download results</a>

      <div className='link' onClick={handleDeleteEvent}>Delete event</div>
      <div className='link' onClick={handleDeleteEventResults}>Delete all results</div>

      <button class="btn btn-primary" onClick={handleStartRace}>START RACE</button>
      <button class="btn btn-primary" onClick={handleGotoWelcome}>Welcome screen</button>


      <h2>Cars ({cars?.length})</h2>
      <button class="btn btn-primary" onClick={handleAddCar}>Add car</button>
      <br /><br />
      {duplicateName && <p style={{ color: 'red', fontWeight: 'bold' }}>Duplicate name: {duplicateName}</p>}

      <div style={{ clear: 'both' }}></div>

      {cars?.map(car => (

        <div style={{ float: 'left', width: '320px', textAlign: 'center', marginBottom: '20px' }}>
          <a ui-sref="car-details({carId:car.carId})">
            <img ng-src="cars/{{car.carId}}.jpg" style={{ width: '95%' }} />
            <br />
            <p style={{ fontSize: '22pt', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{car.carName}</p>
            <p style={{ fontSize: '14pt', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><i>{car.nickname ?? '&nbsp;'}</i></p>
          </a>
        </div>
      ))}

      <h2 style={{ clear: 'both' }}>Results</h2>

      <div class="results-pane">

        <ul>
          {results?.map(result =>
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