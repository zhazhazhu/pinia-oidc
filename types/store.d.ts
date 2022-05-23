export type PiniaStore<S, G, A> = {
  id: string;
  state: () => S;
  getters?: G;
  actions?: A;
};

export interface PiniaState<T = any> {
  access_token: string | null;
  id_token: string | null;
  refresh_token: string | null;
  user: T | null;
  scopes: any;
  is_checked: boolean;
  events_are_bound: boolean;
  error: any;
}
