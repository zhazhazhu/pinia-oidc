import createNextRouter from "./router/create-nuxt-router-middleware";
import createRouter from "./router/create-router-middleware";
import { dispatchCustomBrowserEvent } from "./services/browser-event";
import {
  createOidcUserManager,
  getOidcCallbackPath,
  processSignInCallback,
  processSilentSignInCallback,
} from "./services/oidc-helpers";
import * as utils from "./services/utils";
import createStoreModule from "./store/create-store-module";

export const piniaOidcCreateUserManager = createOidcUserManager;

export const piniaOidcCreateStoreModule = createStoreModule;

export const piniaOidcCreateNextRouterMiddleware = createNextRouter;

export const piniaOidcCreateRouterMiddleware = createRouter;

export const piniaOidcProcessSilentSignInCallback = processSilentSignInCallback;

export const piniaOidcProcessSignInCallback = processSignInCallback;

export const piniaOidcGetOidcCallbackPath = getOidcCallbackPath;

export const vuexDispatchCustomBrowserEvent = dispatchCustomBrowserEvent;

export const piniaOidcUtils = utils;
