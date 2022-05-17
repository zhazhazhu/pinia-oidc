import { User } from "oidc-client-ts";
import { PiniaOidcStoreListeners } from "../../types/oidc";
interface CustomEventParams<T = any> {
    bubbles?: boolean;
    cancelable?: boolean;
    detail?: T;
}
export declare function dispatchCustomBrowserEvent(eventName: any, detail?: PiniaOidcStoreListeners | User, params?: CustomEventParams): void;
export {};
