import { ReactNode } from "react";
import "../../css/userPageHeader.css";

export default function UserPageHeader({
  eyebrow = "WORKSPACE",
  title,
  subtitle,
  rightSlot,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  rightSlot?: ReactNode;
}) {
  return (
    <section className="userPageHero">
      <div className="userPageHeroContent">
        <div className="userPageHeroEyebrow">{eyebrow}</div>
        <h1 className="userPageHeroTitle">{title}</h1>
        <p className="userPageHeroSubtitle">{subtitle}</p>
      </div>

      {rightSlot ? <div className="userPageHeroRight">{rightSlot}</div> : null}
    </section>
  );
}