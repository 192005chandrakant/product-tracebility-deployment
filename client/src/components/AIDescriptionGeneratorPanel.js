import React, { useState } from 'react';
import { FaMagic, FaPenNib, FaBolt, FaSpinner } from 'react-icons/fa';
import { generateProductDescription } from '../utils/aiApi';
import AIStructuredResponse from './AIStructuredResponse';
import GlowingButton from './UI/GlowingButton';

function AIDescriptionGeneratorPanel({ onUseDescription }) {
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professional');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    setDescription('');

    if (!keywords.trim()) {
      setError('Please enter keywords');
      return;
    }

    setLoading(true);
    try {
      const response = await generateProductDescription({
        keywords: keywords.trim(),
        tone
      });

      if (response && response.success && response.data) {
        setDescription(response.data.description || 'No description returned.');
      } else {
        setError((response && response.message) || 'Unable to generate description');
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to generate description');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="cyber-glass rounded-[24px] border border-white/10 p-5">
      <div className="mb-4 flex items-start gap-4">
        <div className="panel-icon-shell">
          <FaMagic className="text-base text-teal-500 dark:text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Generate Product Description</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Turn technical keywords into polished product copy for listings, trace pages, and onboarding forms.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
          placeholder="Example: organic coffee beans, single origin, arabica, fair trade"
          className="form-control min-h-[6.5rem] p-3"
          rows={3}
          maxLength={1200}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-2">
              <FaPenNib className="text-purple-500" />
              Tone
            </span>
            <select
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              className="form-control w-auto min-w-[10rem] px-3 py-2"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="technical">Technical</option>
              <option value="marketing">Marketing</option>
            </select>
          </label>

          <GlowingButton type="button" onClick={handleGenerate} disabled={loading} size="sm" glowColor="green">
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FaBolt />
                Generate
              </>
            )}
          </GlowingButton>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

      {description ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/45 p-4 dark:bg-white/5">
          <AIStructuredResponse
            content={description}
            fallbackTitle="Generated Description"
            titleClassName="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-200"
            bodyClassName="text-sm leading-6 text-slate-700 dark:text-slate-200"
          />
          {typeof onUseDescription === 'function' ? (
            <div className="mt-3">
              <GlowingButton type="button" onClick={() => onUseDescription(description)} size="sm" variant="secondary" glowColor="green">
                Use in Form
              </GlowingButton>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default AIDescriptionGeneratorPanel;
