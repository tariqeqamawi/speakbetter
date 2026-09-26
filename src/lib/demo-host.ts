// The private address for showing the app on a screen share - long enough
// that nobody can copy it off a video. Choosing a tier on it opens the app
// already worked in (lib/demo-state): trophies, a spectrum, a streak,
// challenges passed. Anywhere else the app starts fresh as it should.
export const DEMO_HOSTS = ["sb-5bk8j1ug8htv4sl9xm67xiioof7ptwrzokka2lln.vercel.app"];

export function onDemoHost(): boolean {
  return typeof window !== "undefined" && DEMO_HOSTS.includes(window.location.hostname);
}
