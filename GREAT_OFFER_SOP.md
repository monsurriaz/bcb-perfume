# Great Offer Section - Standard Operating Procedure (SOP)

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [How It Works](#how-it-works)
4. [Technical Architecture](#technical-architecture)
5. [Installation Guide](#installation-guide)
6. [Configuration](#configuration)
7. [Schema & Block Types](#schema--block-types)
8. [Troubleshooting](#troubleshooting)
9. [Browser Compatibility](#browser-compatibility)

---

## Overview

The **Great Offer Section** is a Shopify Liquid section that enables bundle pricing with a guided purchasing experience. Customers select a size tier, choose multiple scents via an interactive modal, and add all items to cart in a single transaction.

### Perfect For:
- Bundle deals (e.g., "Choose Your 3 Scents")
- Promotional tier pricing
- Sample packs or multi-item promotions
- Inventory clearance bundles

---

## Features

✅ **Two Configurable Block Types:**
- **Tier Card** - Standard size tiers with product selection
- **Best Value Tier** - Featured tier with special styling (max 1 per section)

✅ **Interactive Modal UI:**
- Checkbox-based scent selection
- Real-time selection counter
- Prevents over-selection with disabled state

✅ **Smart Cart Integration:**
- Dynamic variant detection by option matching
- Bulk add-to-cart via Shopify API
- Proper cart update event dispatch
- Works with Horizon theme cart system

✅ **Robust Error Handling:**
- HTTP validation with status codes
- Response structure validation
- User-friendly error messages
- Network failure handling

✅ **Dynamic Configuration:**
- Configurable product lists per block
- Custom quantity per tier
- Size label customization
- Optional "Best Value" badge text

✅ **Gentle UX Transitions:**
- 400ms delay between modal close and cart update
- Smooth animations
- Disabled button state during submission

---

## How It Works

### User Flow

```
1. Customer views Great Offer cards on page
   ↓
2. Clicks "Select Now" on a tier card
   ↓
3. Modal opens with scent options (checkboxes)
   ↓
4. Selects exactly N scents (matches tier quantity)
   ↓
5. Confirm button enables → Click to add all to cart
   ↓
6. Modal closes with transition
   ↓
7. Cart drawer opens (if auto-open enabled)
   ↓
8. All scents added as individual line items
```

### Technical Flow

**JavaScript (great-offer.js):**
1. **startFlow()** - Parses card data attributes (scents JSON, qty, size label)
2. **rebuildModal()** - Creates checkbox UI for each scent variant
3. **handleCheckboxChange()** - Enforces max quantity selection rule
4. **handleConfirm()** - Collects checked variants and sends ATC request
5. **dispatchCartAddEvent()** - Notifies theme cart system of update

**Liquid (great-offer.liquid):**
1. Schema defines configurable blocks
2. Renders cards with data attributes (variant IDs, scents as JSON)
3. Modal HTML structure (populated by JS)
4. CSS styling with BEM conventions

---

## Technical Architecture

### Files Included

```
sections/
  └── great-offer.liquid          (Liquid template + CSS + schema)
assets/
  └── great-offer.js              (JavaScript logic - IIFE pattern)
```

### Dependencies
- **Shopify Liquid** (standard theme support)
- **Web Components API** (native browser support)
- **Fetch API** (for cart operations)
- **Horizon Theme** (or any theme with cart system)

### Key Functions

| Function | Purpose |
|----------|---------|
| `startFlow(cardEl)` | Initialize modal with card data |
| `rebuildModal()` | Render scent checkboxes |
| `handleCheckboxChange(e)` | Enforce selection limit |
| `handleConfirm()` | Build payload and send to /cart/add |
| `dispatchCartAddEvent()` | Trigger cart:update event |
| `closeModal()` | Hide modal with cleanup |

---

## Installation Guide

### Step 1: Copy Files to Your Theme

Copy the following files to your Shopify theme directory:

```
Your Theme/
├── sections/
│   └── great-offer.liquid          (NEW)
└── assets/
    └── great-offer.js              (NEW)
```

**If files don't exist:**
- Create `/sections/` folder if missing
- Create `/assets/` folder if missing

### Step 2: Update Cart Configuration (Theme Dependent)

**For Horizon Theme:**
Already configured. Skip to Step 3.

**For Other Themes:**
Ensure your theme has:
- A cart drawer or cart page
- Support for `cart-items-component` with `data-section-id` attribute
- Support for custom events (specifically `'cart:update'` event)

If using a different component structure, you may need to:
1. Update cart component selectors in `great-offer.js`
2. Adjust the `dispatchCartAddEvent()` event detail structure

### Step 3: Add Section to Page

1. Go to **Shopify Admin → Online Store → Customize Theme**
2. Add section to desired page (home, campaign page, etc.)
3. Click **"Add block"** to create tier cards
4. Configure each card (see Configuration section below)

### Step 4: Test

1. Save changes
2. Preview theme
3. Click "Select Now" on a card
4. Verify modal opens with correct scents
5. Test checkbox selection (should enforce quantity limit)
6. Click confirm and verify items appear in cart
7. Check cart drawer/page updates correctly

---

## Configuration

### Block Type 1: Tier Card

**Settings Available:**

| Setting | Type | Required | Description |
|---------|------|----------|-------------|
| `products` | Product List | Yes | Select which products (scents) to display |
| `size_option_value` | Text | Yes | The size variant option (e.g., "100ml", "50ml") |
| `quantity` | Number | Yes | How many scents customer must select |
| `size_label` | Text | Yes | Display label (e.g., "Bottles") |
| `card_title` | Text | Yes | Card heading |
| `card_description` | Text | No | Card description/body text |
| `price_display` | Text | No | Custom price label |

**Example:**
- Products: Select 3 scent products (Lavender, Rose, Jasmine, Sandalwood)
- Size Option Value: "100ml"
- Quantity: 3
- Size Label: "Bottles"
- Card Title: "Deluxe Set"
- Card Description: "Choose your 3 favorite fragrances"

### Block Type 2: Best Value Tier

**Same settings as Tier Card, plus:**

| Setting | Type | Required | Description |
|---------|------|----------|-------------|
| `saving_text` | Text | No | Badge text (e.g., "Save 20%") |

**Rules:**
- Maximum 1 "Best Value Tier" block per section
- Auto-styled with dark background and gold accents
- Features a badge in top-right corner

---

## Schema & Block Types

### Understanding the Schema

The section uses Shopify's block system with two distinct block types:

**offer_card (Tier Card):**
- Unlimited quantity per section
- Standard styling
- For regular tier options

**featured_offer_card (Best Value Tier):**
- Max 1 per section (enforced by schema `"max": 1`)
- Premium styling with background color and badge
- For your top recommended bundle

### Modifying Schema

To add new settings or blocks:

1. Open `sections/great-offer.liquid`
2. Locate the `{% schema %}` section (at bottom)
3. Add new settings to the appropriate block's `"settings"` array
4. Liquid will automatically expose new field in editor
5. Access via `block.settings.your_setting_name` in template

**Example - Adding a "Custom Badge Color":**
```liquid
{
  "type": "color",
  "id": "badge_color",
  "label": "Badge Color",
  "default": "#D4AF37"
}
```

---

## Troubleshooting

### Issue: Modal doesn't open when clicking card

**Causes & Solutions:**
1. **JavaScript not loaded** → Check browser console for errors
2. **Card missing data attributes** → Verify `data-scents`, `data-qty`, `data-sizeLabel` in HTML
3. **Modal element not found** → Ensure `#go-modal` exists in DOM

**Debug Steps:**
```javascript
// In browser console, click the card and run:
console.log(window.goStartFlow);  // Should be a function
console.log(document.querySelector('#go-modal'));  // Should exist
```

### Issue: "Add to cart" button not working

**Causes & Solutions:**
1. **Incorrect variant IDs** → Ensure variant IDs in scents JSON are valid
2. **Cart endpoint down** → Check network tab in DevTools
3. **Response format unexpected** → Check browser console for error messages

**Debug Steps:**
```javascript
// Check the fetch request
// In DevTools → Network tab → Look for /cart/add.js POST request
// Check response: Should be JSON object
```

### Issue: Cart doesn't update after adding items

**Causes & Solutions:**
1. **Missing cart-items-component** → Section requires theme to have this component
2. **Wrong event name** → Verify `'cart:update'` event is recognized by theme
3. **Event listener not attached** → Check if theme listens to `'cart:update'` event

**For Non-Horizon Themes:**
Edit `assets/great-offer.js` lines 221-236:
```javascript
function dispatchCartAddEvent(itemCount, sections) {
  // Change event name here:
  const event = new CustomEvent('your-theme-cart-event', {
    bubbles: true,
    detail: {
      itemCount: itemCount,
      sections: sections || []
    }
  });
  document.dispatchEvent(event);
}
```

### Issue: Styles not applying / looks broken

**Causes & Solutions:**
1. **CSS scoped incorrectly** → All classes prefixed with `.great-offer-section`
2. **Theme CSS conflicts** → Higher specificity might override
3. **Missing CSS** → Inline stylesheet not loaded

**Solution:**
If theme has conflicting styles, increase specificity in `great-offer.liquid`:
```css
/* Add !important if necessary (last resort) */
.great-offer-section .go-card {
  border: 1px solid #e0e0e0 !important;
}
```

---

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Latest 2 versions |
| Firefox | ✅ Full | Latest 2 versions |
| Safari | ✅ Full | iOS 14+, macOS 11+ |
| Edge | ✅ Full | Chromium-based (79+) |
| Internet Explorer | ❌ Not Supported | Uses modern JavaScript (ES2020) |

### Required APIs:
- Fetch API
- querySelector/querySelectorAll
- CustomEvent
- JSON.parse/stringify
- Object.entries
- Array.from

---

## Advanced Configuration

### Customizing Error Messages

Edit `assets/great-offer.js` lines 175-190:

```javascript
.then((data) => {
  // Change error message here:
  showError('Your custom message');
})
.catch((err) => {
  // Change catch message here:
  const errorMsg = 'Your custom error message';
  showError(errorMsg);
});
```

### Changing Modal Transition Delay

Edit `assets/great-offer.js` line 182:

```javascript
setTimeout(() => {
  dispatchCartAddEvent(items.length, data.sections || sectionIds);
}, 400);  // Change 400 to your preferred milliseconds
```

### Customizing Modal Styling

Edit `sections/great-offer.liquid` lines 125-565 (CSS section):

```css
.great-offer-section #go-modal {
  /* Customize modal appearance here */
  --modal-bg: #ffffff;
  --modal-border: 1px solid #e0e0e0;
}
```

---

## Performance Notes

- **JavaScript Size:** ~6KB (minified)
- **CSS Size:** ~8KB (minified)
- **Load Time:** Async loaded (non-blocking)
- **Browser Performance:** Lightweight IIFE pattern, no external dependencies

---

## Security Considerations

✅ **CSRF Protection:** Shopify handles CSRF tokens for /cart/add requests
✅ **XSS Prevention:** Uses `textContent` instead of `innerHTML` for dynamic text
✅ **Input Validation:** All variant IDs validated before cart request
✅ **API URL Validation:** Dynamic URL resolution with secure fallback

---

## Maintenance & Updates

### Regular Checks:
- Monitor browser console for JavaScript errors
- Test on new Shopify API versions
- Verify cart integration still works after theme updates
- Check for variant availability changes

### Version History:
- **v1.0** - Initial release with two block types
- Features: Modal selection, cart integration, error handling

---

## Support & Debugging

### Enable Debug Logging

Add to browser console:
```javascript
// Check if section is initialized
console.log('goStartFlow exists:', typeof window.goStartFlow === 'function');

// Check card data
const card = document.querySelector('.go-card');
console.log('Card scents:', card?.dataset.scents);
console.log('Card qty:', card?.dataset.qty);
```

### Common Questions

**Q: Can I add more than 2 block types?**
A: Yes, edit the `"blocks"` array in the schema and follow the pattern.

**Q: Can I use product variants instead of separate products?**
A: No, the current implementation requires separate products. Variants are detected by option matching.

**Q: Does this work with inventory tracking?**
A: Yes, Shopify's API automatically handles inventory validation.

**Q: Can customers see unavailable variants?**
A: Yes, but they're displayed with a "unavailable" class and disabled checkbox.

---

## File Structure Checklist

Before installing, verify all files are in place:

```
✅ sections/great-offer.liquid
   - Contains: schema, Liquid logic, CSS, HTML modal
   - Lines: ~600
   - Size: ~25KB

✅ assets/great-offer.js
   - Contains: IIFE, event handlers, cart API logic
   - Lines: ~280
   - Size: ~8KB
```

---

**Last Updated:** May 15, 2026
**Version:** 1.0
**Tested On:** Shopify Horizon Theme v2.1.6
