import React from 'react'
import { Button, Checkbox, Dialog, DialogActions, DialogTitle, FormControlLabel, TextField } from '@material-ui/core'
import { api, useMutator } from '../useModel'
import { useHistory } from 'react-router-dom'

export function DeleteEventDialog({ event, onClose, open }) {

  const [checked, setChecked] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const history = useHistory()

  const deleteEvent = useMutator(api.events.delete)

  React.useEffect(() => {
    if (open) {
      setChecked(false)
      setErrorMessage('')
    }
  }, [open])

  async function handleDelete() {
    if (checked && event.eventId != null) {
      try {
        await deleteEvent(event.eventId)
        history.push('/events-list')
      } catch (ex) {
        console.error(ex)
        setErrorMessage(ex.serverMessage ?? ex.message ?? ex.toString())
        return
      }
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Event?</DialogTitle>
      <div className='loginControlTextField'>
        <p>The ENTIRE EVENT, including ALL CARS and RESULTS, will be DELETED.</p>
        <FormControlLabel
          control={<Checkbox
            checked={checked}
            onChange={(evt) => setChecked(evt.target.checked)}
          />}
          label="Check box to confirm"
        />
      </div>
      <p className='error'>{errorMessage}</p>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {event && <Button color='secondary' disabled={!checked} onClick={handleDelete}>Delete</Button>}
      </DialogActions>
    </Dialog>
  )
}