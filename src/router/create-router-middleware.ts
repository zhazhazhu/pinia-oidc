import { Store } from "../index";

const createRouter = (store: Store) => {
  return (to, from, next) => {
    store["oidcCheckAccess"](to).then((hasAccess) => {
      if (hasAccess) {
        next();
      }
    });
  };
};

export default createRouter;
