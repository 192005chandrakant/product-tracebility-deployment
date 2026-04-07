function decideVerificationOutcome({ riskScore, criticalFailures = [], aiFailed = false, aiRecommendedAction = 'flagged' }) {
  const normalizedRisk = Number.isFinite(Number(riskScore)) ? Number(riskScore) : 100;
  const hasCriticalFailure = Array.isArray(criticalFailures) && criticalFailures.length > 0;

  if (hasCriticalFailure) {
    return {
      status: 'blocked',
      reviewState: 'rejected',
      reason: 'Critical verification rule failed.'
    };
  }

  if (aiFailed && aiRecommendedAction === 'blocked') {
    return {
      status: 'blocked',
      reviewState: 'rejected',
      reason: 'AI verification failed under strict failure policy.'
    };
  }

  if (aiFailed && aiRecommendedAction === 'flagged') {
    return {
      status: 'flagged',
      reviewState: 'pending_review',
      reason: 'AI verification failed and policy requires manual review.'
    };
  }

  if (normalizedRisk >= 75) {
    return {
      status: 'blocked',
      reviewState: 'rejected',
      reason: 'Risk score above blocking threshold.'
    };
  }

  if (normalizedRisk >= 40 || aiFailed) {
    return {
      status: 'flagged',
      reviewState: 'pending_review',
      reason: 'Medium risk or uncertain verification outcome.'
    };
  }

  return {
    status: 'allowed',
    reviewState: 'verified',
    reason: 'Verification checks are within acceptable risk threshold.'
  };
}

module.exports = {
  decideVerificationOutcome
};
