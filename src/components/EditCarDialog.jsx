import React from 'react'
import { Button, Checkbox, Dialog, DialogActions, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@material-ui/core'
import { api, useMutator } from '../useModel'
import { useHistory } from 'react-router-dom'

const initialCar = {
  deferPerm: 0
}
export function EditCarDialog({ open, onClose, event, car, initialImageData }) {

  const [editingCar, setEditingCar] = React.useState(initialCar)
  const [errorMessage, setErrorMessage] = React.useState('')
  // const [filename, setFilename] = React.useState(null)
  const [imageData, setImageData] = React.useState(null)

  const createCar = useMutator(api.cars.create)
  const updateCar = useMutator(api.cars.update)

  const history = useHistory()

  React.useEffect(() => {
    if (open) {
      if (car) {
        setEditingCar(car)
        putImage(`/cars/${car.carId}.jpg?v=${car.imageVersion}`)
      } else {
        setEditingCar(initialCar)
      }
      setErrorMessage('')
      setImageData(null)
    }
  }, [open])


  React.useEffect(() => {
    setImageData(initialImageData)
  }, [initialImageData])


  function handleEditChange(property, value) {
    setEditingCar({ ...editingCar, [property]: value })
  }

  function putImage(url, orientation = 1) {
    var image = new Image()
    image.onload = function (imageEvent) {
      var canvas1 = document.createElement('canvas')

      // If rotating by +/-90 deg, swap width and height of destination canvas.
      if (orientation >= 5 && orientation <= 8) {
        canvas1.width = image.height
        canvas1.height = image.width
      } else {
        canvas1.width = image.width
        canvas1.height = image.height
      }

      var ctx = canvas1.getContext('2d')

      // transform context before drawing image
      switch (orientation) {
        case 2: ctx.setTransform(-1, 0, 0, 1, image.width, 0); break
        case 3: ctx.setTransform(-1, 0, 0, -1, image.width, image.height); break
        case 4: ctx.setTransform(1, 0, 0, -1, 0, image.height); break
        case 5: ctx.setTransform(0, 1, 1, 0, 0, 0); break
        case 6: ctx.setTransform(0, 1, -1, 0, image.height, 0); break
        case 7: ctx.setTransform(0, -1, -1, 0, image.height, image.width); break
        case 8: ctx.setTransform(0, -1, 1, 0, 0, image.width); break
        default: break
      }

      canvas1.getContext('2d').drawImage(image, 0, 0)

      // Crop and resize the oriented image so that it covers a 640x480 canvas, centered

      var canvas2 = document.createElement('canvas')
      var dx = 0, dy = 0, dw = 640, dh = 480
      canvas2.width = dw
      canvas2.height = dh

      // Either sx = 0 and sw = canvas1.width, OR
      // sy = 0 and sh = canvas1.height.
      var sx = 0, sy = 0, sw = canvas1.width, sh = canvas1.height
      if (sw / sh > dw / dh) {
        // Source image aspect ratio is wider than destination.
        sy = 0
        sh = canvas1.height
        sw = sh * dw / dh   // Aspect ratios must match after the transform: sw / sh = dw / dh
        sx = (canvas1.width - sw) / 2
      } else {
        // Source image aspect ratio is taller than destination.
        sx = 0
        sw = canvas1.width
        sh = sw * dh / dw   // Aspect ratios must match after the transform: sw / sh = dw / dh
        sy = (canvas1.height - sh) / 2
      }

      canvas2.getContext('2d').drawImage(canvas1, sx, sy, sw, sh, dx, dy, dw, dh)

      var dataUrl = canvas2.toDataURL('image/jpeg', 0.9)
      setImageData(dataUrl)

    }

    image.src = url
  }

  function handleImageChange(evt) {
    evt = evt.nativeEvent
    var filename = evt.target.value.split('\\').pop()
    if (!filename) {
      setImageData(null)
    } else {

      // Get orientation of image
      getOrientation(evt.target.files[0], function (orientation) {

        // alert(orientation)  // Easy debug for mobile

        // Step 1: Correct orientation, then save to canvas1
        // Step 2: Crop and resize. Save to canvas2.


        // Resize image
        var reader = new FileReader()
        reader.onload = function (readerEvent) {
          putImage(readerEvent.target.result, orientation)
        }
        reader.readAsDataURL(evt.target.files[0])
      })

    }

  }

  async function handleSave() {
    if (editingCar.carId != null) {
      try {
        await updateCar({ ...editingCar, imageData, eventId: event.eventId })
      } catch (ex) {
        console.error(ex)
        setErrorMessage(ex.serverMessage ?? ex.message ?? ex.toString())
        return
      }
      onClose()
    } else {
      try {
        let response = await createCar({ ...editingCar, imageData, eventId: event.eventId })
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
      <DialogTitle>{car ? 'Edit Car' : 'New Car'}</DialogTitle>

      <div className='loginControlTextField'>
        <TextField
          variant='outlined'
          label='Name *'
          value={editingCar?.carName ?? ''}
          onChange={(evt) => handleEditChange('carName', evt.target.value)}
        />
      </div>

      <div className='loginControlTextField'>
        <TextField
          variant='outlined'
          label="Car's Name"
          value={editingCar?.nickname ?? ''}
          onChange={(evt) => handleEditChange('nickname', evt.target.value)}
        />
      </div>

      <div className='loginControlTextField'>
        <TextField
          variant='outlined'
          label='Den'
          value={editingCar?.den ?? ''}
          onChange={(evt) => handleEditChange('den', evt.target.value)}
        />
      </div>

      <div className='loginControlTextField'>
        <FormControl component="fieldset">
          <FormLabel component="legend">Status</FormLabel>
          <RadioGroup name='deferPerm' value={editingCar?.deferPerm} onChange={(evt) => handleEditChange('deferPerm', parseInt(evt.target.value))}>
            <FormControlLabel value={0} control={<Radio />} label="Active" />
            <FormControlLabel value={1} control={<Radio />} label="Inactive" />
          </RadioGroup>
        </FormControl>
      </div>

      <div className='loginControlTextField'>

        <div class='preview-wrapper'>
          <img id="preview" src={imageData} />
        </div>

        <input type="file" id="inputfile" accept="image/*" capture="environment" className='inputfile' onChange={handleImageChange} />
        <Button variant='contained'>
          <label htmlFor="inputfile" className='inputFileLabel' style={{ fontSize: 'inherit' }}>
            {imageData ? 'Change' : 'Attach'} photo
          </label>
        </Button>
      </div>

      <p className='error'>{errorMessage}</p>
      <DialogActions>
        <Button color='primary' onClick={handleSave}>Save</Button>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>

    </Dialog >
  )
}

function getOrientation(file, callback) {
  var reader = new FileReader()
  reader.onload = function (e) {

    var view = new DataView(e.target.result)
    if (view.getUint16(0, false) != 0xFFD8) {
      return callback(-2)
    }
    var length = view.byteLength, offset = 2
    while (offset < length) {
      if (view.getUint16(offset + 2, false) <= 8) return callback(-1)
      var marker = view.getUint16(offset, false)
      offset += 2
      if (marker == 0xFFE1) {
        if (view.getUint32(offset += 2, false) != 0x45786966) {
          return callback(-1)
        }

        var little = view.getUint16(offset += 6, false) == 0x4949
        offset += view.getUint32(offset + 4, little)
        var tags = view.getUint16(offset, little)
        offset += 2
        for (var i = 0; i < tags; i++) {
          if (view.getUint16(offset + (i * 12), little) == 0x0112) {
            return callback(view.getUint16(offset + (i * 12) + 8, little))
          }
        }
      }
      else if ((marker & 0xFF00) != 0xFF00) {
        break
      }
      else {
        offset += view.getUint16(offset, false)
      }
    }
    return callback(-1)
  }
  reader.readAsArrayBuffer(file)
}

