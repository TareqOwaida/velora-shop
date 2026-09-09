let csrf = null;
let pending = null;
export async function getSession() {
  if (!pending)
    pending = fetch("/api/session", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Unable to connect to the store. Please try again.");
        const data = await response.json();
        csrf = data.csrf;
        return data;
      })
      .finally(() => {
        pending = null;
      });
  return pending;
}
export async function api(path, options = {}) {
  const method = options.method || "GET";
  if (method !== "GET" && !csrf) await getSession();
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    signal: options.signal,
    headers:
      method === "GET"
        ? {}
        : { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The store is temporarily unavailable. Please try again.");
  }
  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.status = response.status;
    throw error;
  }
  if (data.csrf) csrf = data.csrf;
  return data;
}
