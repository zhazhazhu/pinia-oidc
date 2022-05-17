import { SignoutRequest, User } from "oidc-client-ts";
import {
  AuthenticateOidcSilentPayload,
  PiniaOidcClientSettings,
  PiniaOidcStoreListeners,
  PiniaOidcStoreSettings,
} from "../../types/oidc";
import { PiniaState, PiniaStore } from "../../types/store";
import { dispatchCustomBrowserEvent } from "../services/browser-event";
import { openUrlWithIframe } from "../services/navigation";
import {
  addUserManagerEventListener,
  createOidcUserManager,
  getOidcCallbackPath,
  getOidcConfig,
  removeUserManagerEventListener,
  tokenExp,
  tokenIsExpired,
} from "../services/oidc-helpers";
import { objectAssign } from "../services/utils";

const state: PiniaState = {
  access_token: null,
  id_token: null,
  refresh_token: null,
  user: null,
  scopes: null,
  is_checked: false,
  events_are_bound: false,
  error: null,
};

const createStoreModule = (
  oidcSettings: PiniaOidcClientSettings,
  storeSettings: PiniaOidcStoreSettings = {},
  oidcEventListeners: PiniaOidcStoreListeners = {}
) => {
  const oidcConfig = getOidcConfig(oidcSettings);

  const oidcUserManager = createOidcUserManager(oidcSettings);

  storeSettings = objectAssign<PiniaOidcStoreSettings>([
    {
      isAuthenticatedBy: "id_token",
    },
    storeSettings,
  ]);

  const oidcCallbackPath = getOidcCallbackPath(
    oidcConfig.redirect_uri,
    storeSettings.routeBase || "/"
  );

  const oidcPopupCallbackPath = getOidcCallbackPath(
    oidcConfig.popup_redirect_uri,
    storeSettings.routeBase || "/"
  );

  const oidcSilentCallbackPath = getOidcCallbackPath(
    oidcConfig.silent_redirect_uri,
    storeSettings.routeBase || "/"
  );

  Object.keys(oidcEventListeners).forEach((eventName) => {
    addUserManagerEventListener(
      oidcUserManager,
      eventName,
      oidcEventListeners[eventName]
    );
  });

  if (storeSettings.dispatchEventsOnWindow) {
    // Dispatch oidc-client events on window (if in browser)
    const userManagerEvents = [
      "userLoaded",
      "userUnloaded",
      "accessTokenExpiring",
      "accessTokenExpired",
      "silentRenewError",
      "userSignedOut",
    ];
    userManagerEvents.forEach((eventName) => {
      addUserManagerEventListener(oidcUserManager, eventName, (detail) => {
        dispatchCustomBrowserEvent(eventName, detail || {});
      });
    });
  }

  function isAuthenticated(store) {
    if (
      storeSettings?.isAuthenticatedBy &&
      store?.[storeSettings.isAuthenticatedBy]
    ) {
      return true;
    }

    return false;
  }

  const routeIsPublic = (route) => {
    if (route.meta && route.meta.isPublic) {
      return true;
    }
    if (
      route.meta &&
      Array.isArray(route.meta) &&
      route.meta.reduce((isPublic, meta) => meta.isPublic || isPublic, false)
    ) {
      return true;
    }
    if (
      storeSettings.publicRoutePaths &&
      storeSettings.publicRoutePaths
        .map((path) => path.replace(/\/$/, ""))
        .indexOf(route.path.replace(/\/$/, "")) > -1
    ) {
      return true;
    }
    if (
      storeSettings.isPublicRoute &&
      typeof storeSettings.isPublicRoute === "function"
    ) {
      return storeSettings.isPublicRoute(route);
    }
    return false;
  };

  const routeIsOidcCallback = (route) => {
    if (route.meta && route.meta.isOidcCallback) {
      return true;
    }
    if (
      route.meta &&
      Array.isArray(route.meta) &&
      route.meta.reduce(
        (isOidcCallback, meta) => meta.isOidcCallback || isOidcCallback,
        false
      )
    ) {
      return true;
    }
    if (route.path && route.path.replace(/\/$/, "") === oidcCallbackPath) {
      return true;
    }
    if (route.path && route.path.replace(/\/$/, "") === oidcPopupCallbackPath) {
      return true;
    }
    if (
      route.path &&
      route.path.replace(/\/$/, "") === oidcSilentCallbackPath
    ) {
      return true;
    }
    return false;
  };

  const errorPayload = (context, error): PiniaOidcStoreListeners => {
    return {
      context,
      error: error && error.message ? error.message : error,
    };
  };

  function authenticateOidcSilent(payload: AuthenticateOidcSilentPayload = {}) {
    // Take options for signinSilent from 1) payload or 2) storeSettings if defined there
    const options =
      payload.options || storeSettings.defaultSigninSilentOptions || {};
    return new Promise((resolve, reject) => {
      oidcUserManager
        .signinSilent(options)
        .then((user) => {
          this["oidcWasAuthenticated"](user);
          resolve(user);
        })
        .catch((err) => {
          this["setOidcAuthIsChecked"];
          if (payload.ignoreErrors) {
            resolve(null);
          } else {
            this["setOidcError"](errorPayload("authenticateOidcSilent", err));
            reject(err);
          }
        });
    });
  }

  const dispatchCustomErrorEvent = (
    eventName: string,
    payload: PiniaOidcStoreListeners
  ) => {
    // oidcError and automaticSilentRenewError are not UserManagement events, they are events implemeted in vuex-oidc,
    if (typeof oidcEventListeners[eventName] === "function") {
      oidcEventListeners[eventName](payload);
    }
    if (storeSettings.dispatchEventsOnWindow) {
      dispatchCustomBrowserEvent(eventName, payload);
    }
  };

  const store = <S, G, A>(
    id,
    state: S,
    getters?: G,
    actions?: A
  ): PiniaStore<S, G, A> => ({ id, state: () => state, getters, actions });

  const getters = {
    oidcIsAuthenticated() {
      return isAuthenticated(this);
    },
    oidcUser() {
      return this.user;
    },
    oidcAccessToken() {
      return tokenIsExpired(this.access_token) ? null : this.access_token;
    },
    oidcAccessTokenExp() {
      return tokenExp(this.access_token);
    },
    oidcScopes() {
      return this.scopes;
    },
    oidcIdToken() {
      return tokenIsExpired(this.id_token) ? null : this.id_token;
    },
    oidcIdTokenExp() {
      return tokenExp(this.id_token);
    },
    oidcRefreshToken() {
      return tokenIsExpired(this.refresh_token) ? null : this.refresh_token;
    },
    oidcRefreshTokenExp() {
      return tokenExp(this.refresh_token);
    },
    oidcAuthenticationIsChecked() {
      return this.is_checked;
    },
    oidcError() {
      return this.error;
    },
    oidcIsRoutePublic() {
      return (route) => {
        return routeIsPublic(route);
      };
    },
  };

  const actions = {
    oidcCheckAccess(route) {
      return new Promise((resolve) => {
        if (routeIsOidcCallback(route)) {
          resolve(true);
          return;
        }
        let hasAccess = true;
        const getUserPromise: Promise<User | null> = new Promise((resolve) => {
          oidcUserManager
            .getUser()
            .then((user) => {
              resolve(user);
            })
            .catch(() => {
              resolve(null);
            });
        });
        const isAuthenticatedInStore = isAuthenticated(this);
        getUserPromise.then((user) => {
          if (!user || user.expired) {
            const authenticateSilently =
              oidcConfig.silent_redirect_uri &&
              oidcConfig.automaticSilentSignin;
            if (routeIsPublic(route)) {
              if (isAuthenticatedInStore) {
                this["unsetOidcAuth"]();
              }
              if (authenticateSilently) {
                authenticateOidcSilent({ ignoreErrors: true }).catch(() => {});
              }
            } else {
              const authenticate = () => {
                if (isAuthenticatedInStore) {
                  this["unsetOidcAuth"]();
                }
                this["authenticateOidc"]({
                  redirectPath: route.fullPath,
                });
              };
              // If silent signin is set up, try to authenticate silently before denying access
              if (authenticateSilently) {
                authenticateOidcSilent({ ignoreErrors: true })
                  .then(() => {
                    oidcUserManager
                      .getUser()
                      .then((user) => {
                        if (!user || user.expired) {
                          authenticate();
                        }
                        resolve(!!user);
                      })
                      .catch(() => {
                        authenticate();
                        resolve(false);
                      });
                  })
                  .catch(() => {
                    authenticate();
                    resolve(false);
                  });
                return;
              }
              // If no silent signin is set up, perform explicit authentication and deny access
              authenticate();
              hasAccess = false;
            }
          } else {
            this["oidcWasAuthenticated"](user);
            if (!isAuthenticatedInStore) {
              if (
                oidcEventListeners &&
                typeof oidcEventListeners.userLoaded === "function"
              ) {
                oidcEventListeners.userLoaded(user);
              }
              if (storeSettings.dispatchEventsOnWindow) {
                dispatchCustomBrowserEvent("userLoaded", user);
              }
            }
          }
          resolve(hasAccess);
        });
      });
    },
    authenticateOidc(payload: AuthenticateOidcSilentPayload | string = {}) {
      if (typeof payload === "string") {
        payload = { redirectPath: payload };
      }
      if (payload.redirectPath) {
        sessionStorage.setItem("vuex_oidc_active_route", payload.redirectPath);
      } else {
        sessionStorage.removeItem("vuex_oidc_active_route");
      }
      // Take options for signinRedirect from 1) payload or 2) storeSettings if defined there
      const options =
        payload.options || storeSettings.defaultSigninRedirectOptions || {};
      return oidcUserManager.signinRedirect(options).catch((err) => {
        this["setOidcError"](errorPayload("authenticateOidc", err));
      });
    },
    oidcSignInCallback(url: string) {
      return new Promise((resolve, reject) => {
        oidcUserManager
          .signinRedirectCallback(url)
          .then((user) => {
            this["oidcWasAuthenticated"](user);
            resolve(sessionStorage.getItem("vuex_oidc_active_route") || "/");
          })
          .catch((err) => {
            this["setOidcError"](errorPayload("oidcSignInCallback", err));
            this["setOidcAuthIsChecked"]();
            reject(err);
          });
      });
    },
    authenticateOidcSilent(payload: AuthenticateOidcSilentPayload = {}) {
      return authenticateOidcSilent(payload);
    },
    authenticateOidcPopup(payload: AuthenticateOidcSilentPayload = {}) {
      // Take options for signinPopup from 1) payload or 2) storeSettings if defined there
      const options =
        payload.options || storeSettings.defaultSigninPopupOptions || {};
      return oidcUserManager
        .signinPopup(options)
        .then((user) => {
          this["oidcWasAuthenticated"](user);
        })
        .catch((err) => {
          this["setOidcError"](errorPayload("authenticateOidcPopup", err));
        });
    },
    oidcSignInPopupCallback(url: string) {
      return new Promise((resolve, reject) => {
        oidcUserManager.signinPopupCallback(url).catch((err) => {
          this["setOidcError"](errorPayload("authenticateOidcPopup", err));
          this["setOidcAuthIsChecked"]();
          reject(err);
        });
      });
    },
    oidcWasAuthenticated(user: User) {
      this["setOidcAuth"](user);
      if (!this.events_are_bound) {
        oidcUserManager.events.addAccessTokenExpired(() => {
          this["unsetOidcAuth"]();
        });
        if (oidcSettings.automaticSilentRenew) {
          oidcUserManager.events.addAccessTokenExpiring(() => {
            authenticateOidcSilent().catch((err) => {
              dispatchCustomErrorEvent(
                "automaticSilentRenewError",
                errorPayload("authenticateOidcSilent", err)
              );
            });
          });
        }
        this["setOidcEventsAreBound"]();
      }
      this["setOidcAuthIsChecked"]();
    },
    storeOidcUser(user: User) {
      return oidcUserManager
        .storeUser(user)
        .then(() => oidcUserManager.getUser())
        .then((user) => this["oidcWasAuthenticated"](user))
        .then(() => {})
        .catch((err) => {
          this["setOidcError"](errorPayload("storeOidcUser", err));
          this["setOidcAuthIsChecked"]();
          throw err;
        });
    },
    getOidcUser() {
      /* istanbul ignore next */
      return oidcUserManager.getUser().then((user) => {
        this["setOidcUser"](user);
        return user;
      });
    },
    addOidcEventListener(payload: {
      eventName: string;
      eventListener: PiniaOidcStoreListeners;
    }) {
      /* istanbul ignore next */
      addUserManagerEventListener(
        oidcUserManager,
        payload.eventName,
        payload.eventListener
      );
    },
    removeOidcEventListener(payload: {
      eventName: string;
      eventListener: PiniaOidcStoreListeners;
    }) {
      /* istanbul ignore next */
      removeUserManagerEventListener(
        oidcUserManager,
        payload.eventName,
        payload.eventListener
      );
    },
    signOutOidc(payload) {
      /* istanbul ignore next */
      return oidcUserManager.signoutRedirect(payload).then(() => {
        this["unsetOidcAuth"]();
      });
    },
    signOutOidcCallback() {
      /* istanbul ignore next */
      return oidcUserManager.signoutRedirectCallback();
    },
    signOutPopupOidc(payload) {
      /* istanbul ignore next */
      return oidcUserManager.signoutPopup(payload).then(() => {
        this["unsetOidcAuth"]();
      });
    },
    signOutPopupOidcCallback() {
      /* istanbul ignore next */
      return oidcUserManager.signoutPopupCallback();
    },
    signOutOidcSilent(payload) {
      /* istanbul ignore next */
      return new Promise((resolve, reject) => {
        try {
          oidcUserManager
            .getUser()
            .then((user) => {
              const args = objectAssign([
                payload || {},
                {
                  id_token_hint: user ? user.id_token : null,
                },
              ]);
              if (payload && payload.id_token_hint) {
                args.id_token_hint = payload.id_token_hint;
              }
              //此处api不确定
              openUrlWithIframe(new SignoutRequest(args).url);
            })
            .catch((err) => reject(err));
        } catch (err) {
          reject(err);
        }
      });
    },
    removeUser() {
      /* istanbul ignore next */
      return this["removeOidcUser"]();
    },
    removeOidcUser() {
      /* istanbul ignore next */
      return oidcUserManager.removeUser().then(() => {
        this["unsetOidcAuth"];
      });
    },
    clearStaleState() {
      return oidcUserManager.clearStaleState();
    },
    setOidcAuth(user: User) {
      this.id_token = user.id_token;
      this.access_token = user.access_token;
      this.refresh_token = user.refresh_token;
      this.user = user.profile;
      this.scopes = user.scopes;
      this.error = null;
    },
    setOidcUser(user: User) {
      this.user = user ? user.profile : null;
    },
    unsetOidcAuth() {
      this.id_token = null;
      this.access_token = null;
      this.refresh_token = null;
      this.user = null;
    },
    setOidcAuthIsChecked() {
      this.is_checked = true;
    },
    setOidcEventsAreBound() {
      this.events_are_bound = true;
    },
    setOidcError(payload) {
      this.error = payload.error;
      dispatchCustomErrorEvent("oidcError", payload);
    },
  };

  return store("oidc", state, getters, actions);
};

export default createStoreModule;
