import { useTranslation } from "react-i18next";
import { Fish, Flower2, Sparkles, Pause } from "lucide-react";
import type { AvatarActivity } from "../domain";

export function CharacterView({ name, activity, sample = false }: { name: string; activity: AvatarActivity; sample?: boolean }) {
  const { t } = useTranslation();
  const poses: Record<AvatarActivity, string> = { idle: "idle", fishing: "fishing", gardening: "gardening", meditating: "meditating" };
  const Icon = activity === "fishing" ? Fish : activity === "gardening" ? Flower2 : activity === "meditating" ? Sparkles : Pause;
  return (
    <section className="character-view card" data-testid="character-view">
      <div className="section-heading"><h2>{t("characterView")}</h2><span className="game-status-dot" /></div>
      <div className={`character-stage pose-${poses[activity]}`} aria-label={t("characterSceneLabel", { name, activity: t(activity) })}>
        <span className={`character-sprite ${poses[activity]}`} aria-hidden="true" />
        <span className="activity-glyph" aria-hidden="true"><Icon size={20} /></span>
        <span className="stage-spark spark-one" aria-hidden="true" /><span className="stage-spark spark-two" aria-hidden="true" />
      </div>
      <div className="character-caption"><strong>{name}</strong><span className="character-activity"><Icon size={15} aria-hidden="true" />{t(activity)}</span></div>
      <p className="hint">{t(sample ? "gameSnapshotSample" : "gameSnapshotFriend")}</p>
    </section>
  );
}
