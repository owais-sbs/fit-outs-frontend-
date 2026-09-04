/** Let the browser set multipart boundary (axios default JSON Content-Type breaks uploads). */
export function multipartConfig(extra = {}) {
  return {
    ...extra,
    transformRequest: [
      (data, headers) => {
        if (data instanceof FormData) {
          delete headers["Content-Type"];
        }
        return data;
      },
      ...(Array.isArray(extra.transformRequest)
        ? extra.transformRequest
        : extra.transformRequest
          ? [extra.transformRequest]
          : []),
    ],
  };
}
