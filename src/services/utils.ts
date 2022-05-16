export const objectAssign = <T = any>(array): T => {
  return array.reduce((r: T, item) => {
    Object.keys(item || {}).forEach((k) => {
      r[k] = item[k];
    });
    return r;
  }, {});
};

export const parseJwt = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace("-", "+").replace("_", "/");
    return JSON.parse(window.atob(base64));
  } catch (error) {
    return {};
  }
};

export const firstLetterUppercase = (str: string) => {
  return str && str.length > 0
    ? str.charAt(0).toUpperCase() + str.slice(1)
    : "";
};

export const camelCaseToSnakeCase = (str: string) => {
  return str
    .split(/(?=[A-Z])/)
    .join("_")
    .toLowerCase();
};
