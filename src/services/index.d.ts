import { WebStorageStateStore } from "oidc-client-ts";

export interface DefaultOidcConfig {
  userStore: WebStorageStateStore;
  loadUserInfo: boolean;
  automaticSilentSignin: boolean;
}
