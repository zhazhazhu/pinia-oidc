'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var oidcClientTs = require('oidc-client-ts');

const createNextRouter = (store) => {
    return (context) => {
        return new Promise((resolve, reject) => {
            store["oidcCheckAccess"](context.route)
                .then((hasAccess) => {
                if (hasAccess) {
                    resolve(true);
                }
            })
                .catch(() => { });
        });
    };
};

const createRouter = (store) => {
    return (to, from, next) => {
        store["oidcCheckAccess"](to).then((hasAccess) => {
            if (hasAccess) {
                next();
            }
        });
    };
};

const objectAssign = (array) => {
    return array.reduce((r, item) => {
        Object.keys(item || {}).forEach((k) => {
            r[k] = item[k];
        });
        return r;
    }, {});
};
const parseJwt = (token) => {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace("-", "+").replace("_", "/");
        return JSON.parse(window.atob(base64));
    }
    catch (error) {
        return {};
    }
};
const firstLetterUppercase = (str) => {
    return str && str.length > 0
        ? str.charAt(0).toUpperCase() + str.slice(1)
        : "";
};
const camelCaseToSnakeCase = (str) => {
    return str
        .split(/(?=[A-Z])/)
        .join("_")
        .toLowerCase();
};

var utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  objectAssign: objectAssign,
  parseJwt: parseJwt,
  firstLetterUppercase: firstLetterUppercase,
  camelCaseToSnakeCase: camelCaseToSnakeCase
});

function createCustomEvent(eventName, detail, params) {
    const prefixedEventName = "vuexoidc:" + eventName;
    if (typeof window.CustomEvent === "function") {
        params = objectAssign([params, { detail: detail }]);
        return new window.CustomEvent(prefixedEventName, params);
    }
    params = params || { bubbles: false, cancelable: false };
    params = objectAssign([params, { detail: detail }]);
    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(prefixedEventName, params.bubbles, params.cancelable, params.detail);
    return evt;
}
function dispatchCustomBrowserEvent(eventName, detail = {}, params = {}) {
    if (window) {
        const event = createCustomEvent(eventName, objectAssign([{}, detail]), params);
        window.dispatchEvent(event);
    }
}

const defaultOidcConfig = {
    userStore: new oidcClientTs.WebStorageStateStore(),
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
const settingsThatAreSnakeCasedInOidcClient = [
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
const snakeCasedSettings = (oidcSettings) => {
    settingsThatAreSnakeCasedInOidcClient.forEach((setting) => {
        if (typeof oidcSettings[setting] !== "undefined") {
            oidcSettings[camelCaseToSnakeCase(setting)] = oidcSettings[setting];
        }
    });
    return oidcSettings;
};
const getOidcConfig = (oidcSettings) => {
    return objectAssign([
        defaultOidcConfig,
        snakeCasedSettings(oidcSettings),
        { automaticSilentRenew: false },
    ]);
};
const createOidcUserManager = (oidcSettings) => {
    const oidcConfig = getOidcConfig(oidcSettings);
    requiredConfigProperties.forEach((requiredProperty) => {
        if (!oidcConfig[requiredProperty]) {
            throw new Error("Required oidc setting " +
                requiredProperty +
                " missing for creating UserManager");
        }
    });
    return new oidcClientTs.UserManager(oidcConfig);
};
const getOidcCallbackPath = (callbackUri, routeBase = "/") => {
    if (callbackUri) {
        const domainStartsAt = "://";
        const hostAndPath = callbackUri.substr(callbackUri.indexOf(domainStartsAt) + domainStartsAt.length);
        return hostAndPath
            .substr(hostAndPath.indexOf(routeBase) + routeBase.length - 1)
            .replace(/\/$/, "");
    }
    return null;
};
const addUserManagerEventListener = (oidcUserManager, eventName, eventListener) => {
    const addFnName = "add" + firstLetterUppercase(eventName);
    if (typeof oidcUserManager.events[addFnName] === "function" &&
        typeof eventListener === "function") {
        oidcUserManager.events[addFnName](eventListener);
    }
};
const tokenExp = (token) => {
    if (token) {
        const parsed = parseJwt(token);
        return parsed.exp ? parsed.exp * 1000 : null;
    }
    return null;
};
const tokenIsExpired = (token) => {
    const tokenExpiryTime = tokenExp(token);
    if (tokenExpiryTime) {
        return tokenExpiryTime < new Date().getTime();
    }
    return false;
};
const removeUserManagerEventListener = (oidcUserManager, eventName, eventListener) => {
    const removeFnName = "remove" + firstLetterUppercase(eventName);
    if (typeof oidcUserManager.events[removeFnName] === "function" &&
        typeof eventListener === "function") {
        oidcUserManager.events[removeFnName](eventListener);
    }
};
const processSilentSignInCallback = (oidcSettings) => {
    const oidcConfig = getOidcConfig(oidcSettings);
    requiredConfigProperties.forEach((requiredProperty) => {
        if (!oidcConfig[requiredProperty]) {
            throw new Error("Required oidc setting " +
                requiredProperty +
                " missing for creating UserManager");
        }
    });
    return new oidcClientTs.UserManager(oidcConfig).signinSilentCallback();
};
const processSignInCallback = (oidcSettings) => {
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

const openUrlWithIframe = (url) => {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") {
            reject(new Error("gotoUrlWithIframe does not work when window is undefined"));
        }
        if (!url)
            return;
        const iframe = window.document.createElement("iframe");
        iframe.style.display = "none";
        iframe.onload = () => {
            iframe.parentNode?.removeChild(iframe);
            resolve(true);
        };
        iframe.src = url;
        window.document.body.appendChild(iframe);
    });
};

const state = {
    access_token: null,
    id_token: null,
    refresh_token: null,
    user: null,
    scopes: null,
    is_checked: false,
    events_are_bound: false,
    error: null,
};
const createStoreModule = (oidcSettings, storeSettings = {}, oidcEventListeners = {}) => {
    const oidcConfig = getOidcConfig(oidcSettings);
    const oidcUserManager = createOidcUserManager(oidcSettings);
    storeSettings = objectAssign([
        {
            isAuthenticatedBy: "id_token",
        },
        storeSettings,
    ]);
    const oidcCallbackPath = getOidcCallbackPath(oidcConfig.redirect_uri, storeSettings.routeBase || "/");
    const oidcPopupCallbackPath = getOidcCallbackPath(oidcConfig.popup_redirect_uri, storeSettings.routeBase || "/");
    const oidcSilentCallbackPath = getOidcCallbackPath(oidcConfig.silent_redirect_uri, storeSettings.routeBase || "/");
    Object.keys(oidcEventListeners).forEach((eventName) => {
        addUserManagerEventListener(oidcUserManager, eventName, oidcEventListeners[eventName]);
    });
    if (storeSettings.dispatchEventsOnWindow) {
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
        if (storeSettings?.isAuthenticatedBy &&
            store?.[storeSettings.isAuthenticatedBy]) {
            return true;
        }
        return false;
    }
    const routeIsPublic = (route) => {
        if (route.meta && route.meta.isPublic) {
            return true;
        }
        if (route.meta &&
            Array.isArray(route.meta) &&
            route.meta.reduce((isPublic, meta) => meta.isPublic || isPublic, false)) {
            return true;
        }
        if (storeSettings.publicRoutePaths &&
            storeSettings.publicRoutePaths
                .map((path) => path.replace(/\/$/, ""))
                .indexOf(route.path.replace(/\/$/, "")) > -1) {
            return true;
        }
        if (storeSettings.isPublicRoute &&
            typeof storeSettings.isPublicRoute === "function") {
            return storeSettings.isPublicRoute(route);
        }
        return false;
    };
    const routeIsOidcCallback = (route) => {
        if (route.meta && route.meta.isOidcCallback) {
            return true;
        }
        if (route.meta &&
            Array.isArray(route.meta) &&
            route.meta.reduce((isOidcCallback, meta) => meta.isOidcCallback || isOidcCallback, false)) {
            return true;
        }
        if (route.path && route.path.replace(/\/$/, "") === oidcCallbackPath) {
            return true;
        }
        if (route.path && route.path.replace(/\/$/, "") === oidcPopupCallbackPath) {
            return true;
        }
        if (route.path &&
            route.path.replace(/\/$/, "") === oidcSilentCallbackPath) {
            return true;
        }
        return false;
    };
    const errorPayload = (context, error) => {
        return {
            context,
            error: error && error.message ? error.message : error,
        };
    };
    function authenticateOidcSilent(payload = {}) {
        const options = payload.options || storeSettings.defaultSigninSilentOptions || {};
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
                }
                else {
                    this["setOidcError"](errorPayload("authenticateOidcSilent", err));
                    reject(err);
                }
            });
        });
    }
    const dispatchCustomErrorEvent = (eventName, payload) => {
        if (typeof oidcEventListeners[eventName] === "function") {
            oidcEventListeners[eventName](payload);
        }
        if (storeSettings.dispatchEventsOnWindow) {
            dispatchCustomBrowserEvent(eventName, payload);
        }
    };
    const store = (id, state, getters, actions) => ({ id, state: () => state, getters, actions });
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
                const getUserPromise = new Promise((resolve) => {
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
                        const authenticateSilently = oidcConfig.silent_redirect_uri &&
                            oidcConfig.automaticSilentSignin;
                        if (routeIsPublic(route)) {
                            if (isAuthenticatedInStore) {
                                this["unsetOidcAuth"]();
                            }
                            if (authenticateSilently) {
                                authenticateOidcSilent({ ignoreErrors: true }).catch(() => { });
                            }
                        }
                        else {
                            const authenticate = () => {
                                if (isAuthenticatedInStore) {
                                    this["unsetOidcAuth"]();
                                }
                                this["authenticateOidc"]({
                                    redirectPath: route.fullPath,
                                });
                            };
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
                            authenticate();
                            hasAccess = false;
                        }
                    }
                    else {
                        this["oidcWasAuthenticated"](user);
                        if (!isAuthenticatedInStore) {
                            if (oidcEventListeners &&
                                typeof oidcEventListeners.userLoaded === "function") {
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
        authenticateOidc(payload = {}) {
            if (typeof payload === "string") {
                payload = { redirectPath: payload };
            }
            if (payload.redirectPath) {
                sessionStorage.setItem("vuex_oidc_active_route", payload.redirectPath);
            }
            else {
                sessionStorage.removeItem("vuex_oidc_active_route");
            }
            const options = payload.options || storeSettings.defaultSigninRedirectOptions || {};
            return oidcUserManager.signinRedirect(options).catch((err) => {
                this["setOidcError"](errorPayload("authenticateOidc", err));
            });
        },
        oidcSignInCallback(url) {
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
        authenticateOidcSilent(payload = {}) {
            return authenticateOidcSilent(payload);
        },
        authenticateOidcPopup(payload = {}) {
            const options = payload.options || storeSettings.defaultSigninPopupOptions || {};
            return oidcUserManager
                .signinPopup(options)
                .then((user) => {
                this["oidcWasAuthenticated"](user);
            })
                .catch((err) => {
                this["setOidcError"](errorPayload("authenticateOidcPopup", err));
            });
        },
        oidcSignInPopupCallback(url) {
            return new Promise((resolve, reject) => {
                oidcUserManager.signinPopupCallback(url).catch((err) => {
                    this["setOidcError"](errorPayload("authenticateOidcPopup", err));
                    this["setOidcAuthIsChecked"]();
                    reject(err);
                });
            });
        },
        oidcWasAuthenticated(user) {
            this["setOidcAuth"](user);
            if (!this.events_are_bound) {
                oidcUserManager.events.addAccessTokenExpired(() => {
                    this["unsetOidcAuth"]();
                });
                if (oidcSettings.automaticSilentRenew) {
                    oidcUserManager.events.addAccessTokenExpiring(() => {
                        authenticateOidcSilent().catch((err) => {
                            dispatchCustomErrorEvent("automaticSilentRenewError", errorPayload("authenticateOidcSilent", err));
                        });
                    });
                }
                this["setOidcEventsAreBound"]();
            }
            this["setOidcAuthIsChecked"]();
        },
        storeOidcUser(user) {
            return oidcUserManager
                .storeUser(user)
                .then(() => oidcUserManager.getUser())
                .then((user) => this["oidcWasAuthenticated"](user))
                .then(() => { })
                .catch((err) => {
                this["setOidcError"](errorPayload("storeOidcUser", err));
                this["setOidcAuthIsChecked"]();
                throw err;
            });
        },
        getOidcUser() {
            return oidcUserManager.getUser().then((user) => {
                this["setOidcUser"](user);
                return user;
            });
        },
        addOidcEventListener(payload) {
            addUserManagerEventListener(oidcUserManager, payload.eventName, payload.eventListener);
        },
        removeOidcEventListener(payload) {
            removeUserManagerEventListener(oidcUserManager, payload.eventName, payload.eventListener);
        },
        signOutOidc(payload) {
            return oidcUserManager.signoutRedirect(payload).then(() => {
                this["unsetOidcAuth"]();
            });
        },
        signOutOidcCallback() {
            return oidcUserManager.signoutRedirectCallback();
        },
        signOutPopupOidc(payload) {
            return oidcUserManager.signoutPopup(payload).then(() => {
                this["unsetOidcAuth"]();
            });
        },
        signOutPopupOidcCallback() {
            return oidcUserManager.signoutPopupCallback();
        },
        signOutOidcSilent(payload) {
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
                        openUrlWithIframe(new oidcClientTs.SignoutRequest(args).url);
                    })
                        .catch((err) => reject(err));
                }
                catch (err) {
                    reject(err);
                }
            });
        },
        removeUser() {
            return this["removeOidcUser"]();
        },
        removeOidcUser() {
            return oidcUserManager.removeUser().then(() => {
                this["unsetOidcAuth"];
            });
        },
        clearStaleState() {
            return oidcUserManager.clearStaleState();
        },
        setOidcAuth(user) {
            this.id_token = user.id_token;
            this.access_token = user.access_token;
            this.refresh_token = user.refresh_token;
            this.user = user.profile;
            this.scopes = user.scopes;
            this.error = null;
        },
        setOidcUser(user) {
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

const piniaOidcCreateUserManager = createOidcUserManager;
const piniaOidcCreateStoreModule = createStoreModule;
const piniaOidcCreateNextRouterMiddleware = createNextRouter;
const piniaOidcCreateRouterMiddleware = createRouter;
const piniaOidcProcessSilentSignInCallback = processSilentSignInCallback;
const piniaOidcProcessSignInCallback = processSignInCallback;
const piniaOidcGetOidcCallbackPath = getOidcCallbackPath;
const vuexDispatchCustomBrowserEvent = dispatchCustomBrowserEvent;
const piniaOidcUtils = utils;

exports.piniaOidcCreateNextRouterMiddleware = piniaOidcCreateNextRouterMiddleware;
exports.piniaOidcCreateRouterMiddleware = piniaOidcCreateRouterMiddleware;
exports.piniaOidcCreateStoreModule = piniaOidcCreateStoreModule;
exports.piniaOidcCreateUserManager = piniaOidcCreateUserManager;
exports.piniaOidcGetOidcCallbackPath = piniaOidcGetOidcCallbackPath;
exports.piniaOidcProcessSignInCallback = piniaOidcProcessSignInCallback;
exports.piniaOidcProcessSilentSignInCallback = piniaOidcProcessSilentSignInCallback;
exports.piniaOidcUtils = piniaOidcUtils;
exports.vuexDispatchCustomBrowserEvent = vuexDispatchCustomBrowserEvent;
//# sourceMappingURL=index.js.map
