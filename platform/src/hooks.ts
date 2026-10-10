import { useEffect, useState } from "react";
export function useMedia(query: string) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}
export interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function useInstall() {
  const standalone = useMedia("(display-mode: standalone)");
  const [installed, setInstalled] = useState(
    () =>
      standalone ||
      !!(navigator as Navigator & { standalone?: boolean }).standalone,
  );
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const before = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const after = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", after);
    return () => {
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", after);
    };
  }, []);
  async function install() {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    }
  }
  return { installed: installed || standalone, canInstall: !!prompt, install };
}
