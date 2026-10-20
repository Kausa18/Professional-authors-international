// Calls the server and returns its JSON, or throws an Error with the server's message.
export async function api(method, url, body) {
  const options = { method, headers: {}, credentials: 'same-origin', signal: AbortSignal.timeout(30000) };
  if (body instanceof Blob) {
    options.body = body;
    options.headers['Content-Type'] = body.type;
  } else if (body !== undefined) {
    options.body = JSON.stringify(body);
    options.headers['Content-Type'] = 'application/json';
  }
  let res;
  try { res = await fetch(url, options); }
  catch (error) {
    throw new Error(error.name === 'TimeoutError' ? 'The request timed out. Please try again.' : 'Unable to reach the server. Please check your connection and try again.');
  }
  const data = await res.json().catch(() => { throw new Error('The server returned an unexpected response. Please try again.'); });
  if (!res.ok) {
    const error = new Error(data.error || 'Something went wrong. Please try again.');
    error.status = res.status;
    throw error;
  }
  return data;
}
