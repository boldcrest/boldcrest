"use client";

import type { ReactNode } from "react";
import { Lock } from "@phosphor-icons/react";
import { Card, EmptyState } from "@clinic/ui";
import type { Permission } from "@clinic/core";
import { useDemo } from "@/lib/demo/store";

/**
 * Renders children only if the current person holds the permission.
 *
 * Hiding a control is a courtesy, not a control: in the real product the
 * database refuses the write whether or not the button was drawn. This exists
 * so people are not offered actions that would fail, and so the question "what
 * does reception actually see?" has a visible answer.
 */
export function Can({
  needs,
  children,
  otherwise = null,
}: {
  needs: Permission;
  children: ReactNode;
  otherwise?: ReactNode;
}) {
  const { can } = useDemo();
  return <>{can(needs) ? children : otherwise}</>;
}

/** A whole page that some roles cannot open, reached by typing the URL. */
export function RequirePermission({
  needs,
  children,
}: {
  needs: Permission;
  children: ReactNode;
}) {
  const { can, t, me } = useDemo();
  if (can(needs)) return <>{children}</>;

  return (
    <Card>
      <EmptyState
        icon={<Lock size={24} />}
        title={t.access.denied}
        action={<p className="max-w-sm text-[13px] text-ink-3">{t.access.hint(me.title)}</p>}
      />
    </Card>
  );
}
