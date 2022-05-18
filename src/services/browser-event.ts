import { User } from "oidc-client-ts";
import { PiniaOidcStoreListeners } from "../../types/oidc";
import { objectAssign } from "./utils";

interface CustomEventParams<T = any> {
  bubbles?: boolean;
  cancelable?: boolean;
  detail?: T;
}

// Use native custom event or DIY for IE
function createCustomEvent(
  eventName: string,
  detail: PiniaOidcStoreListeners,
  params: CustomEventParams
) {
  const prefixedEventName = "oidc:" + eventName;

  if (typeof window.CustomEvent === "function") {
    params = objectAssign([params, { detail: detail }]);
    return new window.CustomEvent(prefixedEventName, params);
  }

  /* istanbul ignore next */
  params = params || { bubbles: false, cancelable: false };
  params = objectAssign([params, { detail: detail }]);
  var evt = document.createEvent("CustomEvent");
  evt.initCustomEvent(
    prefixedEventName,
    params.bubbles,
    params.cancelable,
    params.detail
  );
  return evt;
}

export function dispatchCustomBrowserEvent(
  eventName,
  detail: PiniaOidcStoreListeners | User = {},
  params: CustomEventParams = {}
) {
  if (window) {
    const event = createCustomEvent(
      eventName,
      objectAssign([{}, detail]),
      params
    );
    window.dispatchEvent(event);
  }
}
