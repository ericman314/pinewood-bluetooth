const constants = {
  ACTION_SET_IS_TOKEN_UNKNOWN: 'ACTION_SET_IS_TOKEN_UNKNOWN',
  ACTION_USER_IS_LOGGED_IN: 'ACTION_USER_IS_LOGGED_IN',
  ACTION_LOGOUT_USER: 'ACTION_LOGOUT_USER',
}

for (let i in constants) {
  if (constants[i] !== i) {
    throw new Error(
      `In constants.js, keys and value must match, but constants['${i}'] = '${constants[i]}'.`
    )
  }
}

export default constants
