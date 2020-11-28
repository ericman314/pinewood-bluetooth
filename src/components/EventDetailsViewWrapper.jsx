import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, useModel } from '../useModel'
import { EventDetailsView } from './EventDetailsView'

export function EventDetailsViewWrapper(props) {

  const params = useParams()
  const events = useModel(api.events.all())
  const event = events?.find(e => e.eventId.toString() === params.eventId)

  if (event) {
    return <EventDetailsView event={event} />
  } else {
    return 'Loading, please wait...'
  }
}