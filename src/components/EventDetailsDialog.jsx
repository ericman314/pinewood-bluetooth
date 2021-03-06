import React from 'react'
import { Button, Checkbox, Dialog, DialogActions, DialogTitle, FormControlLabel, TextField } from '@material-ui/core'
import { api, useMutator } from '../useModel'
import { useHistory } from 'react-router-dom'

export function EventDetailsDialog({ open, onClose, event }) {

  const [editingEvent, setEditingEvent] = React.useState(null)
  const [errorMessage, setErrorMessage] = React.useState('')

  const createEvent = useMutator(api.events.create)
  const updateEvent = useMutator(api.events.update)

  const history = useHistory()

  React.useEffect(() => {
    if (open) {
      if (event) {
        setEditingEvent({ ...event, eventDate: event.eventDate.substring(0, 10) })
      } else {
        setEditingEvent(null)
      }
      setErrorMessage('')
    }
  }, [open])

  function handleEditChange(property, value) {
    setEditingEvent({ ...editingEvent, [property]: value })
  }

  async function handleSave() {
    if (editingEvent.eventId != null) {
      try {
        await updateEvent(editingEvent)
      } catch (ex) {
        console.error(ex)
        setErrorMessage(ex.serverMessage ?? ex.message ?? ex.toString())
        return
      }
      onClose()
    } else {
      try {
        let response = await createEvent(editingEvent)
        let insertedId = response.update[0].data[0].eventId
        history.push(`/event-details/${insertedId}`)
      } catch (ex) {
        console.error(ex)
        setErrorMessage(ex.serverMessage ?? ex.message ?? ex.toString())
        return
      }
      onClose()
    }
  }

  async function handleDelete() {
    await api.events.delete(editingEvent.eventId).execute()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{event ? 'Edit Event' : 'New Event'}</DialogTitle>
      <div className='loginControlTextField'>
        <TextField
          variant='outlined'
          label='Event Name'
          value={editingEvent?.eventName ?? ''}
          onChange={(evt) => handleEditChange('eventName', evt.target.value)}
        />
      </div>
      <div className='loginControlTextField'>
        <TextField
          variant='outlined'
          label='Number of Runs'
          value={editingEvent?.multiplier ?? ''}
          onChange={(evt) => handleEditChange('multiplier', evt.target.value)}
        />
      </div>
      <div className='loginControlTextField'>
        <TextField
          id="date"
          label="Event Date"
          type="date"
          value={editingEvent?.eventDate ?? ''}
          onChange={(evt) => handleEditChange('eventDate', evt.target.value)}

          InputLabelProps={{
            shrink: true,
          }}
        />
        {/* <TextField
          variant='outlined'
          label='Event Date'
          value={editingEvent?.eventDate ?? ''}
          onChange={(evt) => handleEditChange('eventDate', evt.target.value)}
        /> */}
      </div>

      {/* <div className='loginControlTextField'>
        <FormControlLabel
          control={
            <Checkbox
              checked={editingUser?.admin ?? false}
              onChange={evt => handleEditChange('admin', evt.target.checked ? 1 : 0)}
              name="admin"
              color="primary"
            />
          }
          label="Admin"
        />
      </div> */}



      <p className='error'>{errorMessage}</p>
      <DialogActions>
        <Button color='primary' onClick={handleSave}>Save</Button>
        <Button onClick={onClose}>Cancel</Button>
        {event && <Button color='secondary' onClick={handleDelete}>Delete</Button>}
      </DialogActions>
    </Dialog>
  )
}