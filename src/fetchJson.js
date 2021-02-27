import config from "./config"
const _rootURL = config.webRoot


export async function fetchGet(url, data = {}, rootURL = null, headers = {}, abortController) {

  let fullUrl = (rootURL || _rootURL) + url

  const queryString = serialize(data)
  if (queryString) {
    fullUrl += '?' + queryString
  }

  let opts = { headers: { ...headers } }
  let token = localStorage.getItem('uvpd-jwt-token')
  if (token) {
    opts.headers.Authorization = `Bearer ${token}`
  }

  if (abortController && abortController.signal) {
    opts.signal = abortController.signal
  }

  const response = await fetch(fullUrl, opts)

  if (!response.ok) {
    throw new FetchError(`Received status code ${response.status} from GET request to ${fullUrl}.`, null, response.status, fullUrl, 'get', data)
  }

  const responseText = await response.text()

  let jsonResponse
  try {
    jsonResponse = JSON.parse(responseText)
  } catch (ex) {
    throw new FetchError(`Unparseable response from GET request to ${fullUrl}. Response: ${responseText}`, responseText, response.status, fullUrl, 'get', data)

  }
  if (jsonResponse.error) {
    throw new FetchError(`In request to ${fullUrl}, server responded with error message: ${jsonResponse.error}.`, jsonResponse.error, response.status, fullUrl, 'get', data)
  }
  return jsonResponse

}

export async function fetchPost(url, data = {}, rootURL = null, headers = {}, abortController) {

  const fullUrl = (rootURL || _rootURL) + url

  headers = {
    'Content-Type': "application/json; charset=utf-8",
    ...headers
  }

  let token = localStorage.getItem('uvpd-jwt-token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let opts = {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  }
  if (abortController && abortController.signal) {
    opts.signal = abortController.signal
  }

  let response
  try {
    response = await fetch(fullUrl, opts)
  } catch (ex) {
    alert(ex.message)
    console.error(ex)
    return
  }

  if (!response.ok) {
    throw new FetchError(`Received status code ${response.status} from POST request to ${fullUrl}.`, null, response.status, fullUrl, 'post', data)
  }

  const responseText = await response.text()

  let jsonResponse
  try {
    jsonResponse = JSON.parse(responseText)
  } catch (ex) {
    throw new FetchError(`Unparseable response from POST request to ${fullUrl}. Response: ${responseText}`, responseText, response.status, fullUrl, 'post', data)
  }

  if (jsonResponse.error) {
    throw new FetchError(`In request to ${fullUrl}, server responded with error message: ${jsonResponse.error}.`, jsonResponse.error, response.status, fullUrl, 'post', data, jsonResponse)
  }
  return jsonResponse
}

function serialize(obj) {
  var str = []
  for (var p in obj)
    if (obj.hasOwnProperty(p) && typeof obj[p] !== 'undefined') {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]))
    }
  return str.join("&")
}

export class FetchError extends Error {
  constructor(message, serverMessage, responseCode, url, method, requestPayload, response) {
    super(message)
    this.name = 'FetchError'
    this.serverMessage = serverMessage
    this.responseCode = responseCode
    this.url = url
    this.method = method
    this.requestPayload = requestPayload
    this.response = response
  }
}