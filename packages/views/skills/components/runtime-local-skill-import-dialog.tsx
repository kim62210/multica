"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HardDrive, Download, AlertCircle } from "lucide-react";
import type { AgentRuntime, Skill } from "@multica/core/types";
import { useWorkspaceId } from "@multica/core/hooks";
import {
  runtimeListOptions,
  runtimeLocalSkillsKeys,
  runtimeLocalSkillsOptions,
  resolveRuntimeLocalSkillImport,
} from "@multica/core/runtimes";
import { workspaceKeys } from "@multica/core/workspace/queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@multica/ui/components/ui/dialog";
import { Button } from "@multica/ui/components/ui/button";
import { Input } from "@multica/ui/components/ui/input";
import { Label } from "@multica/ui/components/ui/label";
import { Badge } from "@multica/ui/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@multica/ui/components/ui/select";
import { Skeleton } from "@multica/ui/components/ui/skeleton";
import { toast } from "sonner";
import { useI18n } from "../../i18n";
import { RuntimeLocalSkillRow } from "./runtime-local-skill-row";

function runtimeLabel(runtime: AgentRuntime): string {
  return `${runtime.name} (${runtime.provider})`;
}

export function RuntimeLocalSkillImportDialog({
  open,
  onClose,
  initialRuntimeId,
  initialSkillKey,
  fixedRuntimeId,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  initialRuntimeId?: string | null;
  initialSkillKey?: string | null;
  fixedRuntimeId?: string | null;
  onImported?: (skill: Skill) => void;
}) {
  const { t } = useI18n();
  const wsId = useWorkspaceId();
  const qc = useQueryClient();
  const { data: runtimes = [] } = useQuery(runtimeListOptions(wsId));
  const localRuntimes = useMemo(
    () => runtimes.filter((runtime) => runtime.runtime_mode === "local"),
    [runtimes],
  );

  const [selectedRuntimeId, setSelectedRuntimeId] = useState<string>("");
  const [selectedSkillKey, setSelectedSkillKey] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const preferredRuntimeId =
      fixedRuntimeId ??
      initialRuntimeId ??
      localRuntimes[0]?.id ??
      "";
    setSelectedRuntimeId(preferredRuntimeId);
  }, [fixedRuntimeId, initialRuntimeId, localRuntimes, open]);

  const selectedRuntime = localRuntimes.find(
    (runtime) => runtime.id === selectedRuntimeId,
  );
  const canBrowseSkills = open && !!selectedRuntimeId && selectedRuntime?.status === "online";
  const skillsQuery = useQuery({
    ...runtimeLocalSkillsOptions(selectedRuntimeId || null),
    enabled: canBrowseSkills,
  });

  const runtimeSkills = skillsQuery.data?.skills ?? [];
  const selectedSkill = runtimeSkills.find((skill) => skill.key === selectedSkillKey);

  useEffect(() => {
    if (!open) {
      return;
    }

    const preferredSkill =
      (initialSkillKey
        ? runtimeSkills.find((skill) => skill.key === initialSkillKey)
        : null) ?? runtimeSkills[0];
    const nextSkill = preferredSkill;
    if (!nextSkill) {
      setSelectedSkillKey("");
      setName("");
      setDescription("");
      return;
    }

    if (!runtimeSkills.some((skill) => skill.key === selectedSkillKey)) {
      setSelectedSkillKey(nextSkill.key);
      setName(nextSkill.name);
      setDescription(nextSkill.description ?? "");
    }
  }, [initialSkillKey, open, runtimeSkills, selectedSkillKey]);

  useEffect(() => {
    if (!selectedSkill) {
      return;
    }
    setName(selectedSkill.name);
    setDescription(selectedSkill.description ?? "");
  }, [selectedSkillKey, selectedSkill]);

  const handleImport = async () => {
    if (!selectedRuntimeId || !selectedSkill) {
      return;
    }

    setImporting(true);
    try {
      const result = await resolveRuntimeLocalSkillImport(selectedRuntimeId, {
        skill_key: selectedSkill.key,
        name: name.trim() || undefined,
        description: description.trim() || undefined,
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: runtimeLocalSkillsKeys.forRuntime(selectedRuntimeId) }),
        qc.invalidateQueries({ queryKey: workspaceKeys.skills(wsId) }),
        qc.invalidateQueries({ queryKey: workspaceKeys.agents(wsId) }),
      ]);
      toast.success(t("skills.toast.imported"));
      onImported?.(result.skill);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("skills.runtime.importFailed"));
    } finally {
      setImporting(false);
    }
  };

  const renderSkillContent = () => {
    if (localRuntimes.length === 0) {
      return (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">{t("skills.runtime.noRuntimes.title")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("skills.runtime.noRuntimes.description")}
          </p>
        </div>
      );
    }

    if (!selectedRuntime) {
      return (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">{t("skills.runtime.chooseRuntime")}</p>
        </div>
      );
    }

    if (selectedRuntime.status !== "online") {
      return (
        <div className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          {t("skills.runtime.mustBeOnline")}
        </div>
      );
    }

    if (skillsQuery.isLoading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border px-4 py-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-48" />
            </div>
          ))}
        </div>
      );
    }

    if (skillsQuery.error) {
      return (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {skillsQuery.error instanceof Error
            ? skillsQuery.error.message
            : t("skills.runtime.loadFailed")}
        </div>
      );
    }

    if (!skillsQuery.data?.supported) {
      return (
        <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("skills.runtime.notSupported")}
        </div>
      );
    }

    if (runtimeSkills.length === 0) {
      return (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">{t("skills.runtime.noSkills.title")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("skills.runtime.noSkills.description")}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {runtimeSkills.map((skill) => (
            <RuntimeLocalSkillRow
              key={skill.key}
              skill={skill}
              selected={selectedSkillKey === skill.key}
              onSelect={() => setSelectedSkillKey(skill.key)}
            />
          ))}
        </div>

        {selectedSkill && (
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div>
              <Label className="text-xs text-muted-foreground">{t("skills.runtime.workspaceSkillName")}</Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("skills.runtime.descriptionLabel")}</Label>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1"
                placeholder={t("skills.runtime.descriptionPlaceholder")}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("skills.runtime.dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("skills.runtime.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!fixedRuntimeId && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("skills.runtime.runtimeLabel")}</Label>
              <Select value={selectedRuntimeId} onValueChange={(value) => value && setSelectedRuntimeId(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("skills.runtime.selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {localRuntimes.map((runtime) => (
                    <SelectItem key={runtime.id} value={runtime.id}>
                      {runtimeLabel(runtime)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedRuntime && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <HardDrive className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{runtimeLabel(selectedRuntime)}</span>
              <Badge variant={selectedRuntime.status === "online" ? "secondary" : "outline"}>
                {selectedRuntime.status}
              </Badge>
            </div>
          )}

          {renderSkillContent()}

          <p className="text-xs text-muted-foreground">
            {t("skills.runtime.footerHint")}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("skills.common.cancel")}
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              importing ||
              !selectedRuntime ||
              selectedRuntime.status !== "online" ||
              !selectedSkill ||
              !name.trim()
            }
          >
            {importing ? (
              t("skills.runtime.importing")
            ) : (
              <>
                <Download className="h-3 w-3" />
                {t("skills.runtime.importToWorkspace")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
