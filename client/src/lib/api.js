// Calls the server and returns its JSON, or throws an Error with the server's message.
export async function api(method, url, body) {
  const options = { method, headers: {} };
  if (body instanceof Blob) {
    options.body = body;
    options.headers['Content-Type'] = body.type;
  } else if (body !== undefined) {
    options.body = JSON.stringify(body);
    options.headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || 'Something went wrong. Please try again.');
    error.status = res.status;
    throw error;
  }
  return data;
}
