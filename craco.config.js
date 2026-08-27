const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    configure: (webpackConfig) => {
      // dxf-viewer is ESM but uses extensionless relative imports
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        include: /node_modules[\\/]dxf-viewer/,
        resolve: {
          fullySpecified: false,
        },
      });

      // Allow web workers to bundle dxf-viewer (ESM with extensionless imports)
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.oneOf) {
          rule.oneOf.forEach((one) => {
            if (one.type === "asset/resource" && /\.worker\.js$/.test(String(one.test))) {
              one.resolve = { ...(one.resolve || {}), fullySpecified: false };
            }
          });
        }
      });

      return webpackConfig;
    },
  },
  devServer: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        ws: true,
        cookieDomainRewrite: "",
        cookiePathRewrite: "/",
        onProxyRes(proxyRes) {
          const cookies = proxyRes.headers["set-cookie"];
          if (cookies) {
            proxyRes.headers["set-cookie"] = cookies.map((cookie) =>
              cookie
                .replace(/;\s*Secure/gi, "")
                .replace(/;\s*Domain=[^;]+/gi, "")
            );
          }
        },
      },
    },
  },
};
