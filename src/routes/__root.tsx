import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { ChromeBoot } from "@/components/chrome-boot";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Shell } from "@/components/shell";
import appCss from "../styles.css?url";

const APP_NAME = "KalaiyaOnline";
const APP_DESC = "कलैयाअनलाइन — कलैया, बारा र मधेशको स्थानीय समाचार एप।";
const MUKTA =
  "https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&display=swap";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#14934E" },
      { name: "description", content: APP_DESC },
      { name: "robots", content: "index,follow" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "stylesheet", href: MUKTA },
    ],
  }),
  component: () => (
    <html lang="ne" className="antialiased" prefix="og: https://ogp.me/ns#" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-paper text-ink">
        <PreviewHostBridge />
        <AuthProvider>
          <ChromeBoot>
            <Shell>
              <Outlet />
            </Shell>
          </ChromeBoot>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
