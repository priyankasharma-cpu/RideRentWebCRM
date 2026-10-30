let csrf = '';
let sessionPromise;
export async function loadSession() {
  if (!sessionPromise)
    sessionPromise = fetch('/api/session', {
      credentials: 'same-origin',
    })
      .then(async (r) => {
        if (!r.ok) throw Error('Unable to connect to RideRent.');
        const s = await r.json();
        csrf = s.csrf;
        return s;
      })
      .catch((e) => {
        sessionPromise = null;
        throw e;
      });
  return sessionPromise;
}
export async function api(path, { method = 'GET', body, token, ...rest } = {}) {
  if (method !== 'GET') await loadSession();
  const isForm = body instanceof FormData;
  const res = await fetch('/api' + path, {
    method,
    credentials: 'same-origin',
    headers: {
      ...(!isForm && body
        ? {
            'Content-Type': 'application/json',
          }
        : {}),
      ...(method !== 'GET'
        ? {
            'X-CSRF-Token': csrf,
          }
        : {}),
      ...(token
        ? {
            'X-Booking-Token': token,
          }
        : {}),
    },
    ...(body
      ? {
          body: isForm ? body : JSON.stringify(body),
        }
      : {}),
    ...rest,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw Error('Server unavailable. Start both the API and frontend.');
  }
  if (!res.ok) throw Error(data.error || 'Request failed.');
  if (data.csrf) csrf = data.csrf;
  return data;
}
export function updateSessionCache(result) {
  sessionPromise = Promise.resolve(result);
  csrf = result.csrf;
}
export function resetSessionCache() {
  sessionPromise = null;
  csrf = '';
}
