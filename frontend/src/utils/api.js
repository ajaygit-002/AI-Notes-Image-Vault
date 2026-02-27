// helper to parse JSON safely and provide better errors
export async function parseJSON(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    // include response status to aid debugging
    throw new Error(`Failed to parse JSON (${response.status}): ${text}`);
  }
}
