import { OidcClientSettings, User } from "oidc-client-ts";
export interface PiniaOidcSigninRedirectOptions {
  useReplaceToNavigate?: boolean;
  skipUserInfo?: boolean;
  extraQueryParams?: Record<string, any>;
}

export interface PiniaOidcSigninSilentOptions {}

export interface PiniaOidcSigninPopupOptions {}

export interface PiniaOidcStoreSettings {
  dispatchEventsOnWindow?: boolean;
  isPublicRoute?: (route: any) => boolean;
  publicRoutePaths?: string[];
  routeBase?: string;
  defaultSigninRedirectOptions?: PiniaOidcSigninRedirectOptions;
  defaultSigninSilentOptions?: PiniaOidcSigninSilentOptions;
  defaultSigninPopupOptions?: PiniaOidcSigninPopupOptions;
  isAuthenticatedBy?: "access_token" | "id_token";
}

export interface PiniaOidcClientSettings extends OidcClientSettings {
  popup_redirect_uri?: string;
  silent_redirect_uri?: string;
  automaticSilentSignin?: boolean;
  automaticSilentRenew?: boolean;
}

export interface PiniaOidcStoreListeners {
  userLoaded?: (user: User) => void;
  userUnloaded?: () => void;
  accessTokenExpiring?: () => void;
  accessTokenExpired?: () => void;
  silentRenewError?: () => void;
  userSignedOut?: () => void;
  oidcError?: (payload?: PiniaOidcErrorPayload) => void;
  automaticSilentRenewError?: (payload?: PiniaOidcErrorPayload) => void;
  context?: any;
  error?: any;
}

export interface PiniaOidcErrorPayload {
  context: string;
  error: any;
}

export interface AuthenticateOidcSilentPayload {
  options?: any;
  ignoreErrors?: boolean;
  redirectPath?: string;
}

export interface ErrorPayload {
  context?: any;
  error?: { message?: string };
}
