import React from 'react'
import { Button, Checkbox, Dialog, DialogActions, DialogTitle, FormControlLabel, TextField } from '@material-ui/core'
import { api, useMutator } from '../useModel'
import { useHistory } from 'react-router-dom'

export function DeleteCarDialog({ car, event, onClose, open }) {

  const [checked, setChecked] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const history = useHistory()

  const deleteCar = useMutator(api.cars.delete)

  React.useEffect(() => {
    if (open) {
      setChecked(false)
      setErrorMessage('')
    }
  }, [open])

  async function handleDelete() {
    if (checked && car.carId != null) {
      try {
        await deleteCar(car.carId)
        history.push(`/event-details/${event.eventId}`)
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
      <DialogTitle>Delete Car?</DialogTitle>
      <div className='loginControlTextField'>
        <p>The car and all its results will be deleted! (Consider setting the car as inactive instead.)</p>
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
        {car && <Button color='secondary' disabled={!checked} onClick={handleDelete}>Delete</Button>}
      </DialogActions>
    </Dialog>
  )
}