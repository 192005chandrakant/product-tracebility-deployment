import React, { useEffect, useState } from 'react';
import { FaRobot, FaPaperPlane, FaCommentDots, FaSpinner } from 'react-icons/fa';
import { aiChat } from '../utils/aiApi';
import AIStructuredResponse from './AIStructuredResponse';
import GlowingButton from './UI/GlowingButton';

function AIProductChatPanel({ productId }) {
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setReply('');
    setError('');
    setChatHistory([]);
    setQuestion('');
  }, [productId]);

  const handleAsk = async (event) => {
    event.preventDefault();
    setError('');
    setReply('');

    if (!productId) {
      setError('Product ID is required');
      return;
    }

    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    try {
      const response = await aiChat({
        productId,
        question: question.trim(),
        chatHistory
      });

      if (response && response.success && response.data) {
        const finalReply = response.data.reply || 'No response received.';
        setReply(finalReply);
        setChatHistory((previous) => {
          const next = [
            ...previous,
            { role: 'user', message: question.trim() },
            { role: 'assistant', message: finalReply }
          ];
          return next.slice(-8);
        });
        setQuestion('');
      } else {
        setError((response && response.message) || 'Unable to get AI response');
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to get AI response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="cyber-glass rounded-[24px] border border-white/10 p-5">
      <div className="mb-4 flex items-start gap-4">
        <div className="panel-icon-shell">
          <FaRobot className="text-base text-purple-500 dark:text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ask AI About This Product</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Ask about certifications, origin, lifecycle changes, or verification outcomes using the live product record.
          </p>
        </div>
      </div>

      <form onSubmit={handleAsk} className="space-y-3">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about certifications, origin, or lifecycle stages"
          className="form-control min-h-[7.5rem] p-3"
          rows={4}
          maxLength={800}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/40 px-3 py-1.5 text-xs font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <FaCommentDots className="text-purple-500" />
            {productId ? `Context bound to ${productId}` : 'Add a product ID to enable chat'}
          </div>
          <GlowingButton type="submit" disabled={loading} size="sm">
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Asking...
              </>
            ) : (
              <>
                <FaPaperPlane />
                Ask AI
              </>
            )}
          </GlowingButton>
        </div>
      </form>

      {chatHistory.length > 0 ? (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Context memory active for this product chat ({Math.ceil(chatHistory.length / 2)} turn(s)).
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

      {reply ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/45 p-4 dark:bg-white/5">
          <AIStructuredResponse
            content={reply}
            fallbackTitle="AI Guidance"
            titleClassName="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-200"
            bodyClassName="text-sm leading-6 text-slate-700 dark:text-slate-200"
          />
        </div>
      ) : null}
    </section>
  );
}

export default AIProductChatPanel;
