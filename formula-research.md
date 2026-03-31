# Formula Verification Research

## Key Finding from Coach Donovan's site:
Covert Bailey Tape Method uses: hips, waist, forearm, and WRIST (for men)
NOT neck. This confirms our current implementation is correct.

## Verified Calculations (Python output):

### Navy/DoD: 25.3% ✅ CORRECT
- Formula: BF% = 86.010 * log10(waist - neck) - 70.041 * log10(height) + 36.76
- With neck=16.5, waist=41, height=74: 25.32%
- App shows: 25.3% ✅

### YMCA: 23.7% ✅ CORRECT  
- Formula: BF% = (-98.42 + 4.15 * waist - 0.082 * weight) / weight * 100
- With waist=41, weight=225: 23.68%
- App shows: 23.7% ✅

### Covert Bailey: 17.4% ✅ CORRECT (raw formula)
- Formula: BF% = waist + 0.5*hip - 3*forearm - wrist
- With waist=41, hip=41, forearm=12.25, wrist=7.3: 17.45%
- App shows: 17.4% ✅

### Composite: 22.1% ✅ CORRECT
- Average of (25.3 + 23.7 + 17.4) / 3 = 22.1%

## The spread issue:
- Navy: 25.3%
- YMCA: 23.7%
- Covert Bailey: 17.4%
- Spread: 7.9 percentage points

This spread is NORMAL for tape-based methods. The Navy and YMCA are waist-heavy
and tend to overestimate for muscular builds. Covert Bailey credits muscle (forearm, wrist)
and tends to underestimate. The composite average is the best single number.

## Conclusion: ALL THREE FORMULAS ARE NOW CORRECT
The wide spread is inherent to the formulas, not a bug.
