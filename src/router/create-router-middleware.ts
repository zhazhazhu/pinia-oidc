const createRouter = (store) => {
  return (to, from, next) => {
    store["oidcCheckAccess"](to).then((hasAccess) => {
      if (hasAccess) {
        next();
      }
    });
  };
};

export default createRouter;
