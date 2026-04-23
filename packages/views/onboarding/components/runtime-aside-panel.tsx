"use client";

import { useI18n } from "@multica/views/i18n";

/**
 * Shared right-rail aside for Step 3 (runtime).
 *
 * Same content on both paths — desktop (runtime-connect FancyView)
 * and web (platform-fork). Explains what a runtime is and reassures
 * the user they can swap later. Designed to live inside a two-column
 * editorial shell's `<aside>` column.
 */
export function RuntimeAsidePanel() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {t("onboarding.runtimeAside.whatTitle")}
        </div>
        <p className="text-[14px] leading-[1.6] text-foreground/80">
          {t("onboarding.runtimeAside.whatIntro")}{" "}
          <strong className="font-medium text-foreground">
            {t("onboarding.runtimeAside.runtimeWord")}
          </strong>{" "}
          {t("onboarding.runtimeAside.whatBody")}
        </p>
      </section>

      <section>
        <div className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {t("onboarding.runtimeAside.goodTitle")}
        </div>
        <div className="flex flex-col gap-4">
          <AsideItem
            glyph="↻"
            title={t("onboarding.runtimeAside.swapTitle")}
            body={t("onboarding.runtimeAside.swapBody")}
          />
          <AsideItem
            glyph="∞"
            title={t("onboarding.runtimeAside.addMoreTitle")}
            body={t("onboarding.runtimeAside.addMoreBody")}
          />
        </div>
      </section>
    </div>
  );
}

function AsideItem({
  glyph,
  title,
  body,
}: {
  glyph: string;
  title: string;
  body: string;
}) {
  return (
    <div className="grid grid-cols-[22px_1fr] gap-3">
      <div
        aria-hidden
        className="flex h-[20px] w-[20px] items-center justify-center text-[14px] text-muted-foreground"
      >
        {glyph}
      </div>
      <div className="flex flex-col">
        <div className="text-[13.5px] font-medium text-foreground">{title}</div>
        <div className="mt-1 text-[12.5px] leading-[1.55] text-muted-foreground">
          {body}
        </div>
      </div>
    </div>
  );
}
