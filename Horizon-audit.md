# Horizon Shopify Theme — Technical Audit Report
**Version:** 2.1.6  
**Date Generated:** 2026-05-14  
**Theme Author:** Shopify

---

## Executive Summary

The Horizon theme is a **section-based, block-driven Shopify theme** with a modern JavaScript component architecture built on Web Components and custom elements. It features:

- **Cart handling:** Flexible cart type (page or drawer) configured globally
- **Product forms:** Unified form submission via `product-form-component` custom element
- **Event-driven architecture:** Custom DOM events for cart/variant updates
- **Performance focus:** Optimized lazy loading, morph-based DOM updates, and session storage for cart state

---

## 1. Global Settings Schema

**File:** [config/settings_schema.json](config/settings_schema.json)

### Cart-Related Global Settings

| Setting ID | Type | Default | Purpose |
|-----------|------|---------|---------|
| `cart_type` | select | `page` | Controls whether cart renders as standalone page or drawer |
| `auto_open_cart_drawer` | checkbox | `false` | Auto-opens drawer when item added (if `cart_type == 'drawer'`) |
| `show_cart_note` | checkbox | `false` | Display seller note field in cart |
| `cart_note_open_by_default` | checkbox | `false` | Expand cart note section by default |
| `show_add_discount_code` | checkbox | `true` | Show discount code input in cart |
| `show_installments` | checkbox | `true` | Show payment installment options |
| `show_accelerated_checkout_buttons` | checkbox | `true` | Show Shop Pay / PayPal buttons |
| `product_title_case` | select | `default` | Cart product title text case |
| `cart_price_font` | select | `secondary` | Font family for cart prices (primary/secondary/tertiary) |
| `cart_thumbnail_border` | select | `none` | Cart thumbnail border style |
| `add_to_cart_animation` | checkbox | `true` | Enable fly-to-cart animation on product pages |
| `page_transition_enabled` | checkbox | `true` | Enable view transitions between pages |
| `transition_to_main_product` | checkbox | `true` | Enable view transition to product details on variant change |

### Color Scheme Settings

**Section Name:** `t:names.colors` (Line 36–322)  
Defines 30+ color properties including primary/secondary buttons, variant selection states, and inputs with `color_scheme_group` type. Cart and product interactions use:
- `primary_button_background`, `primary_button_text` (Add to Cart button)
- `variant_background_color`, `selected_variant_background_color` (Variant picker)
- `border` color (Cart item separators)

---

## 2. Template Map & Section Assignment

### Template Structure

The Horizon theme uses a **section-based architecture** rather than traditional template files. It has only one explicit template:

| Template | Location | Purpose | Assigned Sections |
|----------|----------|---------|-------------------|
| Gift Card | [templates/gift_card.liquid](templates/gift_card.liquid) | Gift card redemption page | System-defined |

### Dynamic Section Rendering

Templates are replaced by **dynamic sections** integrated via `content_for` Liquid tag. Page layouts are defined using section groups (header-group, footer-group) and blocks within sections.

### Key Sections for Cart/Product/Header

| Section | File | Purpose | Key Blocks |
|---------|------|---------|-----------|
| Product Template | [sections/product-template.liquid](sections/product-template.liquid) | Product detail pages | `_product-information` |
| Product Information | [sections/product-information.liquid](sections/product-information.liquid) | Product details layout (media + info) | `_product-details`, `_product-media-gallery` |
| Product Form | [blocks/buy-buttons.liquid](blocks/buy-buttons.liquid) | Form wrapper for ATC | `quantity`, `add-to-cart`, `accelerated-checkout` |
| Main Cart | [sections/main-cart.liquid](sections/main-cart.liquid) | Full-page cart view | `_cart-products`, `_cart-summary`, `_cart-title` |
| Header | [sections/header.liquid](sections/header.liquid) | Header bar | `_header-logo`, `_header-menu`, `header-actions` |

---

## 3. Section Architecture

### Product Information Section

**File:** [sections/product-information.liquid](sections/product-information.liquid:1-200)

#### Schema Settings Structure

```liquid
settings:
  - desktop_media_position (left/right)
  - equal_columns (boolean)
  - limit_details_width (boolean)
  - content_width (center-aligned / full-width)
  - color_scheme (color_scheme type)
  - gap (range in px)
```

#### Block Hierarchy

The `_product-details` block (child of product-information) accepts:
- **@theme blocks:** Built-in Shopify theme blocks
- **@app blocks:** App integrations
- **Custom blocks:**
  - `price` — Product price display
  - `variant-picker` — Variant selector
  - `buy-buttons` — Form with ATC
  - `product-description` — Product content
  - `product-inventory` — Stock status
  - `product-recommendations` — Related products
  - `review` — Product reviews

#### CSS Classes & BEM Pattern

```css
.product-information              /* Main container */
.product-information__grid        /* Grid layout */
.product-information__media       /* Media section */
.product-details                  /* Details container */
.product-information--media-left  /* Media position variant */
.product-information--media-right /* Media position variant */
.product-information__grid--half  /* Equal columns variant */
```

**Grid Layout:** Uses CSS subgrid with responsive adjustments (mobile: 1 column, desktop: media + details side-by-side).

---

### Add to Cart Form Block

**File:** [blocks/buy-buttons.liquid](blocks/buy-buttons.liquid:45–100)

#### Form Structure

```html
<product-form-component
  data-section-id="{{ section.id }}"
  data-product-id="{{ product.id }}"
  data-product-url="{{ product.url }}"
  on:submit="/handleSubmit"
  data-quantity-default="1"
>
  <form id="BuyButtons-ProductForm-{{ section.id }}" data-type="add-to-cart-form">
    <input 
      type="hidden" 
      name="id"
      ref="variantId"
      value="{{ variant.id }}"
    />
    <!-- Quantity & ATC buttons -->
  </form>
</product-form-component>
```

**Key Attributes:**
- `data-section-id`: Section ID for cart re-rendering
- `data-product-id`: Product ID for variant tracking
- `data-product-url`: Used for variant URL updates
- `on:submit="/handleSubmit"`: Routes to `ProductFormComponent.handleSubmit()`
- `ref="variantId"`: Input holding selected variant ID (lines 61–65)

#### CSS Classes

```css
.buy-buttons-block
.product-form-buttons          /* Flex container for buttons */
.product-form-buttons--stacked /* Stack buttons vertically */
.add-to-cart-button            /* ATC button styling */
.add-to-cart-button.button-secondary /* Secondary style variant */
.product-form-text__error      /* Error message container */
```

---

### Cart Drawer Component

**File:** [snippets/cart-drawer.liquid](snippets/cart-drawer.liquid:17–111)

#### HTML Structure

```html
<cart-drawer-component class="cart-drawer">
  <button on:click="/open" aria-label="...">
    <!-- Cart icon button -->
  </button>

  <dialog 
    ref="dialog" 
    class="cart-drawer__dialog dialog-modal"
  >
    <div class="cart-drawer__inner">
      <cart-items-component data-section-id="{{ section.id }}">
        <div id="cart-drawer-header" class="cart-drawer__header">
          <span class="cart-drawer__heading h3">
            {{ 'content.cart_title' | t }}
            {% render 'cart-bubble' %}
          </span>
          <button ref="closeButton" on:click="cart-drawer-component/close">
            <!-- Close icon -->
          </button>
        </div>

        <div class="cart-drawer__content">
          <scroll-hint class="cart-drawer__items">
            {% render 'cart-products' %}
          </scroll-hint>
          <div class="cart-drawer__summary">
            {% render 'cart-summary' %}
          </div>
        </div>
      </cart-items-component>
    </div>
  </dialog>
</cart-drawer-component>
```

**Key Element IDs/Classes:**
- `cart-drawer-component` — Web component container
- `cart-drawer__dialog` — Dialog element (uses HTML `<dialog>` API)
- `cart-drawer__header` — ID: `cart-drawer-header` (sticky header)
- `cart-drawer__content` — Main content area with scrollable items
- `cart-drawer__summary` — Sticky footer with totals/checkout

#### Open/Close Mechanism

1. **Opening:** Click handler calls `CartDrawerComponent.open()` → `showDialog()`
2. **Closing:** 
   - Button click → `CartDrawerComponent.close()` → `closeDialog()`
   - Also closes when Installments CTA clicked (prevents overlapping dialogs)
3. **Event Listener:** Listens for `CartAddEvent` and calls `open()` if `auto-open` attribute set (lines 12–23 in [assets/cart-drawer.js](assets/cart-drawer.js))

---

### Header Section

**File:** [sections/header.liquid](sections/header.liquid:1–150)

#### Key Data Flow

- **Transparent mode:** Conditionally enabled on home/product/collection pages
- **Sticky mode:** `scroll-up` or `always` options
- **Search style:** Modal, inline, or none
- **Cart integration:** Renders either drawer or link based on `settings.cart_type`

**Critical Logic (Lines 4–43):**
```liquid
assign order = 'logo,menu,localization,search,mobile_search,actions'
{% if shop.customer_accounts_enabled %}
  assign order = 'mobile_search,logo,menu,localization,search,actions'
{% endif %}
```

The `header-actions` block is rendered via [snippets/header-actions.liquid](snippets/header-actions.liquid) and includes the cart icon.

---

## 4. Cart Drawer — Detailed Specification

**Related Files:**
- Component: [assets/cart-drawer.js](assets/cart-drawer.js)
- Markup: [snippets/cart-drawer.liquid](snippets/cart-drawer.liquid)
- Button: [snippets/header-actions.liquid](snippets/header-actions.liquid:15–16)

### Container & IDs/Classes

| Element | Selector | Notes |
|---------|----------|-------|
| **Drawer Component** | `cart-drawer-component` | Web component extending `DialogComponent` |
| **Dialog Box** | `cart-drawer__dialog.dialog-modal` | HTML `<dialog>` element; positioned fixed right |
| **Inner Wrapper** | `cart-drawer__inner` | Flexbox container, height: 100% |
| **Header** | `#cart-drawer-header` (ID) | Sticky, contains title + close button |
| **Content Area** | `cart-drawer__content` | Flex column, scrollable items + sticky summary |
| **Items Container** | `cart-drawer__items > scroll-hint` | Scrollable region for cart line items |
| **Summary Footer** | `cart-drawer__summary` | Sticky, contains totals + checkout button |
| **Empty State** | `.cart-drawer--empty` | Applied to dialog when cart is empty |

### Open/Close Mechanics

**Opening:**
```javascript
// From cart-drawer.js, line 20–23
#handleCartAdd = () => {
  if (this.hasAttribute('auto-open')) {
    this.showDialog();
  }
};
```
Listens for `CartAddEvent` (custom event).

**Closing:**
```javascript
// From cart-drawer.js, line 26–37
open() {
  this.showDialog();
  // Also closes when Installments CTA clicked
}

close() {
  this.closeDialog();
}
```

**Triggering Elements:**
- **Open button:** `<button on:click="/open">` (line 26 in cart-drawer.liquid)
- **Close button:** `<button on:click="cart-drawer-component/close">` (line 80)
- **Auto-open attribute:** `<cart-drawer-component auto-open>` (line 21)

### Refresh/Re-render Trigger

**Mechanism:** Shopify Cart API fetch → HTML re-rendering via AJAX

**Flow (from product-form.js, lines 188–196):**
```javascript
fetch(Theme.routes.cart_add_url, {
  ...fetchCfg,
  headers: { Accept: 'text/html' },
  body: formData  // includes `sections` param
})
.then(response => response.json())
.then(response => {
  this.dispatchEvent(
    new CartAddEvent({}, id.toString(), {
      source: 'product-form-component',
      sections: response.sections  // Section HTML from server
    })
  );
});
```

**Post-ATC:** Cart drawer listens for `CartAddEvent` and re-renders via Shopify's section rendering API (the `sections` param causes the server to return updated HTML for specified section IDs).

---

## 5. Header Cart Count Element

**File:** [snippets/cart-bubble.liquid](snippets/cart-bubble.liquid)

### Element Hierarchy

```html
<div ref="cartBubble" class="cart-bubble">
  <span class="cart-bubble__background"></span>
  <span ref="cartBubbleText" class="cart-bubble__text">
    <span class="visually-hidden">
      {{ 'accessibility.cart_count' | t }}: {{ cart.item_count }}
    </span>
    <span 
      ref="cartBubbleCount"
      class="cart-bubble__text-count"
      data-testid="cart-bubble"
    >
      {{- cart.item_count -}}
    </span>
  </span>
</div>
```

### Selectors

| Element | Selector | Purpose |
|---------|----------|---------|
| **Bubble Container** | `.cart-bubble` (ref: `cartBubble`) | Badge element containing count |
| **Count Text** | `.cart-bubble__text-count` (ref: `cartBubbleCount`) | Displays numeric count (data-testid: `cart-bubble`) |
| **Bubble Text** | `.cart-bubble__text` (ref: `cartBubbleText`) | Wrapper for text with animation hook |
| **Background** | `.cart-bubble__background` | Visual background of badge |

### Update Mechanism

**Event Listener:** Listens to `ThemeEvents.cartUpdate` event

**File:** [assets/cart-icon.js](assets/cart-icon.js:30–48)

```javascript
onCartUpdate = async (event) => {
  const itemCount = event.detail.data?.itemCount ?? 0;
  const comingFromProductForm = event.detail.data?.source === 'product-form-component';
  
  this.renderCartBubble(itemCount, comingFromProductForm);
};

renderCartBubble = async (itemCount, comingFromProductForm, animate = true) => {
  // Updates DOM
  this.refs.cartBubbleCount.textContent = 
    comingFromProductForm 
      ? this.currentCartCount + itemCount 
      : itemCount;
  
  // Stores in sessionStorage for state persistence
  sessionStorage.setItem('cart-count', JSON.stringify({
    value: String(this.currentCartCount),
    timestamp: Date.now()
  }));
  
  // Triggers animation
  if (animate) {
    this.refs.cartBubble.classList.add('cart-bubble--animating');
  }
};
```

**Update Source:** `CartAddEvent` dispatched from `ProductFormComponent.handleSubmit()` (product-form.js, line 262–269).

---

## 6. Add to Cart Flow — Complete Lifecycle

### Step 1: Form Structure & Data Collection

**File:** [blocks/buy-buttons.liquid](blocks/buy-buttons.liquid:45–100)

```html
<product-form-component
  data-section-id="{{ section.id }}"
  data-product-id="{{ product.id }}"
>
  <form id="BuyButtons-ProductForm-{{ section.id }}" data-type="add-to-cart-form">
    <!-- Variant ID input (hidden) -->
    <input type="hidden" name="id" ref="variantId" 
           value="{{ product.selected_or_first_available_variant.id }}" />
    
    <!-- Quantity input (from quantity block) -->
    {% content_for 'block', type: 'quantity', id: 'quantity' %}
    
    <!-- Add to Cart button -->
    {% content_for 'block', type: 'add-to-cart', ... %}
  </form>
</product-form-component>
```

**Data Collected:**
- **Variant ID:** `<input name="id" />` (hidden input)
- **Quantity:** `<input name="quantity" />` (from quantity-selector component)
- **Sections:** Dynamically appended form data (line 185 in product-form.js)

### Step 2: Form Submission

**Handler:** `ProductFormComponent.handleSubmit()` ([assets/product-form.js](assets/product-form.js:162–179))

```javascript
handleSubmit(event) {
  event.preventDefault();
  
  const form = this.querySelector('form');
  const formData = new FormData(form);
  
  // Collect cart item section IDs for re-rendering
  const cartItemsComponents = document.querySelectorAll('cart-items-component');
  let cartItemComponentsSectionIds = [];
  cartItemsComponents.forEach((item) => {
    if (item.dataset.sectionId) {
      cartItemComponentsSectionIds.push(item.dataset.sectionId);
    }
    formData.append('sections', cartItemComponentsSectionIds.join(','));
  });
  
  fetch(Theme.routes.cart_add_url, {
    method: 'POST',
    headers: { 'Accept': 'text/html' },
    body: formData
  });
}
```

### Step 3: Fetch Request to `/cart/add.js`

**Endpoint:** `Theme.routes.cart_add_url` (typically `/cart/add.js`)

**Request Payload (FormData):**
```
id=<variant_id>
quantity=<quantity>
sections=<section_id_1>,<section_id_2>,...
```

**Response Format (JSON):**
```json
{
  "status": null|<error_code>,
  "message": "string",
  "description": "string",
  "errors": {...},
  "sections": {
    "<section_id>": "<section_html>"
  }
}
```

### Step 4: Success/Error Handling

**File:** [assets/product-form.js](assets/product-form.js:196–270)

#### Error Response (status != null)
```javascript
if (response.status) {
  // Dispatch error event
  this.dispatchEvent(
    new CartErrorEvent(form.id, response.message, response.description, response.errors)
  );
  
  // Show error message
  addToCartTextError.classList.remove('hidden');
  addToCartTextError.textContent = response.message;
  
  // Update cart with partial quantity (if max exceeded)
  this.dispatchEvent(
    new CartAddEvent({}, this.id, {
      didError: true,
      source: 'product-form-component',
      itemCount: Number(formData.get('quantity')),
      productId: this.dataset.productId
    })
  );
  
  return;
}
```

#### Success Response (status == null)
```javascript
else {
  // Announce to screen readers
  const addedText = addToCartButton
    .querySelector('.add-to-cart-text--added')?.textContent 
    || Theme.translations.added;
  this.#setLiveRegionText(addedText);
  
  // Dispatch success event
  this.dispatchEvent(
    new CartAddEvent({}, id.toString(), {
      source: 'product-form-component',
      itemCount: Number(formData.get('quantity')),
      productId: this.dataset.productId,
      sections: response.sections
    })
  );
}
```

### Step 5: Custom Events Dispatched

**File:** [assets/events.js](assets/events.js:8–115)

| Event | Constants | Triggered By | Listeners |
|-------|-----------|--------------|-----------|
| **CartAddEvent** | `ThemeEvents.cartUpdate` | `ProductFormComponent.handleSubmit()` | `CartIcon`, `CartDrawerComponent` |
| **CartErrorEvent** | `ThemeEvents.cartError` | Form submission failure | Error UI handlers |
| **CartUpdateEvent** | `ThemeEvents.cartUpdate` | Cart operations | Section re-renderers |

**CartAddEvent Data Structure:**
```javascript
new CartAddEvent(resource, sourceId, {
  didError: boolean,
  source: 'product-form-component',
  itemCount: number,
  productId: string,
  variantId: string,
  sections: { '<section_id>': '<html>' }
})
```

### Step 6: DOM Updates & Cart Icon Animation

**Handler:** [assets/cart-icon.js](assets/cart-icon.js:44–63)

```javascript
onCartUpdate = async (event) => {
  const itemCount = event.detail.data?.itemCount ?? 0;
  const comingFromProductForm = event.detail.data?.source === 'product-form-component';
  
  this.renderCartBubble(itemCount, comingFromProductForm);
};

renderCartBubble = async (itemCount, comingFromProductForm, animate = true) => {
  // Hide if count is 0
  this.refs.cartBubbleCount.classList.toggle('hidden', itemCount === 0);
  this.refs.cartBubble.classList.toggle('visually-hidden', itemCount === 0);
  
  // Trigger animation
  this.refs.cartBubble.classList.toggle('cart-bubble--animating', itemCount > 0 && animate);
  
  // Update count
  this.currentCartCount = comingFromProductForm 
    ? this.currentCartCount + itemCount 
    : itemCount;
  
  // Persist to session
  sessionStorage.setItem('cart-count', JSON.stringify({
    value: String(this.currentCartCount),
    timestamp: Date.now()
  }));
};
```

### Step 7: Visual Feedback

**Add-to-Cart Button Animation:**

**File:** [assets/product-form.js](assets/product-form.js:57–68)

```javascript
handleClick(event) {
  const form = this.closest('form');
  if (!form?.checkValidity()) return;
  
  this.animateAddToCart();  // Button text change animation
  
  const animationEnabled = this.dataset.addToCartAnimation === 'true';
  if (animationEnabled && !event.target.closest('.quick-add-modal')) {
    this.#animateFlyToCart();  // Fly-to-cart animation
  }
}
```

**Fly-to-Cart Animation:**

**Class:** `FlyToCart` ([assets/product-form.js](assets/product-form.js:349–429))

- Creates temporary DOM element styled as product image
- Animates from Add-to-Cart button to cart icon using Bézier curves
- Duration: 600ms
- Scales down as it approaches cart

**CSS for ATC Button State Change:**
```css
.add-to-cart-button.atc-added {
  /* Shows "Added" text; reverts after 2000ms */
}
```

### Step 8: Cart Drawer Auto-Open (if enabled)

**File:** [assets/cart-drawer.js](assets/cart-drawer.js:10–24)

```javascript
connectedCallback() {
  super.connectedCallback();
  document.addEventListener(CartAddEvent.eventName, this.#handleCartAdd);
}

#handleCartAdd = () => {
  if (this.hasAttribute('auto-open')) {
    this.showDialog();
  }
};
```

**Conditional:** Only if `settings.auto_open_cart_drawer == true` and `<cart-drawer-component auto-open>` attribute present.

---

## 7. Variant Selection & Change Detection

**File:** [assets/variant-picker.js](assets/variant-picker.js:20–106)

### Change Detection

**Event:** `change` event listener on variant picker element

```javascript
connectedCallback() {
  super.connectedCallback();
  this.addEventListener('change', this.variantChanged.bind(this));
}

variantChanged(event) {
  if (!(event.target instanceof HTMLElement)) return;
  
  const selectedOption = 
    event.target instanceof HTMLSelectElement 
      ? event.target.options[event.target.selectedIndex] 
      : event.target;
  
  if (!selectedOption) return;
  
  this.updateSelectedOption(event.target);
  // Dispatch VariantSelectedEvent
  this.dispatchEvent(new VariantSelectedEvent({ id: selectedOption.dataset.optionValueId ?? '' }));
}
```

### Selected Variant ID Storage

**Location:** Hidden input in form
- **Selector:** `<input name="id" ref="variantId" />`
- **Updated by:** `ProductFormComponent.#onVariantUpdate()` ([product-form.js](assets/product-form.js:297–334))

```javascript
#onVariantUpdate = (event) => {
  const { variantId, addToCartButtonContainer } = this.refs;
  
  // Update variant ID input
  variantId.value = event.detail.resource.id ?? '';
  
  // Update product variant media for fly-to-cart animation
  if (event.detail.resource?.featured_media?.preview_image?.src) {
    addToCartButtonContainer?.setAttribute(
      'data-product-variant-media', 
      event.detail.resource.featured_media.preview_image.src + '&width=100'
    );
  }
};
```

### Price/Availability Update on Variant Switch

**Event:** `VariantUpdateEvent` dispatched after variant fetch completes

**Handler:** `ProductFormComponent.#onVariantUpdate()` (product-form.js:297–334)

```javascript
#onVariantUpdate = (event) => {
  // Update button state (enable/disable)
  if (!event.detail.resource?.available) {
    addToCartButtonContainer.disable();
    this.refs.acceleratedCheckoutButtonContainer?.setAttribute('hidden', 'true');
  } else {
    addToCartButtonContainer.enable();
    this.refs.acceleratedCheckoutButtonContainer?.removeAttribute('hidden');
  }
  
  // Morph (update) the button content using DOM diffing
  if (newAddToCartButton) {
    morph(currentAddToCartButton, newAddToCartButton);
  }
  
  // Update variant ID
  variantId.value = event.detail.resource.id ?? '';
};
```

**URL Update:** URL search params updated with variant ID

```javascript
const url = new URL(window.location.href);
const variantId = selectedOption.dataset.variantId || null;

if (isOnProductPage) {
  if (variantId) {
    url.searchParams.set('variant', variantId);
  } else {
    url.searchParams.delete('variant');
  }
}

history.replaceState({}, '', url.toString());
```

### Data Attributes on Variant Picker

**File:** [blocks/variant-picker.liquid](blocks/variant-picker.liquid)

```html
<variant-picker
  data-template-product-match="{{ template.name == 'product' }}"
  data-product-url="{{ product.url }}"
>
  <!-- Option selectors/inputs with data attributes -->
  <input|select
    data-option-value-id="<id>"
    data-variant-id="<id>"
    data-connected-product-url="<url>"  <!-- For combined listings -->
  />
</variant-picker>
```

---

## 8. Liquid + JavaScript Interaction Points

### Data Attributes Passed from Liquid to JS

| Attribute | Host Element | Source | Used By |
|-----------|--------------|--------|---------|
| `data-section-id` | `product-form-component`, `cart-items-component` | `{{ section.id }}` | Form submission, section re-rendering |
| `data-product-id` | `product-form-component` | `{{ product.id }}` | Variant tracking, product context |
| `data-product-url` | `product-form-component`, `variant-picker` | `{{ product.url }}` | URL state updates |
| `data-template-product-match` | `variant-picker` | `{{ template.name }}` | Determines if on product page |
| `data-quantity-default` | `product-form-component` | Variant quantity rule | Default quantity fallback |
| `data-option-value-id` | Option inputs (variant-picker children) | Option/variant object | Variant matching |
| `data-variant-id` | Option inputs | Variant object | Variant ID retrieval |
| `data-product-variant-media` | `add-to-cart-component` | Featured media URL | Fly-to-cart animation image |
| `auto-open` | `cart-drawer-component` | `{% if settings.auto_open_cart_drawer %}` | Auto-open drawer on ATC |
| `data-add-to-cart-animation` | `add-to-cart-component` | `{{ settings.add_to_cart_animation }}` | Fly-to-cart animation toggle |

### Script Tags with Embedded JSON/Data

**File:** [layout/theme.liquid](layout/theme.liquid:55–58)

```html
<main
  id="MainContent"
  class="content-for-layout"
  role="main"
  data-page-transition-enabled="{{ settings.page_transition_enabled }}"
  data-product-transition="{{ settings.transition_to_main_product }}"
  data-template="{{ template }}"
>
```

**File:** [blocks/_product-details.liquid](blocks/_product-details.liquid:6–16)

```html
<div
  id="ProductInformation-{{ section.id }}"
  class="product-details"
  style="--details-position: {{ block_settings.details_position }};"
  data-view-transition-type="product-details"
>
```

### Global Window Variables

**Set by:** Various JavaScript modules (e.g., [assets/critical.js](assets/critical.js))

**Accessed by:** Shopify theme components

**Key Variables:**
- `Theme.routes.cart_add_url` — Shopify API endpoint
- `Theme.translations.added` — "Added to cart" text
- `window.shop` — Shopify shop object (customer accounts enabled, etc.)

### Event Data Flow

```
ProductFormComponent.handleSubmit()
  ↓
  fetch(/cart/add.js) with FormData {id, quantity, sections}
  ↓
  ← Response {status, sections: {<section_id>: <html>}}
  ↓
  dispatchEvent(new CartAddEvent({}, variantId, {
    source: 'product-form-component',
    itemCount,
    sections
  }))
  ↓
  [CartIcon, CartDrawerComponent] listen for event
  ↓
  DOM updates: button state, item count, drawer content
```

---

## 9. Custom Web Components & Element Refs

### Component Registry

| Component | File | Base Class | Key Refs |
|-----------|------|-----------|----------|
| `product-form-component` | product-form.js | Component | `variantId`, `addToCartButtonContainer`, `liveRegion`, `addToCartTextError` |
| `add-to-cart-component` | product-form.js | Component | `addToCartButton` |
| `cart-icon` | cart-icon.js | Component | `cartBubble`, `cartBubbleText`, `cartBubbleCount` |
| `cart-drawer-component` | cart-drawer.js | DialogComponent | `dialog`, `closeButton` |
| `variant-picker` | variant-picker.js | Component | (child inputs with data attributes) |

### Ref System

Refs are declared as `ref="<name>"` in HTML and accessed via `this.refs.<name>` in JavaScript:

```javascript
requiredRefs = ['variantId', 'addToCartButton'];

get currentCartCount() {
  return parseInt(this.refs.cartBubbleCount.textContent ?? '0', 10);
}
```

---

## 10. Performance Optimizations

### Code Splitting & Lazy Loading

**File:** [assets/critical.js](assets/critical.js)

- Loaded inline, blocking render (sets up critical path)
- Other scripts loaded with `defer` or `async`

**Cart drawer script:**
```html
<script src="{{ 'cart-drawer.js' | asset_url }}" 
        type="module" 
        fetchpriority="low">
</script>
```

### DOM Morphing (Efficient Updates)

**File:** [assets/morph.js](assets/morph.js)

Used in variant updates to patch button text/state without full re-render:

```javascript
// From product-form.js:322
morph(currentAddToCartButton, newAddToCartButton);
```

### Session Storage for Cart State

**File:** [assets/cart-icon.js](assets/cart-icon.js:67–73)

```javascript
sessionStorage.setItem('cart-count', JSON.stringify({
  value: String(this.currentCartCount),
  timestamp: Date.now()
}));
```

Allows cross-page cart count persistence without re-fetching.

### Image Preloading

**File:** [assets/product-form.js](assets/product-form.js:70–76)

```javascript
#preloadImage = () => {
  const image = this.dataset.productVariantMedia;
  if (!image) return;
  preloadImage(image);  // Preload on hover
};

connectedCallback() {
  this.addEventListener('pointerenter', this.#preloadImage);
}
```

---

## 11. Key Configuration Points for Customization

### Global Settings to Modify

1. **Cart Behavior:**
   - `settings.cart_type`: Switch between page/drawer
   - `settings.auto_open_cart_drawer`: Auto-open on ATC

2. **Visual Styling:**
   - `settings.add_to_cart_animation`: Enable/disable fly-to-cart
   - `settings.card_hover_effect`: Lift/scale/subtle-zoom
   - Color scheme settings for cart elements

3. **Form Behavior:**
   - `block_settings.stacking`: Stack buttons vertically in buy-buttons block

### Endpoints & Routes

- **Cart add:** `Theme.routes.cart_add_url` (default: `/cart/add.js`)
- **Cart page:** `routes.cart_url` (default: `/cart`)

### CSS Custom Properties (CSS Variables)

**From [snippets/cart-drawer.liquid](snippets/cart-drawer.liquid:30–36):**
```css
--cart-drawer-padding
--cart-drawer-padding-desktop
--cart-font-size--2xs, --2xs, --sm, --md, --2xl
--sidebar-width
--color-background
--color-border
```

---

## 12. Browser APIs & Compatibility

### APIs Used

| API | Purpose | Fallback |
|-----|---------|----------|
| `<dialog>` Element | Modal for cart drawer | None (assumes modern browsers) |
| `FormData` API | Form serialization | None |
| `fetch()` API | AJAX cart operations | None |
| `sessionStorage` | Cart state persistence | Graceful degradation |
| `history.replaceState()` | URL variant tracking | Fallback to hash-based routing |
| `MutationObserver` | DOM change detection | (if used in utilities) |
| Web Components (`customElements`) | Component registration | Requires ES6+ |

---

## 13. Accessibility Features

### ARIA Labels & Regions

**Cart Icon:**
```html
<button aria-label="Cart 3 items">
```

**Live Regions:**
```html
<div ref="liveRegion" aria-live="assertive" role="status">
  <!-- ATC success/error announcements -->
</div>
```

**Cart Count (Semantic):**
```html
<span class="visually-hidden">
  Cart count: 3
</span>
```

### Keyboard Navigation

- **Tab order:** Managed via standard form elements and button refs
- **Dialog focus:** `<dialog>` element handles focus trap
- **Close button:** Accessible via keyboard & screen reader labels

---

## Appendix: File Structure Summary

```
horizon-v2.1.6/
├── config/
│   └── settings_schema.json          ← Global theme settings
├── layout/
│   └── theme.liquid                  ← Master layout template
├── templates/
│   └── gift_card.liquid              ← Gift card template only
├── sections/
│   ├── product-template.liquid       ← Product page wrapper
│   ├── product-information.liquid    ← Product details section
│   ├── header.liquid                 ← Header navigation
│   ├── main-cart.liquid              ← Full-page cart
│   └── [40+ other sections]
├── blocks/
│   ├── buy-buttons.liquid            ← Product form + ATC
│   ├── _cart-products.liquid         ← Cart items display
│   ├── _product-details.liquid       ← Product details container
│   └── [80+ other blocks]
├── snippets/
│   ├── cart-drawer.liquid            ← Cart drawer UI
│   ├── cart-bubble.liquid            ← Cart count badge
│   ├── header-actions.liquid         ← Header action buttons
│   ├── cart-products.liquid          ← Cart line items
│   ├── cart-summary.liquid           ← Cart totals
│   └── [30+ other snippets]
└── assets/
    ├── product-form.js               ← ATC form logic + FlyToCart
    ├── cart-icon.js                  ← Cart count updates
    ├── cart-drawer.js                ← Cart drawer component
    ├── variant-picker.js             ← Variant selection logic
    ├── events.js                     ← Custom event definitions
    ├── morph.js                      ← DOM diffing utility
    └── [50+ other JavaScript files]
```

---

## Summary & Key Takeaways

1. **Section-based architecture:** No traditional template files; dynamic sections + blocks
2. **Web Components:** Custom elements (`cart-drawer-component`, `product-form-component`, etc.) manage state
3. **Event-driven:** `CartAddEvent`, `VariantUpdateEvent` trigger DOM updates across the theme
4. **Cart flexibility:** Toggle between page/drawer via `settings.cart_type`
5. **Modern JS:** Fetch API, custom events, `<dialog>` element, sessionStorage
6. **Performance:** DOM morphing, lazy loading, image preloading, section caching
7. **Accessibility:** ARIA labels, live regions, semantic HTML, keyboard support
8. **Global styling:** CSS custom properties allow per-color-scheme customization

---

**Report End**  
Generated by Horizon v2.1.6 Technical Audit  
File references verified against live codebase as of 2026-05-14
