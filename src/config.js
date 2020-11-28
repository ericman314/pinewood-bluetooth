/* Common config items */
const config = {

}

switch (process.env.NODE_ENV) {
  case 'development':
    config.webRoot = 'http://localhost:3000'
    config.basename = '/'
    break
  default:
    config.webRoot = ''
    config.basename = '/'
    break
}


export default config