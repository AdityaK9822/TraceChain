# TraceChain Demo Flow Verification Checklist

## Prerequisites

1. Backend running: `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload`
2. Frontend running: `cd frontend && npm run dev`
3. Browser: `http://localhost:3000`

---

## Demo Flow Steps

### 1. Landing Page ✅
- [ ] Hero shows "Trace Illicit Crypto Funds" (not wallet tracker)
- [ ] Investigation entry section visible
- [ ] Live feed shows fraud reports
- [ ] Reports show LIVE badge with red pulse
- [ ] Each report shows: fraud type, amount in INR, state, time ago
- [ ] Chain badges display correctly (Ethereum, Tron, BSC, etc.)
- [ ] No wallet-connect references anywhere

### 2. Feed Interaction ✅
- [ ] Click any fraud report
- [ ] Address fills search box automatically
- [ ] Chain auto-detected and shown as badge
- [ ] Click "Investigate" button
- [ ] Loading spinner appears
- [ ] Navigates to case detail page

### 3. Manual Address Entry ✅
- [ ] Enter Ethereum address: `0x3cf0e2b4301a5c1d086c7eac5276deb6ac50e1dc`
- [ ] Chain auto-detects as "Ethereum"
- [ ] Click "Investigate"
- [ ] Trace starts

### 4. Case Detail - Graphs ✅
- [ ] Two graphs render side-by-side
- [ ] Left graph: "Live Trace" (animated)
- [ ] Right graph: "Historical Path" (static, dimmed)
- [ ] Graph builds hop-by-hop (~1 second per hop)
- [ ] Nodes appear progressively
- [ ] At least 10+ nodes in graph

### 5. Matched Nodes Highlighting ✅
- [ ] Some nodes have purple rings (matched)
- [ ] Same nodes highlighted in both graphs
- [ ] Purple rings glow effect visible

### 6. Live Scoring Panel ✅
- [ ] Panel shows "Scanning wallet history..." initially
- [ ] Populates as nodes are revealed
- [ ] Each wallet shows:
  - [ ] Icon (⚠️ for mule, ✅ for genuine)
  - [ ] Address (shortened)
  - [ ] Behavior label ("Laundering Mule" or "Genuine Personal")
  - [ ] Trust score badge (0-100)
  - [ ] Risk tag (mule, deposit_address, etc.)
  - [ ] Behavior reasons list

### 7. Deposit Address - Predicted ✅
- [ ] Amber banner appears BEFORE trace reaches deposit address
- [ ] Shows: "🎯 Predicted Deposit Address"
- [ ] Shows predicted address
- [ ] Shows confidence percentage (e.g., "94% confidence")
- [ ] Shows prior case label (e.g., "case eth-invest-prior")

### 8. Deposit Address - Confirmed ✅
- [ ] Green banner appears when trace reaches deposit address
- [ ] Shows: "✅ Deposit Address Found"
- [ ] Shows deposit address
- [ ] Shows VASP details:
  - [ ] Name (e.g., "Binance")
  - [ ] Jurisdiction (e.g., "Seychelles (global)")
  - [ ] KYC Contact (e.g., "LERS")
  - [ ] Response SLA days
- [ ] "Copy Address for KYC Request" button works
- [ ] Shows "✓ Copied" confirmation

### 9. Correlation Panel ✅
- [ ] "Historical Link Analysis" panel visible
- [ ] Confidence badge shows color:
  - [ ] High (≥90%): Green
  - [ ] Medium (≥70%): Amber
  - [ ] Low (<70%): Slate
- [ ] "Predicted Deposit Address" box shows:
  - [ ] Predicted address
  - [ ] VASP name and jurisdiction
- [ ] Rationale text explains prediction
- [ ] Shared wallets list shows:
  - [ ] Count (e.g., "6 wallets")
  - [ ] Each wallet address
  - [ ] Live hop number
  - [ ] Historical hop number
- [ ] "Deposit Reused" badge if applicable

### 10. Pattern Analysis ✅
- [ ] "AI-Assisted Analysis" panel shows findings
- [ ] Pattern types detected:
  - [ ] Sweep/Collection
  - [ ] Peel Chain Layering
  - [ ] Rapid Relay/Structuring
  - [ ] Round-Number Transfer
- [ ] Each finding shows severity (high/medium/low)
- [ ] Description explains the pattern
- [ ] Clickable node addresses

### 11. Node Inspector ✅
- [ ] Click any node in graph
- [ ] Inspector sidebar opens from right
- [ ] Shows:
  - [ ] Wallet address (full)
  - [ ] Risk tag (with correct color)
  - [ ] Live balance (in correct asset: ETH, BTC, USDT, etc.)
  - [ ] Risk classification details
  - [ ] Entity intelligence
  - [ ] Hop expansion controls
- [ ] Explorer link works for correct chain:
  - [ ] Ethereum → etherscan.io
  - [ ] Bitcoin → mempool.space
  - [ ] Tron → tronscan.org
  - [ ] BSC → bscscan.com
  - [ ] Polygon → polygonscan.com
  - [ ] Solana → solscan.io
- [ ] No hardcoded "Etherscan" labels
- [ ] Asset symbol correct (not always "ETH")

### 12. Responsive Layout ✅
- [ ] Desktop: Graphs side-by-side
- [ ] Tablet: Graphs side-by-side (narrower)
- [ ] Mobile: Graphs stacked vertically
- [ ] All panels visible and scrollable

### 13. Report Generation ✅
- [ ] Click "Generate Report" button
- [ ] Navigates to `/report/{caseId}`
- [ ] Report shows all case details
- [ ] Report renders without errors

### 14. Go Back ✅
- [ ] Navigate back to landing page
- [ ] Start new investigation
- [ ] Recent cases list updates

### 15. Multi-Chain Support ✅
Test with different addresses:
- [ ] Ethereum: `0x...` → Ethereum chain detected
- [ ] Bitcoin: `bc1...` → Bitcoin chain detected
- [ ] Tron: `T...` → Tron chain detected
- [ ] BSC: `0x...` → Ethereum detected (manual chain selection needed for demo)
- [ ] Polygon: `0x...` → Ethereum detected (manual chain selection needed for demo)
- [ ] Solana: `[1-9A-HJ-NP-Za-km-z]{32,44}` → Solana detected

---

## Edge Cases to Test

### Error Handling ✅
- [ ] Enter invalid address → Specific error message
- [ ] Enter empty address → "Please enter a wallet address"
- [ ] Backend not running → Error message shown
- [ ] Network request fails → Graceful error handling

### Empty States ✅
- [ ] No correlation → Correlation panel not shown
- [ ] Historical trace not available → Only live graph shown
- [ ] No patterns detected → "No suspicious patterns" message

### Loading States ✅
- [ ] Feed loading → Skeleton placeholders
- [ ] Trace loading → Spinner overlay
- [ ] Balance loading → Spinner in inspector

---

## Performance Checks

- [ ] Graph animation smooth (no jank)
- [ ] No memory leaks (check DevTools)
- [ ] No unnecessary re-renders
- [ ] API calls complete reasonably fast (<1s)

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

---

## Final Verification

**All steps above should pass with:**
- ✅ No console errors
- ✅ No JavaScript warnings
- ✅ No network errors
- ✅ No CSS breaking issues
- ✅ All interactions work as expected

---

## Demo Script

### 30-Second Pitch:

> "TraceChain is a real-time crypto fraud attribution system for law enforcement. 
> Watch how we trace illicit funds across blockchains and predict deposit addresses using AI.
> 
> [Click fraud report] 
> This investment scam in Maharashtra shows 31.8 lakh stolen.
> [Click Investigate]
> 
> The system traces funds hop-by-hop across mule wallets...
> Notice the live scoring panel classifying wallets as genuine or laundering operations.
> 
> [Wait for predicted banner]
> Using AI correlation with historical cases, we predict the deposit address with 94% confidence.
> 
> [Wait for confirmed banner]
> Deposit address found: Binance. We now have actionable intelligence—KYC contact details to identify the account holder.
> 
> [Click Generate Report]
> Full investigation report ready for court filing."

---

## Success Criteria

**Demo is successful when:**
1. All above checkboxes pass ✅
2. No errors in console ✅
3. Flow completes in <60 seconds ✅
4. Evaluator understands the value proposition ✅
5. Demo shows genuine fraud investigation workflow ✅

---

**End of Verification Checklist**
