## Look this

if you use vue3 then recommend you use [vue3-oidc](https://github.com/zhazhazhu/vue3-oidc),it doesn't need to rely on any store, router. it can reactive auth and user data,better api

## 📦 Install

```bash
pnpm i pinia-oidc
yarn pinia-oidc
```

## Usage

```ts
//oidc.ts
import { defineStore } from "pinia";
import { store } from "@/pinia";
import {
  piniaOidcCreateRouterMiddleware,
  piniaOidcCreateStoreModule,
} from "pinia-oidc";

const oidcSettings = {
  authority: "",
  scope: "",
  client_id: "",
  client_secret: "",
  redirectUri: origin + "/oidc-callback",
  popupRedirectUri: origin + "/oidc-popup-callback",
  response_type: "",
  automaticSilentRenew: true,
  automaticSilentSignin: false,
  silentRedirectUri: origin + "/silent-renew-oidc.html",
  acr_values: null,
};

//创建oidc储存
const oidcStoreModule = piniaOidcCreateStoreModule(oidcSettings)
export const useOidcStore = defineStore('oidc', oidcStoreModule)

//创建路由中间件
router.beforeEach(piniaOidcCreateRouterMiddleware(useOidcStore()));
```

## pinia state

```ts
const oidcStore = useOidcStore();

access_token: string | null;
id_token: string | null;
refresh_token: string | null;
user: any | null;
scopes: any | null;
is_checked: boolean;
events_are_bound: boolean;
error: any;
```

## pinia actions

```ts
const oidcStore = useOidcStore();

//signOutOidc => Promise<void>
oidcStore.signOutOidc();

//oidcSignInCallback => Promise<string>
oidcStore.oidcSignInCallback().then((url) => {
  console.log(url);
});

//oidcSignInPopupCallback => Promise<void>
oidcStore.oidcSignInPopupCallback();

//authenticateOidc => Promise<void>
//将当前窗口重定向到授权端点
oidcStore.authenticateOidc();

//setOidcAuth(arg) => Promise<void>
//设置pinia state
oidcStore.setOidcAuth(arg);
```
