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
    <section className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <FaListUl className="text-indigo-500" />
        Stage Events
      </h3>

      <div className="space-y-3">
        {normalized.map((event, index) => (
          <article key={`${event.stage || 'stage'}-${index}`} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                {event.stage || 'Unknown Stage'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2 min-w-0">
                <FaCalendarAlt className="text-slate-500 mt-0.5 shrink-0" />
                <span className="min-w-0 break-words">{toDisplayDate(event.timestamp || event.recordedAt)}</span>
              </div>
              <div className="flex items-start gap-2 min-w-0">
                <FaIndustry className="text-slate-500 mt-0.5 shrink-0" />
                <span className="min-w-0 break-all">{event.actor || event.updatedBy || 'system'}</span>
              </div>
              <div className="flex items-start gap-2 min-w-0">
                <FaMapMarkerAlt className="text-slate-500 mt-0.5 shrink-0" />
                <span className="min-w-0 break-words">{event.location || 'Not specified'}</span>
              </div>
            </div>

            {event.notes ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{event.notes}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default ProductStageEventsSection;
