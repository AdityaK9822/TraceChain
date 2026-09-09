# TraceChain - Quick Start Guide

## 🚀 Running the Demo

### Prerequisites
- Node.js 18+
- Python 3.11+
- Backend dependencies installed

### Start Backend (Terminal 1)
```bash
cd backend
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uvicorn app.main:app --reload
```

✅ Backend running at: `http://localhost:8000`

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

✅ Frontend running at: `http://localhost:3000`

---

## 📋 Demo Walkthrough

### 1. Landing Page
- Open `http://localhost:3000`
- See hero: "Trace Illicit Crypto Funds"
- See LIVE fraud reports feed (6 entries)

### 2. Click Feed Entry
- Click any fraud report card
- **Address auto-populates in search box** ✅
- Chain badge appears (e.g., "Ethereum")
- Ready to investigate

### 3. Start Trace - **IMMEDIATE REDIRECT**
- Click "Investigate 🔍" button
- **Case page loads immediately** (< 100ms)
- No loading overlay blocking the view

### 4. Watch Trace Build Live
- **Historical analysis first** (right graph, fast ~2s)
- **Predicted deposit address** appears (amber banner)
- **Live trace progressively** (left graph, slow ~6-7s)
- **Nodes appear in real-time** (150ms historical, 900ms live)
- Purple rings show matched wallets

### 5. See Live Scoring
- Wallets classified as:
  - ⚠️ Laundering Mule Wallet
  - ✅ Genuine Personal Wallet
- Trust scores shown (0-100)
- Behavior reasons listed

### 6. Predicted Deposit Address - **BEFORE LIVE TRACE**
- Amber banner appears **after historical analysis**
- **Shows BEFORE live trace starts**
- Shows: "🎯 Predicted Deposit Address"
- Confidence: e.g., "94% confidence"
- Based on historical correlation

### 7. Confirmed Deposit Address - **VERIFICATION**
- Green banner appears when live trace reaches deposit
- **Confirms the prediction**
- Shows: "✅ Deposit Address Found"
- VASP details: Name, Jurisdiction, KYC Contact
- Copy button for KYC request

### 8. Historical Correlation - **DUAL GRAPHS**
- Side-by-side graphs:
  - **Left: Live trace** (building progressively)
  - **Right: Historical path** (completed first)
- Shared wallets highlighted in both
- Demonstrates prediction power visually

### 9. Generate Report
- Click "Generate Report" button
- Opens investigation report
- All findings documented

---

## 🧪 Test Different Chains

### Addresses to Try:

**Ethereum** (Investment Scam):
```
0x3cf0e2b4301a5c1d086c7eac5276deb6ac50e1dc
```

**Tron** (Sextortion):
```
TnkkEgbzyPpB5gJkNyC4vqXyMYeHE2WuFF
```

**Bitcoin** (Ransomware):
```
bc1qa42qj4xykcv7j6psp7tfamwm22twga4l4f3fsg
```

**BSC** (Fake Token/Rug Pull):
```
0xf65c4c5f48fab2027380bc2a22532de1c67f1b00
```

**Polygon** (Fake Job Scam):
```
0x1507766bc17f3bc7cb438327f24f2250b4366c35
```

**Solana** (Wallet-Drainer Phishing):
```
mL2ogFSrTbx5hyJHhnANqqj8FVfb91aMSnQCYGiVGdy6
```

---

## ⚡ Key Features

✅ **Real-Time Streaming**: Watch trace happen live on case page  
✅ **Immediate Redirect**: Case page loads instantly (< 100ms)  
✅ **Address Auto-Populate**: Click feed entry → address fills automatically  
✅ **Multi-Chain Support**: 6 chains with auto-detection  
✅ **Dual-Graph Visualization**: Live + Historical side-by-side  
✅ **AI Correlation**: Predict deposit addresses BEFORE live trace arrives  
✅ **Live Scoring**: Wallet classification during trace  
✅ **VASP Attribution**: Two-step (deposit address → VASP)  
✅ **Offline**: Works without network, all data fixtures  
✅ **Responsive**: Desktop + mobile layouts  

---

## 🔍 Verification

Build test:
```bash
cd frontend
npm run build
# ✓ Compiled successfully
```

Backend tests:
```bash
cd backend
source .venv/bin/activate
python -m pytest tests/ -v
# ============================== 51 passed in 0.06s ==============================
```

---

## 📊 Success Metrics

- Build: ✅ Passing
- Tests: ✅ 51/51 passing
- Demo Flow: ✅ Complete
- Address Populate: ✅ Fixed
- All Features: ✅ Working

---

## 🎯 What Makes This Different

1. **Not a Wallet Tracker**: This is a **fraud investigation tool**
2. **Predictive AI**: Predicts deposit addresses before funds arrive
3. **Real Archaeology**: Actual pattern detection (sweep, peel-chain, structuring)
4. **Multi-Chain**: 6 chains with proper validation
5. **No Network Dependency**: Runs completely offline with fixtures
6. **LEA Focus**: Built for law enforcement, not consumers

---

## 📚 Documentation

- `IMPLEMENTATION_SUMMARY.md` - Full implementation details
- `DEMO_FLOW.md` - Verification checklist
- `ADDRESS_POPULATE_FIX.md` - Bug fix documentation
- Backend tests: `backend/tests/`

---

## 🆘 Troubleshooting

### Address not populating?
- Clear browser cache
- Restart frontend: `npm run dev`
- Check console for errors

### Backend not responding?
- Verify backend running: `http://localhost:8000/docs`
- Check Python dependencies: `pip install -r requirements.txt`
- Restart backend: `uvicorn app.main:app --reload`

### Feed not loading?
- Backend must be running
- Check network tab for API errors
- Verify `/api/feed` endpoint: `curl http://localhost:8000/api/feed`

---

**Ready to demo!** 🎉

Start both servers and open `http://localhost:3000` to begin.
