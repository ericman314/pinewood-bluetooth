import { Button, Dialog, FormControl, IconButton, Input, InputAdornment, InputLabel, makeStyles, OutlinedInput, TextField } from '@material-ui/core'
import React from 'react'
import './css/LoginControl.css'
import { fetchPost } from '../fetchJson'
import Visibility from '@material-ui/icons/Visibility'
import VisibilityOff from '@material-ui/icons/VisibilityOff'
import { api } from '../useModel'

const useStyles = makeStyles((theme) => ({
  button: {
    ...theme.typography.button,
    color: '#ccc',
    // backgroundColor: theme.palette.background.paper,
    display: 'inline-block',
    cursor: 'pointer',
    padding: theme.spacing(1),
  },
}))

export function LoginControl(props) {

  const classes = useStyles()
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
      data = await api.users.login(username, password).execute()
    } catch (ex) {
      console.error(ex)
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
          <div className={classes.button} onClick={() => setIsOpen(true)}>Logout</div>
          <Dialog open={isOpen} onClose={handleClose}>
            {props.user.username}
            <Button onClick={handleLogout}>Logout</Button>
          </Dialog>
        </>
        :
        <>
          <div className={classes.button} onClick={() => setIsOpen(true)}>Login</div>

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
