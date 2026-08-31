import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title = "No results",
  description = "No data to display yet.",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16">
      <div className="mb-4 text-muted-foreground/40">
        {icon || <Inbox className="size-12" />}
      </div>
      <h3 className="text-lg font-medium text-card-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
