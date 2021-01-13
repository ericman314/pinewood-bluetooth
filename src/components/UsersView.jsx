import { Button, Checkbox, Dialog, DialogActions, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, OutlinedInput, TextField, Typography } from '@material-ui/core'

import Visibility from '@material-ui/icons/Visibility'
import VisibilityOff from '@material-ui/icons/VisibilityOff'
import React from 'react'
import { Link } from 'react-router-dom'
import { api, useModel } from '../useModel'

export function UsersView(props) {

  const users = useModel(api.users.all())

  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')


  function handleUserClick(user) {
    setEditingUser({ ...user })
    setEditDialogOpen(true)
  }

  function handleClose() {
    setErrorMessage('')
    setEditDialogOpen(false)
    setEditingUser(null)
  }

  function handleEditChange(property, value) {
    setEditingUser({ ...editingUser, [property]: value })
  }

  async function handleSave() {
    if (editingUser.userId != null) {
      if (!editingUser.password) {
        delete editingUser.password
      }
      try {
        await api.users.update(editingUser).execute()
      } catch (ex) {
        console.error(ex)
        setErrorMessage(ex.serverMessage ?? ex.message ?? ex.toString())
        return
      }
      handleClose()
    } else {
      try {
        await api.users.create(editingUser).execute()
      } catch (ex) {
        console.error(ex)
        setErrorMessage(ex.serverMessage ?? ex.message ?? ex.toString())
        return
      }
      handleClose()
    }
  }

  async function handleDelete() {
    await api.users.delete(editingUser.userId).execute()
    handleClose()
  }

  const handleMouseDownPassword = (event) => {
    event.preventDefault()
  }

  return (
    <div className='usersView' style={{ margin: 16 }}>

      <h1>Users</h1>

      <Button variant='contained' color='primary' onClick={() => setEditDialogOpen(true)}>New User</Button>

      <br /><br />
      {users?.map(user => (
        <p key={user.id} onClick={() => handleUserClick(user)}>
          {user.admin ? <b>{user.username}</b> : user.username
          }
        </p>
      ))}

      <Dialog open={editDialogOpen} onClose={handleClose}>
        <div className='loginControlTextField'>
          <TextField
            variant='outlined'
            label='Username'
            value={editingUser?.username ?? ''}
            onChange={(evt) => handleEditChange('username', evt.target.value)}
          />
        </div>
        <div className='loginControlTextField'>
          <FormControl variant='outlined'>
            <InputLabel htmlFor="standard-adornment-password">Password</InputLabel>
            <OutlinedInput
              id="standard-adornment-password"
              type={showPassword ? 'text' : 'password'}
              value={editingUser?.password ?? ''}
              label='Password'
              onChange={(evt) => handleEditChange('password', evt.target.value)}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={handleMouseDownPassword}
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              }
            />
          </FormControl>
        </div>

        <div className='loginControlTextField'>

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
        </div>
        <p className='error'>{errorMessage}</p>
        <DialogActions>
          <Button color='primary' onClick={handleSave}>Save</Button>
          <Button onClick={handleClose}>Cancel</Button>
          <Button color='secondary' onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

    </div>
  )
}