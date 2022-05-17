import {
  OidcClientSettings,
  UserManager,
  WebStorageStateStore,
} from "oidc-client-ts";
import {
  PiniaOidcClientSettings,
  PiniaOidcStoreListeners,
} from "../../types/oidc";
import { DefaultOidcConfig } from "./index";
import {
  camelCaseToSnakeCase,
  firstLetterUppercase,
  objectAssign,
  parseJwt,
} from "./utils";

const defaultOidcConfig: DefaultOidcConfig = {
  userStore: new WebStorageStateStore(),
  loadUserInfo: true,
  automaticSilentSignin: true,
};

const requiredConfigProperties = [
  "authority",
  "client_id",
  "redirect_uri",
  "response_type",
  "scope",
];

const settingsThatAreSnakeCasedInOidcClient: string[] = [
  "clientId",
  "redirectUri",
  "responseType",
  "maxAge",
  "uiLocales",
  "loginHint",
  "acrValues",
  "postLogoutRedirectUri",
  "popupRedirectUri",
  "silentRedirectUri",
];

const snakeCasedSettings = (oidcSettings: OidcClientSettings) => {
  settingsThatAreSnakeCasedInOidcClient.forEach((setting) => {
    if (typeof oidcSettings[setting] !== "undefined") {
      oidcSettings[camelCaseToSnakeCase(setting)] = oidcSettings[setting];
    }
  });
  return oidcSettings;
};

export const getOidcConfig = (oidcSettings): PiniaOidcClientSettings => {
  return objectAssign<PiniaOidcClientSettings>([
    defaultOidcConfig,
    snakeCasedSettings(oidcSettings),
    { automaticSilentRenew: false }, // automaticSilentRenew is handled in vuex and not by user manager
  ]);
};

export const createOidcUserManager = (oidcSettings: OidcClientSettings) => {
  const oidcConfig = getOidcConfig(oidcSettings);

  requiredConfigProperties.forEach((requiredProperty) => {
    if (!oidcConfig[requiredProperty]) {
      throw new Error(
        "Required oidc setting " +
          requiredProperty +
          " missing for creating UserManager"
      );
    }
  });
  return new UserManager(oidcConfig);
};

export const getOidcCallbackPath = (
  callbackUri?: string,
  routeBase = "/"
): string | null => {
  if (callbackUri) {
    const domainStartsAt = "://";
    const hostAndPath = callbackUri.substr(
      callbackUri.indexOf(domainStartsAt) + domainStartsAt.length
    );
    return hostAndPath
      .substr(hostAndPath.indexOf(routeBase) + routeBase.length - 1)
      .replace(/\/$/, "");
  }
  return null;
};

export const addUserManagerEventListener = (
  oidcUserManager: UserManager,
  eventName: string,
  eventListener: PiniaOidcStoreListeners[keyof PiniaOidcStoreListeners]
) => {
  const addFnName = "add" + firstLetterUppercase(eventName);
  if (
    typeof oidcUserManager.events[addFnName] === "function" &&
    typeof eventListener === "function"
  ) {
    oidcUserManager.events[addFnName](eventListener);
  }
};

export const tokenExp = (token: string): number | null => {
  if (token) {
    const parsed = parseJwt(token);
    return parsed.exp ? parsed.exp * 1000 : null;
  }
  return null;
};

export const tokenIsExpired = (token: string) => {
  const tokenExpiryTime = tokenExp(token);
  if (tokenExpiryTime) {
    return tokenExpiryTime < new Date().getTime();
  }
  return false;
};

export const removeUserManagerEventListener = (
  oidcUserManager: UserManager,
  eventName: string,
  eventListener: PiniaOidcStoreListeners
) => {
  const removeFnName = "remove" + firstLetterUppercase(eventName);
  if (
    typeof oidcUserManager.events[removeFnName] === "function" &&
    typeof eventListener === "function"
  ) {
    oidcUserManager.events[removeFnName](eventListener);
  }
};

export const processSilentSignInCallback = (
  oidcSettings: OidcClientSettings
) => {
  const oidcConfig = getOidcConfig(oidcSettings);

  requiredConfigProperties.forEach((requiredProperty) => {
    if (!oidcConfig[requiredProperty]) {
      throw new Error(
        "Required oidc setting " +
          requiredProperty +
          " missing for creating UserManager"
      );
    }
  });
  return new UserManager(oidcConfig).signinSilentCallback();
};

export const processSignInCallback = (oidcSettings: OidcClientSettings) => {
  return new Promise((resolve, reject) => {
    const oidcUserManager = createOidcUserManager(oidcSettings);
    oidcUserManager
      .signinRedirectCallback()
      .then((user) => {
        resolve(sessionStorage.getItem("vuex_oidc_active_route") || "/");
      })
      .catch((err) => {
        reject(err);
      });
  });
};
