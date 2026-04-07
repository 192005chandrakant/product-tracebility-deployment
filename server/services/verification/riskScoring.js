function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function uniqueIssues(issues) {
  return [...new Set((issues || []).filter(Boolean))].slice(0, 30);
}

function computeVerificationRisk({ fileValidation, aiAnalysis, fieldMatch, aiFailure }) {
  let riskScore = 0;
  const issues = [];
  const criticalFailures = [];

  if (!fileValidation || !fileValidation.valid) {
    riskScore += 100;
    criticalFailures.push('invalid_file');
    issues.push(...((fileValidation && fileValidation.issues) || ['Certificate file validation failed.']));
  }

  if (aiFailure) {
    riskScore += 20;
    issues.push('AI verification service failed; confidence in certificate assessment is reduced.');
  }

  if (aiAnalysis) {
    const structure = aiAnalysis.structure || 'warning';
    if (structure === 'fail') {
      riskScore += 35;
      criticalFailures.push('structure_fail');
      issues.push('Certificate structure appears invalid.');
    } else if (structure === 'warning') {
      riskScore += 15;
      issues.push('Certificate structure has warnings.');
    }

    const signature = aiAnalysis.signaturePresence || 'unclear';
    if (signature === 'missing') {
      riskScore += 25;
      criticalFailures.push('signature_missing');
      issues.push('Signature or seal appears missing.');
    } else if (signature === 'unclear') {
      riskScore += 10;
      issues.push('Signature presence is unclear.');
    }

    const dateValidation = aiAnalysis.dateValidation || 'unclear';
    if (dateValidation === 'expired') {
      riskScore += 25;
      criticalFailures.push('expired_certificate');
      issues.push('Certificate appears expired.');
    } else if (dateValidation === 'missing') {
      riskScore += 15;
      issues.push('Certificate date information is missing.');
    } else if (dateValidation === 'unclear') {
      riskScore += 10;
      issues.push('Certificate date validity is unclear.');
    }

    const language = aiAnalysis.languageQuality || 'warning';
    if (language === 'fail') {
      riskScore += 10;
      issues.push('Certificate language quality appears inconsistent.');
    } else if (language === 'warning') {
      riskScore += 5;
      issues.push('Certificate language quality has minor warnings.');
    }

    const logo = aiAnalysis.logoConsistency || 'unclear';
    if (logo === 'fail') {
      riskScore += 8;
      issues.push('Logo/branding appears inconsistent.');
    } else if (logo === 'warning') {
      riskScore += 4;
      issues.push('Logo/branding has minor inconsistencies.');
    } else if (logo === 'unclear') {
      riskScore += 2;
    }

    const confidence = Number(aiAnalysis.confidence || 0);
    if (confidence < 40) {
      riskScore += 10;
      issues.push('AI confidence is low for certificate interpretation.');
    } else if (confidence < 70) {
      riskScore += 5;
      issues.push('AI confidence is moderate; manual review may be needed.');
    }

    if (Array.isArray(aiAnalysis.issues) && aiAnalysis.issues.length) {
      issues.push(...aiAnalysis.issues);
    }
  }

  if (fieldMatch) {
    if (fieldMatch.overall === 'fail') {
      riskScore += 25;
      criticalFailures.push('field_mismatch');
      issues.push('Critical field mismatch between form data and certificate.');
    } else if (fieldMatch.overall === 'warning') {
      riskScore += 10;
      issues.push('Field matching is partial and requires additional review.');
    }

    if (Array.isArray(fieldMatch.issues) && fieldMatch.issues.length) {
      issues.push(...fieldMatch.issues);
    }
  }

  return {
    riskScore: clamp(Math.round(riskScore), 0, 100),
    issues: uniqueIssues(issues),
    criticalFailures: uniqueIssues(criticalFailures)
  };
}

module.exports = {
  computeVerificationRisk
};
