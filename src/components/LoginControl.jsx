import { Button, Dialog, FormControl, IconButton, Input, InputAdornment, InputLabel, OutlinedInput, TextField } from '@material-ui/core'
import React from 'react'
import './css/LoginControl.css'
import { fetchPost } from '../fetchJson'
import Visibility from '@material-ui/icons/Visibility'
import VisibilityOff from '@material-ui/icons/VisibilityOff'
import { api } from '../useModel'

export function LoginControl(props) {

  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)

  const handleMouseDownPassword = (event) => {
    event.preventDefault()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setErrorMessage('')

    let data
    try {
      data = await api.user.login(username, password).execute()
    } catch (ex) {
      setErrorMessage(ex.serverMessage ?? ex.message ?? ex.toString())
      return
    }

    if (data.token) {
      setTimeout(() => props.loginSuccess(data.token, data.user), 200)
      setUsername('')
      setPassword('')
      setIsOpen(false)
    }
  }

  async function handleLogout() {
    setTimeout(() => props.logout(), 200)
    setIsOpen(false)
  }

  function handleClose() {
    setIsOpen(false)
    setUsername('')
    setPassword('')
  }

  return (
    <div className="LoginView">

      {props.user ?
        <>
          <div onClick={() => setIsOpen(true)}>{props.user.username}</div>
          <Dialog open={isOpen} onClose={handleClose}>
            {props.user.username}
            <Button onClick={handleLogout}>Logout</Button>
          </Dialog>
        </>
        :
        <>
          <div onClick={() => setIsOpen(true)}>Login</div>
          <Dialog open={isOpen} onClose={handleClose}>
            <div className='loginControlTextField'>
              <TextField
                variant='outlined'
                label='Username'
                value={username}
                onChange={(evt) => setUsername(evt.target.value)}
              />
            </div>
            <div className='loginControlTextField'>
              <FormControl variant='outlined'>
                <InputLabel htmlFor="standard-adornment-password">Password</InputLabel>
                <OutlinedInput
                  id="standard-adornment-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  label='Password'
                  onChange={(evt) => setPassword(evt.target.value)}
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


            <p className='error'>{errorMessage}</p>
            <Button onClick={handleSubmit}>Login</Button>
          </Dialog>
        </>
      }
    </div>
  )
}
