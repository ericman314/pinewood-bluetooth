import React from 'react'
import { useParams } from 'react-router-dom'
import { api, useModel } from '../useModel'

export function RaceModelLoader({ children }) {
  const params = useParams()
  const eventId = parseInt(params.eventId)

  if (typeof children !== 'function') {
    throw new Error('RaceModelLoader\'s child must be a function')
  }

  const cars = useModel(api.cars.getByEventId(eventId))
  const event = useModel(api.events.getById(eventId))
  const results = useModel(api.results.getByEventId(eventId))

  if (cars && event && results) {
 return children({
   cars,
   event,
   results,
  })
  }
  else {
    return null
  }
}