import { useTranslation } from "react-i18next";
import type { AvatarActivity } from "../domain";
export function PixelScene({
  activity = "idle",
  friend = false,
}: {
  activity?: AvatarActivity;
  friend?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`pixel-scene scene-${activity}`}
      role="img"
      aria-label={`${t("worldSub")} · ${t(activity)}`}
    >
      <div className="scene-sky" />
      <div className="scene-hill hill-back" />
      <div className="scene-hill hill-front" />
      <div className="scene-river" />
      <div className="scene-bank" />
      <div className="scene-path" />
      <div className="pixel-tree tree-one" />
      <div className="pixel-tree tree-two" />
      <div className="pixel-tree tree-three" />
      <div className="scene-house">
        <div className="house-roof" />
        <div className="house-door" />
        <div className="house-window" />
      </div>
      <div className="scene-dock" />
      <div className="scene-garden" />
      <div className="scene-bench" />
      <span
        className={`pixel-actor actor-main ${activity}`}
        aria-hidden="true"
      />
      {friend && (
        <span className="pixel-actor actor-friend" aria-hidden="true" />
      )}
      {activity === "fishing" && <span className="fishing-rod" />}
      <span className="scene-badge">{t("worldSub")}</span>
    </div>
  );
}
