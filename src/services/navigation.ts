export const openUrlWithIframe = (url: string | null) => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(
        new Error("gotoUrlWithIframe does not work when window is undefined")
      );
    }

    if (!url) return;

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
