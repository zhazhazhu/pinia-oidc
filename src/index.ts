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

export {
  createOidcUserManager as piniaOidcCreateUserManager,
  createStoreModule as piniaOidcCreateStoreModule,
  createNextRouter as piniaOidcCreateNextRouterMiddleware,
  createRouter as piniaOidcCreateRouterMiddleware,
  processSilentSignInCallback as piniaOidcProcessSilentSignInCallback,
  processSignInCallback as piniaOidcProcessSignInCallback,
  getOidcCallbackPath as piniaOidcGetOidcCallbackPath,
  dispatchCustomBrowserEvent as vuexDispatchCustomBrowserEvent,
  utils as piniaOidcUtils,
};
