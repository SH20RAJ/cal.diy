"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Badge } from "@calcom/ui/components/badge";
import { Button } from "@calcom/ui/components/button";
import { Icon } from "@calcom/ui/components/icon";
import { canUseCreatorAI, getCreatorPlan } from "@lib/creatorcall/saas";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo } from "react";

function getCreatorMetadataValue(metadata: unknown, key: string) {
  if (typeof metadata !== "object" || !metadata || !(key in metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

export function CreatorDashboardView() {
  const { t } = useLocale();
  const { data: user } = trpc.viewer.me.get.useQuery();
  const { data: eventTypes } = trpc.viewer.eventTypes.list.useQuery();
  const { data: bookingsData } = trpc.viewer.bookings.get.useQuery(
    { limit: 10, filters: { status: "upcoming" } },
    { refetchInterval: 30000 }
  );

  const metadata = user?.metadata;
  const plan = getCreatorPlan(metadata);
  const aiEnabled = canUseCreatorAI(metadata);
  const creatorNiche = getCreatorMetadataValue(metadata, "creatorNiche");
  const defaultPrice = Number(getCreatorMetadataValue(metadata, "creatorDefaultSessionPrice") ?? 0);

  const upcomingBookings = useMemo(() => {
    if (!bookingsData?.bookings) return [];
    return bookingsData.bookings.flatMap((bookingGroup) =>
      Array.isArray(bookingGroup) ? bookingGroup : [bookingGroup]
    );
  }, [bookingsData]);

  const activeSessionTypes = useMemo(() => {
    if (!eventTypes) return [];
    return eventTypes.filter((eventType) => !eventType.hidden);
  }, [eventTypes]);

  const totalEarnings = useMemo(() => {
    if (!bookingsData?.bookings) return 0;
    return upcomingBookings.reduce((acc, booking) => {
      const payment = (booking as any).payment?.[0];
      if (payment && payment.status === "PAID") {
        return acc + (payment.amount || 0);
      }
      return acc;
    }, 0);
  }, [upcomingBookings, bookingsData]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-emphasis text-2xl font-bold tracking-tight">{t("creator_dashboard")}</h1>
          <p className="text-default mt-1 text-sm">
            {creatorNiche ? `${creatorNiche} creator workspace` : t("creator_dashboard_description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={plan === "pro" ? "success" : "gray"}>{plan === "pro" ? "Pro" : "Free"}</Badge>
          {aiEnabled ? <Badge variant="blue">AI enabled</Badge> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon="calendar" label="Upcoming calls" value={upcomingBookings.length} />
        <MetricCard
          icon="credit-card"
          label="Estimated earnings"
          value={totalEarnings > 0 ? `$${(totalEarnings / 100).toFixed(2)}` : "$0.00"}
        />
        <MetricCard icon="clock" label="Session types" value={activeSessionTypes.length} />
        <MetricCard icon="sparkles" label="Creator plan" value={plan} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Upcoming Calls" actionHref="/bookings/upcoming" actionLabel="View all">
          {upcomingBookings.length === 0 ? (
            <EmptyState>No upcoming calls yet.</EmptyState>
          ) : (
            <ul className="divide-subtle divide-y">
              {upcomingBookings.slice(0, 5).map((booking) => (
                <li key={booking.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-emphasis truncate text-sm font-medium">{booking.title}</p>
                    <p className="text-subtle text-xs">
                      {new Date(booking.startTime).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {" • "}
                      {(booking as any).attendees?.[0]?.name || "Guest"}
                    </p>
                  </div>
                  {(booking as any).payment?.[0]?.status === "PAID" && <Badge variant="success">Paid</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Session Types" actionHref="/event-types" actionLabel="Manage">
          {activeSessionTypes.length === 0 ? (
            <EmptyState>No session types yet.</EmptyState>
          ) : (
            <ul className="divide-subtle divide-y">
              {activeSessionTypes.slice(0, 5).map((eventType) => (
                <li key={eventType.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-emphasis truncate text-sm font-medium">{eventType.title}</p>
                    <p className="text-subtle text-xs">{eventType.length} min</p>
                  </div>
                  <Badge variant="gray">1:1</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="border-subtle bg-default rounded-md border p-5">
        <div className="flex items-start gap-4">
          <div className="bg-subtle flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
            <Icon name="sparkles" className="text-default h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-emphasis text-lg font-semibold">Creator AI</h2>
            <p className="text-subtle mt-1 text-sm">
              Generate agendas, post-call summaries, and scheduling ideas for paid creator sessions.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button href="/creator/ai/agenda" color="secondary" size="sm" StartIcon="sparkles">
                Agenda
              </Button>
              <Button href="/creator/ai/summary" color="secondary" size="sm" StartIcon="file-text">
                Summary
              </Button>
              <Button href="/creator/ai/suggestions" color="secondary" size="sm" StartIcon="chart-line">
                Suggestions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: "calendar" | "clock" | "credit-card" | "sparkles";
  label: string;
  value: string | number;
}) {
  return (
    <div className="border-subtle bg-default rounded-md border p-4">
      <div className="flex items-center gap-3">
        <div className="bg-subtle flex h-10 w-10 items-center justify-center rounded-md">
          <Icon name={icon} className="text-default h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-subtle text-xs font-medium uppercase">{label}</p>
          <p className="text-emphasis truncate text-2xl font-bold capitalize">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  actionHref: string;
  actionLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="border-subtle bg-default rounded-md border p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-emphasis text-lg font-semibold">{title}</h2>
        <Link href={actionHref}>
          <Button color="minimal" size="sm" EndIcon="arrow-right">
            {actionLabel}
          </Button>
        </Link>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-subtle py-8 text-center text-sm">{children}</p>;
}
