"use client";

import { useState } from "react";
import { Plus, FileText, Trash2, Info, Download, AlertCircle } from "lucide-react";
import type { Agent } from "@multica/core/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@multica/ui/components/ui/dialog";
import { Button } from "@multica/ui/components/ui/button";
import { toast } from "sonner";
import { api } from "@multica/core/api";
import { useWorkspaceId } from "@multica/core/hooks";
import { skillListOptions, workspaceKeys } from "@multica/core/workspace/queries";
import { runtimeListOptions, runtimeLocalSkillsOptions } from "@multica/core/runtimes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@multica/views/i18n";
import { RuntimeLocalSkillImportDialog } from "../../../skills/components/runtime-local-skill-import-dialog";
import { RuntimeLocalSkillRow } from "../../../skills/components/runtime-local-skill-row";

export function SkillsTab({
  agent,
}: {
  agent: Agent;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const wsId = useWorkspaceId();
  const { data: workspaceSkills = [] } = useQuery(skillListOptions(wsId));
  const { data: runtimes = [] } = useQuery(runtimeListOptions(wsId));
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showRuntimeImport, setShowRuntimeImport] = useState(false);
  const [runtimeImportSkillKey, setRuntimeImportSkillKey] = useState<string | null>(null);

  const agentSkillIds = new Set(agent.skills.map((s) => s.id));
  const availableSkills = workspaceSkills.filter((s) => !agentSkillIds.has(s.id));
  const runtime = runtimes.find((item) => item.id === agent.runtime_id);
  const localSkillsQuery = useQuery({
    ...runtimeLocalSkillsOptions(runtime?.id ?? null),
    enabled:
      agent.runtime_mode === "local" &&
      !!runtime?.id &&
      runtime.status === "online",
  });

  const handleAdd = async (skillId: string) => {
    setSaving(true);
    try {
      const newIds = [...agent.skills.map((s) => s.id), skillId];
      await api.setAgentSkills(agent.id, { skill_ids: newIds });
      qc.invalidateQueries({ queryKey: workspaceKeys.agents(wsId) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("agents.skills.addFailed"));
    } finally {
      setSaving(false);
      setShowPicker(false);
    }
  };

  const handleRemove = async (skillId: string) => {
    setSaving(true);
    try {
      const newIds = agent.skills.filter((s) => s.id !== skillId).map((s) => s.id);
      await api.setAgentSkills(agent.id, { skill_ids: newIds });
      qc.invalidateQueries({ queryKey: workspaceKeys.agents(wsId) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("agents.skills.removeFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{t("agents.skills.title")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("agents.skills.description")}
          </p>
        </div>
        <Button
          variant="outline"
          size="xs"
          onClick={() => setShowPicker(true)}
          disabled={saving || availableSkills.length === 0}
        >
          <Plus className="h-3 w-3" />
          {t("agents.skills.add")}
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-info/20 bg-info/5 px-3 py-2.5">
        <Info className="h-3.5 w-3.5 shrink-0 text-info mt-0.5" />
        <p className="text-xs text-muted-foreground">
          {t("agents.skills.infoWorkspace")}
        </p>
      </div>

      {agent.skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <FileText className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">{t("agents.skills.emptyTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("agents.skills.emptyHint")}
          </p>
          {availableSkills.length > 0 && (
            <Button
              onClick={() => setShowPicker(true)}
              size="xs"
              className="mt-3"
              disabled={saving}
            >
              <Plus className="h-3 w-3" />
              {t("agents.skills.add")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {agent.skills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center gap-3 rounded-lg border px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{skill.name}</div>
                {skill.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {skill.description}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemove(skill.id)}
                disabled={saving}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {agent.runtime_mode === "local" && (
        <div className="space-y-3 rounded-lg border p-4">
          <div>
            <h4 className="text-sm font-semibold">{t("agents.skills.localTitle")}</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("agents.skills.localDescription")}
            </p>
          </div>

          {!runtime ? (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              {t("agents.skills.runtimeUnavailable")}
            </div>
          ) : runtime.status !== "online" ? (
            <div className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              {t("agents.skills.runtimeMustBeOnline")}
            </div>
          ) : localSkillsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-lg border px-4 py-3">
                  <div className="h-4 w-36 rounded bg-muted" />
                  <div className="mt-2 h-3 w-52 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : localSkillsQuery.error ? (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {localSkillsQuery.error instanceof Error
                ? localSkillsQuery.error.message
                : t("agents.skills.localLoadFailed")}
            </div>
          ) : !localSkillsQuery.data?.supported ? (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              {t("agents.skills.localUnsupported")}
            </div>
          ) : (localSkillsQuery.data.skills ?? []).length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">{t("agents.skills.localEmptyTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("agents.skills.localEmptyHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {(localSkillsQuery.data.skills ?? []).map((skill) => (
                <RuntimeLocalSkillRow
                  key={skill.key}
                  skill={skill}
                  action={
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        setRuntimeImportSkillKey(skill.key);
                        setShowRuntimeImport(true);
                      }}
                    >
                      <Download className="h-3 w-3" />
                      {t("agents.skills.import")}
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Skill Picker Dialog */}
      {showPicker && (
        <Dialog open onOpenChange={(v) => { if (!v) setShowPicker(false); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">{t("agents.skills.pickerTitle")}</DialogTitle>
              <DialogDescription className="text-xs">
                {t("agents.skills.pickerDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {availableSkills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => handleAdd(skill.id)}
                  disabled={saving}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/50"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{skill.name}</div>
                    {skill.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {skill.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {availableSkills.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  {t("agents.skills.pickerAllAssigned")}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowPicker(false)}>
                {t("agents.skills.pickerCancel")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showRuntimeImport && runtime && (
        <RuntimeLocalSkillImportDialog
          open={showRuntimeImport}
          onClose={() => setShowRuntimeImport(false)}
          fixedRuntimeId={runtime.id}
          initialRuntimeId={runtime.id}
          initialSkillKey={runtimeImportSkillKey}
        />
      )}
    </div>
  );
}
