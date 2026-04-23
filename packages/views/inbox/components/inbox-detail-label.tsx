"use client";

import { STATUS_CONFIG, PRIORITY_CONFIG } from "@multica/core/issues/config";
import { useActorName } from "@multica/core/workspace/hooks";
import { StatusIcon, PriorityIcon } from "../../issues/components";
import { useI18n } from "../../i18n";
import type { InboxItem, InboxItemType, IssueStatus, IssuePriority } from "@multica/core/types";

const typeLabelKeys: Record<InboxItemType, string> = {
  issue_assigned: "inbox.type.issueAssigned",
  unassigned: "inbox.type.unassigned",
  assignee_changed: "inbox.type.assigneeChanged",
  status_changed: "inbox.type.statusChanged",
  priority_changed: "inbox.type.priorityChanged",
  due_date_changed: "inbox.type.dueDateChanged",
  new_comment: "inbox.type.newComment",
  mentioned: "inbox.type.mentioned",
  review_requested: "inbox.type.reviewRequested",
  task_completed: "inbox.type.taskCompleted",
  task_failed: "inbox.type.taskFailed",
  agent_blocked: "inbox.type.agentBlocked",
  agent_completed: "inbox.type.agentCompleted",
  reaction_added: "inbox.type.reactionAdded",
};

export function useTypeLabel() {
  const { t } = useI18n();
  return (type: InboxItemType) => t(typeLabelKeys[type] ?? "inbox.type.newComment");
}

function shortDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function InboxDetailLabel({ item }: { item: InboxItem }) {
  const { t } = useI18n();
  const { getActorName } = useActorName();
  const getTypeLabel = useTypeLabel();
  const details = item.details ?? {};

  switch (item.type) {
    case "status_changed": {
      if (!details.to) return <span>{getTypeLabel(item.type)}</span>;
      const label = STATUS_CONFIG[details.to as IssueStatus]?.label ?? details.to;
      return (
        <span className="inline-flex items-center gap-1">
          {t("inbox.detail.setStatusTo")}
          <StatusIcon status={details.to as IssueStatus} className="h-3 w-3" />
          {label}
        </span>
      );
    }
    case "priority_changed": {
      if (!details.to) return <span>{getTypeLabel(item.type)}</span>;
      const label = PRIORITY_CONFIG[details.to as IssuePriority]?.label ?? details.to;
      return (
        <span className="inline-flex items-center gap-1">
          {t("inbox.detail.setPriorityTo")}
          <PriorityIcon priority={details.to as IssuePriority} className="h-3 w-3" />
          {label}
        </span>
      );
    }
    case "issue_assigned": {
      if (details.new_assignee_id) {
        return <span>{t("inbox.detail.assignedTo", { name: getActorName(details.new_assignee_type ?? "member", details.new_assignee_id) })}</span>;
      }
      return <span>{getTypeLabel(item.type)}</span>;
    }
    case "unassigned":
      return <span>{t("inbox.detail.removedAssignee")}</span>;
    case "assignee_changed": {
      if (details.new_assignee_id) {
        return <span>{t("inbox.detail.assignedTo", { name: getActorName(details.new_assignee_type ?? "member", details.new_assignee_id) })}</span>;
      }
      return <span>{getTypeLabel(item.type)}</span>;
    }
    case "due_date_changed": {
      if (details.to) return <span>{t("inbox.detail.setDueDateTo", { date: shortDate(details.to) })}</span>;
      return <span>{t("inbox.detail.removedDueDate")}</span>;
    }
    case "new_comment": {
      if (item.body) return <span>{item.body}</span>;
      return <span>{getTypeLabel(item.type)}</span>;
    }
    case "reaction_added": {
      const emoji = details.emoji;
      if (emoji) return <span>{t("inbox.detail.reactedToComment", { emoji })}</span>;
      return <span>{getTypeLabel(item.type)}</span>;
    }
    default:
      return <span>{getTypeLabel(item.type) ?? item.type}</span>;
  }
}
