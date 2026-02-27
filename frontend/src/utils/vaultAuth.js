// In-memory vault authorization flag.
// This lives only for the current JS context (SPA lifetime) and resets on full page reload.
let authorized = false;

export function isVaultAuthorized() {
  return authorized;
}

export function setVaultAuthorized(value) {
  authorized = !!value;
}

export default { isVaultAuthorized, setVaultAuthorized };
