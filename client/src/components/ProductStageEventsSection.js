import React from 'react';
import { FaMapMarkerAlt, FaCalendarAlt, FaIndustry, FaListUl } from 'react-icons/fa';

function toDisplayDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

function ProductStageEventsSection({ stageEvents, stages }) {
  const normalized = Array.isArray(stageEvents) && stageEvents.length > 0
    ? stageEvents
    : Array.isArray(stages)
      ? stages.map((stage, index) => ({
          stage,
          timestamp: null,
          actor: 'system',
          location: null,
          notes: index === stages.length - 1 ? 'Current stage' : ''
        }))
      : [];

  if (normalized.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-[28px] border border-white/10 bg-white/75 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:bg-white/5">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        <FaListUl className="text-purple-500" />
        Stage Events
      </h3>

      <div className="space-y-3">
        {normalized.map((event, index) => (
          <article key={`${event.stage || 'stage'}-${index}`} className="rounded-[22px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(245,243,255,0.7))] p-4 dark:bg-white/5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-purple-300/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-200">
                {event.stage || 'Unknown Stage'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 dark:text-slate-300 md:grid-cols-3">
              <div className="flex min-w-0 items-start gap-2 rounded-2xl border border-white/10 bg-white/40 px-3 py-2 dark:bg-white/5">
                <FaCalendarAlt className="mt-0.5 shrink-0 text-slate-500" />
                <span className="min-w-0 break-words">{toDisplayDate(event.timestamp || event.recordedAt)}</span>
              </div>
              <div className="flex min-w-0 items-start gap-2 rounded-2xl border border-white/10 bg-white/40 px-3 py-2 dark:bg-white/5">
                <FaIndustry className="mt-0.5 shrink-0 text-slate-500" />
                <span className="min-w-0 break-all">{event.actor || event.updatedBy || 'system'}</span>
              </div>
              <div className="flex min-w-0 items-start gap-2 rounded-2xl border border-white/10 bg-white/40 px-3 py-2 dark:bg-white/5">
                <FaMapMarkerAlt className="mt-0.5 shrink-0 text-slate-500" />
                <span className="min-w-0 break-words">{event.location || 'Not specified'}</span>
              </div>
            </div>

            {event.notes ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{event.notes}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default ProductStageEventsSection;
