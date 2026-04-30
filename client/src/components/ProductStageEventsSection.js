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
    <section className="mt-6 rounded-[28px] border border-white/10 bg-slate-950/85 p-4 text-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.28)] backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-50">
        <FaListUl className="text-purple-500" />
        Stage Events
      </h3>

      <div className="space-y-3">
        {normalized.map((event, index) => (
          <article key={`${event.stage || 'stage'}-${index}`} className="rounded-[22px] border border-white/10 bg-white/8 p-4 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-purple-300/30 bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-100">
                {event.stage || 'Unknown Stage'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-slate-200 md:grid-cols-3">
              <div className="flex min-w-0 items-start gap-2 rounded-2xl border border-white/10 bg-white/6 px-3 py-2">
                <FaCalendarAlt className="mt-0.5 shrink-0 text-slate-300" />
                <span className="min-w-0 break-words">{toDisplayDate(event.timestamp || event.recordedAt)}</span>
              </div>
              <div className="flex min-w-0 items-start gap-2 rounded-2xl border border-white/10 bg-white/6 px-3 py-2">
                <FaIndustry className="mt-0.5 shrink-0 text-slate-300" />
                <span className="min-w-0 break-all">{event.actor || event.updatedBy || 'system'}</span>
              </div>
              <div className="flex min-w-0 items-start gap-2 rounded-2xl border border-white/10 bg-white/6 px-3 py-2">
                <FaMapMarkerAlt className="mt-0.5 shrink-0 text-slate-300" />
                <span className="min-w-0 break-words">{event.location || 'Not specified'}</span>
              </div>
            </div>

            {event.notes ? <p className="mt-3 text-sm text-slate-300">{event.notes}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default ProductStageEventsSection;
