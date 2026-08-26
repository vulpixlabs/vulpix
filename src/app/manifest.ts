import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Vulpix",
    short_name: "Vulpix",
    description:
      "The intelligent gateway to AI. Search models and datasets, chat in the playground, and rank models in the arena.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#000000",
    theme_color: "#F54F1B",
    lang: "en",
    dir: "ltr",
    categories: ["developer", "productivity", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Vulpix landing page on desktop",
      },
      {
        src: "/screenshots/narrow.png",
        sizes: "720x1280",
        type: "image/png",
        form_factor: "narrow",
        label: "Vulpix model hub on mobile",
      },
    ],
    shortcuts: [
      {
        name: "Model Hub",
        short_name: "Hub",
        description: "Search models and datasets",
        url: "/hub",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Playground",
        short_name: "Playground",
        description: "Chat with any model using your own key",
        url: "/playground",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Arena",
        short_name: "Arena",
        description: "Compare models side by side",
        url: "/arena",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
