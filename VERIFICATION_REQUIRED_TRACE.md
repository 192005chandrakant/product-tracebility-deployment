# Verification Status Origin Trace

## Where "Verification Required" Comes From

### High-Level Origin
The concept of "verification required" is implemented as the `reviewState: 'pending_review'` database value, which gets set when a product requires manual admin review.

### Decision Logic (Source of Truth)
**File:** `server/services/verification/decisionEngine.js`

When the decision engine processes a product, it sets `reviewState='pending_review'` in these scenarios:

#### 1. **AI Failed + Manual Review Policy** (Line 20-27)
```javascript
if (aiFailed && strategy === 'flagged') {
  return {
    status: 'flagged',
    reviewState: 'pending_review',  // ← SETS MANUAL REVIEW
    reason: 'AI verification failed and policy requires manual review.'
  };
}
```
**When triggered:** Gemini verification service fails → returns error → strategy='flagged' from config

#### 2. **Medium Risk Score** (Line 38-42)
```javascript
if (normalizedRisk >= 40 || aiFailed) {
  return {
    status: 'flagged',
    reviewState: 'pending_review',  // ← SETS MANUAL REVIEW
    reason: 'Medium risk or uncertain verification outcome.'
  };
}
```
**When triggered:** Risk score between 40-74 (medium range) calculated in `riskScoring.js`

### Risk Score Calculation (Where Scores Come From)
**File:** `server/services/verification/riskScoring.js`

Factors increasing risk score:
- **AI confidence low**: +30 points (line 75)
- **Field mismatches**: +25 points per field (line 62)
- **Date outside validity**: +35 points (line 67)
- **Issuer mismatch**: +40 points (line 56)
- **No certificate provided**: +100 points (results in blocked status) (line 130)

Score ranges:
- **0-39**: LOW RISK → Allowed/Verified ✅
- **40-74**: MEDIUM RISK → Flagged/Pending Review ⚠️
- **75-99**: HIGH RISK → Blocked/Rejected ❌
- **100+**: CRITICAL → Blocked/Rejected ❌

### UI Rendering of "Verification Required"
**File:** `client/src/components/ProductVerificationStatusSection.js` (Line 31-36)

```javascript
if (status === 'flagged' || status === 'pending_review') {
  return {
    color: 'warning',
    label: 'Manual Review',  // ← THIS IS THE UI TEXT
    Icon: AlertCircle
  };
}
```

**Other Locations:**
- AdminDashboard.js line 448: Counts products with `reviewState === 'pending_review'` as "pending"
- AdminDashboard.js line 961: Displays status/reviewState inline
- VerificationResultPanel.js line 72: Shows reviewState in verification details
- ProductDetail.js line 483: Displays reviewState in product detail view

### Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ PRODUCER: Uploads Product + Certificates                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ VERIFICATION PIPELINE (productController.addProduct)             │
│ 1. File validation (format, signature, expiry) ──┐              │
│ 2. Gemini AI analysis (content, authenticity)    ├─►            │
│ 3. Field matching (issuer, dates, type)          │              │
│ 4. Risk scoring (sum of factors above) ──────────┘              │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ DECISION ENGINE (decisionEngine.js)                              │
│ IF riskScore 40-74  ──► status='flagged'                         │
│                        reviewState='pending_review'              │
│ IF riskScore 75+    ──► status='blocked'                         │
│                        reviewState='rejected'                    │
│ IF riskScore 0-39   ──► status='allowed'                         │
│                        reviewState='verified'                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ [FIXED] DATABASE: Product record persisted with verification    │
│ (Even if reviewState='pending_review')                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ ADMIN DASHBOARD: Fetches products with                           │
│ verification.status='flagged' OR reviewState='pending_review'    │
│ ─► Displays in "Flagged/Pending Review" queue                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ UI RENDERING: Shows "Manual Review" badge for pending items      │
│ Admin can: Approve → reviewState='verified'                      │
│           Reject → reviewState='rejected'                        │
│           Remove → delete product or mark inactive               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary: Where Each Component Sets "Verification Required"

| Component | File | Decision | reviewState | Why |
|-----------|------|----------|------------|-----|
| **Risk Scorer** | `riskScoring.js` | Score 40-74 | pending_review | Medium risk = uncertain, needs manual review |
| **AI Verifier** | `geminiVerification.js` | AI fails | pending_review | When Gemini can't verify, flag for manual |
| **Decision Engine** | `decisionEngine.js` | Policy check | pending_review | Applies scoring logic → sets state |
| **Product Controller** | `productController.js` | Save product | Creates record with pending_review | [FIXED] Now persists instead of dropping |
| **Admin Query** | `adminController.js` | getFlaggedProducts() | Finds pending_review records | Returns all products needing admin attention |
| **Frontend Filter** | `AdminDashboard.js` | getModerationBucket() | Maps to "flagged" bucket | Groups pending_review for UI display |
| **UI Badge** | `ProductVerificationStatusSection.js` | Render status | Shows "Manual Review" label | User-facing text for pending_review state |

---

## Test Validation

All verification state transitions are covered by existing tests:

- ✅ `productController.addProduct.test.js`: Tests blocked persistence
- ✅ `adminController.actions.test.js`: Tests admin filtering of pending_review items
- ✅ `verificationPipeline.test.js`: Tests decision engine output
- ✅ `riskScoring.test.js`: Tests risk calculation

The system now correctly:
1. Calculates risk scores that trigger "verification required"
2. Persists products to DB instead of silently dropping them
3. Makes them queryable by admin dashboard
4. Displays them with appropriate UI indicators
