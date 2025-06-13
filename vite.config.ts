import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
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
        target: 'http://192.168.2.245:3001', // Target your backend server (port from server.ts)
        changeOrigin: true, // Recommended for virtual hosted sites
        secure: false,      // Set to true if your backend server uses HTTPS
        // You might not need rewrite if your backend paths already include /api
        // rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
});
