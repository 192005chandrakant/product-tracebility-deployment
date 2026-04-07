import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaMagic, FaShieldAlt } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import AIProductChatPanel from '../components/AIProductChatPanel';
import AIDescriptionGeneratorPanel from '../components/AIDescriptionGeneratorPanel';
import { isAIEnabled } from '../utils/aiApi';
import { SETTINGS_CHANGED_EVENT } from '../utils/appSettings';

function AIConsole() {
  const [enableAI, setEnableAI] = useState(isAIEnabled());
  const [productId, setProductId] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const prefilledProductId = searchParams.get('productId') || '';
    if (prefilledProductId) {
      setProductId(prefilledProductId);
    }
  }, [searchParams]);

  useEffect(() => {
    const syncAISetting = () => setEnableAI(isAIEnabled());
    window.addEventListener('storage', syncAISetting);
    window.addEventListener(SETTINGS_CHANGED_EVENT, syncAISetting);

    return () => {
      window.removeEventListener('storage', syncAISetting);
      window.removeEventListener(SETTINGS_CHANGED_EVENT, syncAISetting);
    };
  }, []);

  if (!enableAI) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-xl w-full text-center p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700 shadow-xl">
          <FaShieldAlt className="mx-auto text-5xl text-blue-500 mb-4" />
          <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">AI tools are disabled</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Enable <span className="font-mono">REACT_APP_ENABLE_AI_FEATURES=true</span> to use the AI Console.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto px-4 space-y-8"
      >
        <section className="rounded-3xl p-8 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 text-white shadow-2xl border border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <FaRobot className="text-2xl text-cyan-300" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">AI Console</h1>
              <p className="mt-3 text-white/75 max-w-3xl">
                Ask questions about a product, or generate a production-ready description from keywords.
                AI responses stay isolated from the core traceability workflow.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <FaMagic className="text-cyan-500" />
              <h2 className="text-2xl font-semibold">Description Generator</h2>
            </div>
            <AIDescriptionGeneratorPanel />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <FaRobot className="text-blue-500" />
              <h2 className="text-2xl font-semibold">Product Chat</h2>
            </div>
            <div className="rounded-xl p-4 border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-900/70 space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Product ID
                <input
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  placeholder="Enter a product ID"
                  className="mt-2 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-slate-800"
                />
              </label>
              {searchParams.get('productId') ? (
                <p className="text-xs text-cyan-700 dark:text-cyan-300">
                  Prefilled from a scan or direct link.
                </p>
              ) : null}
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ask questions against the live product record after selecting a valid ID.
              </p>
            </div>
            <AIProductChatPanel productId={productId.trim()} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default AIConsole;
