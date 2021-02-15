import React from 'react'
import { useParams } from 'react-router-dom'
import { api, useModel } from '../useModel'

export function RaceModelLoader({ children }) {
  const params = useParams()
  if (typeof children !== 'function') {
    throw new Error('RaceModelLoader\'s child must be a function')
  }
  return children({
    cars: useModel(api.cars.getByEventId(params.eventId)),
    event: useModel(api.events.getById(params.eventId)),
    results: useModel(api.results.getByEventId(params.eventId))
  })
}