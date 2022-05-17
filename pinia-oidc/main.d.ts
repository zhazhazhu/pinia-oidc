import { dispatchCustomBrowserEvent } from "./services/browser-event";
import * as utils from "./services/utils";
export declare const piniaOidcCreateUserManager: (oidcSettings: import("oidc-client-ts").OidcClientSettings) => import("oidc-client-ts").UserManager;
export declare const piniaOidcCreateStoreModule: (oidcSettings: import("../types/oidc").PiniaOidcClientSettings, storeSettings?: import("../types/oidc").PiniaOidcStoreSettings, oidcEventListeners?: import("../types/oidc").PiniaOidcStoreListeners) => import("../types/store").PiniaStore<import("../types/store").PiniaState, {
    oidcIsAuthenticated(): boolean;
    oidcUser(): any;
    oidcAccessToken(): any;
    oidcAccessTokenExp(): number | null;
    oidcScopes(): any;
    oidcIdToken(): any;
    oidcIdTokenExp(): number | null;
    oidcRefreshToken(): any;
    oidcRefreshTokenExp(): number | null;
    oidcAuthenticationIsChecked(): any;
    oidcError(): any;
    oidcIsRoutePublic(): (route: any) => boolean;
}, {
    oidcCheckAccess(route: any): Promise<unknown>;
    authenticateOidc(payload?: string | import("../types/oidc").AuthenticateOidcSilentPayload): Promise<void>;
    oidcSignInCallback(url: string): Promise<unknown>;
    authenticateOidcSilent(payload?: import("../types/oidc").AuthenticateOidcSilentPayload): Promise<unknown>;
    authenticateOidcPopup(payload?: import("../types/oidc").AuthenticateOidcSilentPayload): Promise<void>;
    oidcSignInPopupCallback(url: string): Promise<unknown>;
    oidcWasAuthenticated(user: import("oidc-client-ts").User): void;
    storeOidcUser(user: import("oidc-client-ts").User): Promise<void>;
    getOidcUser(): Promise<import("oidc-client-ts").User | null>;
    addOidcEventListener(payload: {
        eventName: string;
        eventListener: import("../types/oidc").PiniaOidcStoreListeners;
    }): void;
    removeOidcEventListener(payload: {
        eventName: string;
        eventListener: import("../types/oidc").PiniaOidcStoreListeners;
    }): void;
    signOutOidc(payload: any): Promise<void>;
    signOutOidcCallback(): Promise<import("oidc-client-ts").SignoutResponse>;
    signOutPopupOidc(payload: any): Promise<void>;
    signOutPopupOidcCallback(): Promise<void>;
    signOutOidcSilent(payload: any): Promise<unknown>;
    removeUser(): any;
    removeOidcUser(): Promise<void>;
    clearStaleState(): Promise<void>;
    setOidcAuth(user: import("oidc-client-ts").User): void;
    setOidcUser(user: import("oidc-client-ts").User): void;
    unsetOidcAuth(): void;
    setOidcAuthIsChecked(): void;
    setOidcEventsAreBound(): void;
    setOidcError(payload: any): void;
}>;
export declare const piniaOidcCreateNextRouterMiddleware: (store: any) => (context: any) => Promise<unknown>;
export declare const piniaOidcCreateRouterMiddleware: (store: any) => (to: any, from: any, next: any) => void;
export declare const piniaOidcProcessSilentSignInCallback: (oidcSettings: import("oidc-client-ts").OidcClientSettings) => Promise<void>;
export declare const piniaOidcProcessSignInCallback: (oidcSettings: import("oidc-client-ts").OidcClientSettings) => Promise<unknown>;
export declare const piniaOidcGetOidcCallbackPath: (callbackUri?: string | undefined, routeBase?: string) => string | null;
export declare const vuexDispatchCustomBrowserEvent: typeof dispatchCustomBrowserEvent;
export declare const piniaOidcUtils: typeof utils;
