# Body Fat Formula Verification

## 1. Navy / DoD Method (Male)
**Published formula:** BF% = 86.010 × log10(abdomen − neck) − 70.041 × log10(height) + 36.76
**All measurements in inches.**
**Current code:** CORRECT - matches exactly.
- Source: calculator.net, rippedbody.com, mynavyhr.navy.mil, multiple academic papers

## 2. YMCA Formula (Male)
**Published formula:** BF% = (−98.42 + 4.15 × waist − 0.082 × weight) / weight × 100
**Current code uses lean body approach:**
  leanBody = (weight × 1.082) + (waist × −4.15) + 94.42
  BF% = ((weight − leanBody) / weight) × 100

Let me verify these are equivalent:
  leanBody = 1.082w − 4.15c + 94.42
  fatMass = w − leanBody = w − 1.082w + 4.15c − 94.42 = −0.082w + 4.15c − 94.42
  BF% = fatMass/w × 100 = (−0.082w + 4.15c − 94.42)/w × 100

Published: (−98.42 + 4.15c − 0.082w)/w × 100

These are NOT the same! The constant is different:
- Code uses: −94.42 (via 94.42 in lean body)
- Published: −98.42

The code has the WRONG constant. Should be 98.42 not 94.42.

Let me verify with numbers (waist=41, weight=225):
- Published: (−98.42 + 4.15×41 − 0.082×225) / 225 × 100
  = (−98.42 + 170.15 − 18.45) / 225 × 100
  = 53.28 / 225 × 100 = 23.68%

- Code: lean = (225 × 1.082) + (41 × −4.15) + 94.42
  = 243.45 − 170.15 + 94.42 = 167.72
  BF% = (225 − 167.72) / 225 × 100 = 57.28 / 225 × 100 = 25.46%

So the code gives 25.5% but published gives 23.7%. The constant is wrong.

Correct lean body formula should be:
  leanBody = (weight × 1.082) + (waist × −4.15) + 98.42

## 3. Covert Bailey Method (Male)
**Published formula:** BF% = waist + (0.5 × hip) − (3.0 × forearm) − wrist
**Source:** Cora health app, "Fit or Fat?" by Covert Bailey
**Current code:** Uses neck instead of wrist, with a +10.0 constant. WRONG.
**Fix:** Add wrist field, use original formula: waist + 0.5*hip - 3*forearm - wrist

With user's numbers (waist=41, hip=41, forearm=12.25, wrist=~7.5):
  = 41 + 20.5 − 36.75 − 7.5 = 17.25%
