import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import vi from "./locales/vi.json";
import en from "./locales/en.json";
let language = navigator.language.startsWith("vi") ? "vi" : "en";
try {
  const saved = localStorage.getItem("tutien.language");
  if (saved === "vi" || saved === "en") language = saved;
} catch {
  /* Preferences remain in memory. */
}
void i18n
  .use(initReactI18next)
  .init({
    resources: { vi: { translation: vi }, en: { translation: en } },
    lng: language,
    fallbackLng: "vi",
    interpolation: { escapeValue: false },
  });
function applyLanguage() {
  const lang = i18n.resolvedLanguage === "en" ? "en" : "vi";
  document.documentElement.lang = lang;
  document.title = lang === "vi" ? "Tu Tiên — Sảnh" : "Tu Tiên — Lobby";
  try {
    localStorage.setItem("tutien.language", lang);
  } catch {
    /* Do not block language switching. */
  }
}
i18n.on("languageChanged", applyLanguage);
applyLanguage();
export default i18n;
