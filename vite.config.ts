import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          icon: true,
          // This will transform your SVG to a React component
          exportType: "named",
          namedExport: "ReactComponent",
        },
      }),
    ],
    server: {
      port: 3002, // Your frontend dev server port (Vite default is 5173, often people use 3000)
      proxy: {
        // Proxy API requests to your backend server
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8000', // Target your backend server
          changeOrigin: true, // Recommended for virtual hosted sites
          secure: false,      // Set to true if your backend server uses HTTPS
        },
      },
    },
  }
});
