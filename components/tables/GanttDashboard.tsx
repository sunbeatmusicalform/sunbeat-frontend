"use client";

import { useEffect, useMemo, useState } from "react";

type GanttItem = {
  id: string;
  project_id: string;
  project_name: string;
  title: string;
  macroarea: string;
  color: string;
  start_date: string | null;
  end_date: string | null;
  release_date: string | null;
  status: string;
  status_label: string;
  responsible: string;
  active: boolean;
  is_overdue: boolean;
  source: string;
};

type GanttResponse = {
  ok: boolean;
  workspace_slug: string;
  source: "stages" | "projects_fallback" | string;
  generated_at?: string;
  today?: string;
  items: GanttItem[];
  summary: {
    total: number;
    active: number;
    overdue: number;
    without_date: number;
    projects: number;
  };
  filters: {
    macroareas: string[];
    statuses: string[];
    responsibles: string[];
    projects: string[];
  };
  warnings?: string[];
  error?: { message?: string } | string;
  detail?: { message?: string } | string;
};

type UiState =
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "ready"; data: GanttResponse };

type Scale = "days" | "weeks" | "months";

const SCALE_COPY: Record<Scale, string> = {
  days: "Dias",
  weeks: "Semanas",
  months: "Meses",
};

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function diffDays(start: Date, end: Date) {
  const ms = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
    Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.round(ms / 86400000);
}

function formatDate(value: string | null | undefined) {
  const date = parseDate(value);
  if (!date) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function formatTick(date: Date, scale: Scale) {
  if (scale === "months") {
    return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function statusTone(item: GanttItem) {
  if (item.is_overdue) return "border-red-200 bg-red-50 text-red-700";
  if (item.status === "concluida") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (item.status === "em_andamento") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-black/10 bg-white text-[#4A443D]";
}

function sourceLabel(source: string) {
  if (source === "stages") return "Etapas do Lançamento";
  if (source === "projects_fallback") return "Projetos + offsets";
  return source || "Fonte não informada";
}

function responseErrorMessage(data: GanttResponse) {
  const error = data.error;
  if (typeof error === "string" && error.trim()) return error;
  if (typeof error === "object" && error?.message) return error.message;

  const detail = data.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (typeof detail === "object" && detail?.message) return detail.message;

  return "Não foi possível carregar o Gantt.";
}

function buildTicks(start: Date, end: Date, scale: Scale) {
  const step = scale === "days" ? 7 : scale === "weeks" ? 14 : 30;
  const ticks: Date[] = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    ticks.push(new Date(cursor));
    cursor = addDays(cursor, step);
  }
  if (ticks.length === 0 || ticks[ticks.length - 1] < end) {
    ticks.push(new Date(end));
  }
  return ticks;
}

function timelineBounds(items: GanttItem[]) {
  const dates = items
    .flatMap((item) => [parseDate(item.start_date), parseDate(item.end_date), parseDate(item.release_date)])
    .filter((item): item is Date => Boolean(item));
  const today = new Date();
  if (!dates.length) {
    return { start: addDays(today, -30), end: addDays(today, 45) };
  }
  const minTime = Math.min(...dates.map((item) => item.getTime()));
  const maxTime = Math.max(...dates.map((item) => item.getTime()));
  return {
    start: addDays(new Date(minTime), -7),
    end: addDays(new Date(maxTime), 10),
  };
}

function groupByProject(items: GanttItem[]) {
  const map = new Map<string, GanttItem[]>();
  items.forEach((item) => {
    const key = item.project_name || "Projeto sem nome";
    const current = map.get(key) ?? [];
    current.push(item);
    map.set(key, current);
  });
  return Array.from(map.entries()).map(([project, rows]) => ({
    project,
    rows: rows.sort((a, b) => (a.start_date || "").localeCompare(b.start_date || "")),
  }));
}

export default function GanttDashboard({ workspaceSlug }: { workspaceSlug: string }) {
  const [uiState, setUiState] = useState<UiState>({ type: "loading" });
  const [scale, setScale] = useState<Scale>("weeks");
  const [macroarea, setMacroarea] = useState("all");
  const [status, setStatus] = useState("all");
  const [responsible, setResponsible] = useState("all");
  const [activeOnly, setActiveOnly] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`/api/tables/${encodeURIComponent(workspaceSlug)}/gantt?limit=300`)
      .then(async (response) => {
        const data = (await response.json()) as GanttResponse;
        if (!response.ok || !data.ok) {
          throw new Error(responseErrorMessage(data));
        }
        if (alive) setUiState({ type: "ready", data });
      })
      .catch((error) => {
        if (alive) {
          setUiState({
            type: "error",
            message: error instanceof Error ? error.message : "Não foi possível carregar o Gantt.",
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [workspaceSlug]);

  const data = uiState.type === "ready" ? uiState.data : null;
  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.items.filter((item) => {
      if (activeOnly && !item.active) return false;
      if (macroarea !== "all" && item.macroarea !== macroarea) return false;
      if (status !== "all" && item.status_label !== status) return false;
      if (responsible !== "all" && item.responsible !== responsible) return false;
      return true;
    });
  }, [activeOnly, data, macroarea, responsible, status]);

  const datedItems = filteredItems.filter((item) => item.start_date && item.end_date);
  const undatedItems = filteredItems.filter((item) => !item.start_date || !item.end_date);
  const bounds = useMemo(() => timelineBounds(datedItems), [datedItems]);
  const totalDays = Math.max(1, diffDays(bounds.start, bounds.end));
  const ticks = useMemo(() => buildTicks(bounds.start, bounds.end, scale), [bounds.end, bounds.start, scale]);
  const grouped = useMemo(() => groupByProject(datedItems), [datedItems]);
  const minTimelineWidth = scale === "days" ? 1120 : scale === "weeks" ? 920 : 760;
  const today = new Date();
  const todayOffset = clamp((diffDays(bounds.start, today) / totalDays) * 100, 0, 100);

  return (
    <div className="grid gap-6">
      <section className="border border-black/8 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D867B]">
              Sunbeat Tables
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-[#111111]">
              Gantt operacional
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5F5A53]">
              Projetos, macroáreas e prazos calculados a partir da data de lançamento.
            </p>
          </div>

          {data && (
            <div className="grid gap-2 sm:grid-cols-4">
              <SummaryPill label="Projetos" value={data.summary.projects} />
              <SummaryPill label="Etapas" value={data.summary.total} />
              <SummaryPill label="Atrasadas" value={data.summary.overdue} danger={data.summary.overdue > 0} />
              <SummaryPill label="Sem data" value={data.summary.without_date} />
            </div>
          )}
        </div>
      </section>

      {uiState.type === "loading" && (
        <section className="border border-black/8 bg-white px-6 py-10 text-center text-sm text-[#6B655C]">
          Carregando Gantt...
        </section>
      )}

      {uiState.type === "error" && (
        <section className="border border-red-200 bg-red-50 px-6 py-6 text-sm text-red-700">
          {uiState.message}
        </section>
      )}

      {data && (
        <>
          <section className="border border-black/8 bg-white px-5 py-5 shadow-[0_12px_36px_rgba(0,0,0,0.035)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-3">
                <SelectFilter label="Macroárea" value={macroarea} onChange={setMacroarea} options={data.filters.macroareas} />
                <SelectFilter label="Status" value={status} onChange={setStatus} options={data.filters.statuses} />
                <SelectFilter label="Responsável" value={responsible} onChange={setResponsible} options={data.filters.responsibles} emptyLabel="Todos" />
                <label className="flex min-w-[150px] items-end gap-2 pb-2 text-sm text-[#4A443D]">
                  <input
                    type="checkbox"
                    checked={activeOnly}
                    onChange={(event) => setActiveOnly(event.target.checked)}
                    className="h-4 w-4 rounded border-black/20"
                  />
                  Apenas ativas
                </label>
              </div>
              <div className="flex rounded-xl border border-black/10 bg-[#F8F5EF] p-1">
                {(Object.keys(SCALE_COPY) as Scale[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setScale(item)}
                    className={`h-9 rounded-lg px-3 text-xs font-semibold transition ${
                      scale === item ? "bg-[#111111] text-white" : "text-[#4A443D] hover:bg-white"
                    }`}
                  >
                    {SCALE_COPY[item]}
                  </button>
                ))}
              </div>
            </div>

            {data.warnings && data.warnings.length > 0 && (
              <div className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                Fonte atual: {sourceLabel(data.source)}. {data.warnings[0]}
              </div>
            )}
          </section>

          <section className="overflow-hidden border border-black/8 bg-white shadow-[0_16px_42px_rgba(0,0,0,0.04)]">
            <div className="border-b border-black/8 px-5 py-4">
              <div className="text-sm font-semibold text-[#111111]">Linha do tempo</div>
              <div className="mt-1 text-xs text-[#7A746A]">
                {filteredItems.length} item(ns) filtrado(s) · Fonte: {sourceLabel(data.source)}
              </div>
            </div>

            {grouped.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-[#6B655C]">
                Nenhuma etapa com data para os filtros selecionados.
              </div>
            )}

            {grouped.length > 0 && (
              <div className="overflow-x-auto">
                <div className="min-w-full" style={{ width: minTimelineWidth }}>
                  <div className="grid grid-cols-[260px_minmax(0,1fr)] border-b border-black/8 bg-[#F8F5EF]">
                    <div className="border-r border-black/8 px-4 py-3 text-xs font-semibold uppercase text-[#7A746A]">
                      Projeto / Macroárea
                    </div>
                    <div className="relative px-4 py-3">
                      <div className="relative h-7">
                        {ticks.map((tick) => {
                          const left = clamp((diffDays(bounds.start, tick) / totalDays) * 100, 0, 100);
                          return (
                            <div
                              key={tick.toISOString()}
                              className="absolute top-0 -translate-x-1/2 text-[11px] text-[#7A746A]"
                              style={{ left: `${left}%` }}
                            >
                              {formatTick(tick, scale)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[260px_minmax(0,1fr)]">
                    <div className="border-r border-black/8">
                      {grouped.map((group) => (
                        <div key={group.project}>
                          <div className="border-b border-black/8 bg-[#FFFEFB] px-4 py-3 text-sm font-semibold text-[#111111]">
                            {group.project}
                          </div>
                          {group.rows.map((item) => (
                            <div key={item.id} className="h-12 border-b border-black/8 px-4 py-2">
                              <div className="truncate text-xs font-semibold text-[#111111]">{item.macroarea}</div>
                              <div className="truncate text-[11px] text-[#7A746A]">{item.responsible || "Sem responsável"}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div className="relative">
                      <div
                        className="pointer-events-none absolute top-0 z-10 h-full w-px bg-red-500"
                        style={{ left: `${todayOffset}%` }}
                      />
                      {grouped.map((group) => (
                        <div key={group.project}>
                          <div className="h-[45px] border-b border-black/8 bg-[#FFFEFB]" />
                          {group.rows.map((item) => (
                            <TimelineRow
                              key={item.id}
                              item={item}
                              boundsStart={bounds.start}
                              totalDays={totalDays}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {undatedItems.length > 0 && (
            <section className="border border-black/8 bg-white px-5 py-5 shadow-[0_12px_36px_rgba(0,0,0,0.035)]">
              <div className="text-sm font-semibold text-[#111111]">Sem data definida</div>
              <div className="mt-3 grid gap-2">
                {undatedItems.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 border border-black/8 bg-[#FFFEFB] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-[#111111]">{item.project_name}</div>
                      <div className="text-xs text-[#6B655C]">{item.macroarea} · {item.title}</div>
                    </div>
                    <span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(item)}`}>
                      {item.status_label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SummaryPill({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="border border-black/8 bg-[#F8F5EF] px-4 py-3">
      <div className={`text-xl font-semibold ${danger ? "text-red-700" : "text-[#111111]"}`}>{value}</div>
      <div className="text-[10px] font-semibold uppercase text-[#7A746A]">{label}</div>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
  emptyLabel = "Todas",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  emptyLabel?: string;
}) {
  return (
    <label className="min-w-[170px] text-xs font-semibold uppercase text-[#7A746A]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full border border-black/10 bg-white px-3 text-sm font-medium normal-case text-[#111111] outline-none focus:border-[#111111]"
      >
        <option value="all">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TimelineRow({
  item,
  boundsStart,
  totalDays,
}: {
  item: GanttItem;
  boundsStart: Date;
  totalDays: number;
}) {
  const start = parseDate(item.start_date);
  const end = parseDate(item.end_date);
  const release = parseDate(item.release_date);
  const left = start ? clamp((diffDays(boundsStart, start) / totalDays) * 100, 0, 100) : 0;
  const width = start && end
    ? clamp(((diffDays(start, end) + 1) / totalDays) * 100, 1.5, 100 - left)
    : 1.5;
  const releaseLeft = release ? clamp((diffDays(boundsStart, release) / totalDays) * 100, 0, 100) : null;

  return (
    <div className="relative h-12 border-b border-black/8 px-4 py-2">
      {releaseLeft !== null && (
        <div
          className="absolute top-1 h-10 w-px bg-[#111111]/20"
          style={{ left: `${releaseLeft}%` }}
          title={`Lançamento ${formatDate(item.release_date)}`}
        />
      )}
      <div
        className={`absolute top-2 flex h-8 items-center justify-between overflow-hidden px-3 text-xs font-semibold text-white shadow-sm ${
          item.is_overdue ? "bg-red-700" : ""
        }`}
        style={{
          left: `${left}%`,
          width: `${width}%`,
          backgroundColor: item.is_overdue ? undefined : item.color,
        }}
        title={`${item.title}: ${formatDate(item.start_date)} a ${formatDate(item.end_date)}`}
      >
        <span className="truncate">{item.title}</span>
      </div>
    </div>
  );
}
