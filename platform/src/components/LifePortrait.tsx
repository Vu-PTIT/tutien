import { useTranslation } from "react-i18next";
import { GraduationCap, BriefcaseBusiness, Coffee } from "lucide-react";
import type { LifeStatus } from "../domain";
// A profile illustration, not a game scene or simulated activity.
export function LifePortrait({
  name,
  life,
  color = "sage",
}: {
  name: string;
  life: LifeStatus | null;
  color?: string;
}) {
  const { t } = useTranslation();
  const Icon =
    life === "study"
      ? GraduationCap
      : life === "work"
        ? BriefcaseBusiness
        : Coffee;
  return (
    <div className={`life-portrait ${color}`}>
      <span className="profile-character" aria-hidden="true" />
      <div className="portrait-copy">
        <strong>{name}</strong>
        <span>{t("profileRepresentation")}</span>
      </div>
      <span className="life-badge">
        <Icon size={16} aria-hidden="true" />
        {t(life ?? "statusNone")}
      </span>
    </div>
  );
}
