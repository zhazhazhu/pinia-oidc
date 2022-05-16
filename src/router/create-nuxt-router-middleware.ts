const createNextRouter = (store) => {
  return (context) => {
    return new Promise((resolve, reject) => {
      store["oidcCheckAccess"](context.route)
        .then((hasAccess) => {
          if (hasAccess) {
            resolve(true);
          }
        })
        .catch(() => {});
    });
  };
};

export default createNextRouter;
