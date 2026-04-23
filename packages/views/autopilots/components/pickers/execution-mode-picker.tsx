"use client";

import { useState } from "react";
import { FilePlus2, Play } from "lucide-react";
import type { AutopilotExecutionMode } from "@multica/core/types";
import { Tooltip, TooltipTrigger, TooltipContent } from "@multica/ui/components/ui/tooltip";
import {
  PropertyPicker,
  PickerItem,
} from "../../../issues/components/pickers/property-picker";
import { useI18n } from "../../../i18n";

const OPTIONS: { value: AutopilotExecutionMode; labelKey: string; descriptionKey: string; Icon: typeof FilePlus2 }[] = [
  {
    value: "create_issue",
    labelKey: "autopilots.executionMode.createIssue",
    descriptionKey: "autopilots.executionMode.createIssueDescription",
    Icon: FilePlus2,
  },
  {
    value: "run_only",
    labelKey: "autopilots.executionMode.runOnly",
    descriptionKey: "autopilots.executionMode.runOnlyDescription",
    Icon: Play,
  },
];

export function ExecutionModePicker({
  mode,
  onChange,
  trigger: customTrigger,
  triggerRender,
  align = "start",
}: {
  mode: AutopilotExecutionMode;
  onChange: (mode: AutopilotExecutionMode) => void;
  trigger?: React.ReactNode;
  triggerRender?: React.ReactElement;
  align?: "start" | "center" | "end";
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.value === mode) ?? OPTIONS[0]!;
  const CurrentIcon = current.Icon;

  return (
    <PropertyPicker
      open={open}
      onOpenChange={setOpen}
      width="w-52"
      align={align}
      triggerRender={triggerRender}
      trigger={
        customTrigger ?? (
          <>
            <CurrentIcon className="size-3 shrink-0" />
            <span className="truncate">{t(current.labelKey)}</span>
          </>
        )
      }
    >
      {OPTIONS.map((o) => {
        const Icon = o.Icon;
        return (
          <Tooltip key={o.value}>
            <TooltipTrigger
              render={
                <PickerItem
                  selected={o.value === mode}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>{t(o.labelKey)}</span>
                </PickerItem>
              }
            />
            <TooltipContent side="right" sideOffset={8}>
              {t(o.descriptionKey)}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </PropertyPicker>
  );
}
