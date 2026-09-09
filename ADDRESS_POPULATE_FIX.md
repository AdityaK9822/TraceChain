# Address Auto-Populate Fix

## Problem

When clicking an entry in the Live Feed, the address was not automatically populating in the search box.

## Root Cause

The `AddressSearch` component used `useState(initialAddress)` which only initializes state once on mount. When the parent component (`page.jsx`) updated `selectedAddress` prop after clicking a feed entry, the component's internal state didn't react to this change.

## Solution

Added a `useEffect` hook in `AddressSearch.jsx` that watches for changes to `initialAddress` and `initialChain` props and syncs them with the component's internal state.

### Code Changes

**File**: `frontend/components/Landing/AddressSearch.jsx`

**Added** (after line 18):
```javascript
useEffect(() => {
  if (initialAddress) {
    setAddress(initialAddress);
    if (initialChain) {
      setChain(initialChain);
    } else {
      const detected = detectChain(initialAddress);
      setChain(detected);
    }
    setError("");
  }
}, [initialAddress, initialChain]);
```

**Also added**: `useEffect` to imports:
```javascript
import { useState, useEffect } from "react";
```

## How It Works

1. User clicks feed entry → `LiveFeed` calls `onSelectAddress(address, chain)`
2. Parent component updates: `setSelectedAddress(address)` and `setSelectedChain(chain)`
3. Props passed to `AddressSearch`: `initialAddress={selectedAddress}`
4. `useEffect` detects `initialAddress` change and updates internal state
5. Search box displays the new address
6. Chain auto-detected or uses provided chain

## Dependencies Added

- `useEffect` hook from React (already available in React 19)

## Testing

Build test: ✅ PASSED
```bash
npm run build
# ✓ Compiled successfully in 1123ms
```

Manual test:
1. Open landing page
2. Click any fraud report in live feed
3. Address should immediately appear in search box
4. Chain badge should show correct chain
5. Ready to click "Investigate"

## Result

The search box now properly auto-populates when clicking feed entries.
