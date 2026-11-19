/**
 * Global one-shot flags shared between the CheckoutPage and the CartPage.
 *
 * The backend `resetAutoApplyVoucher` mutation must run BEFORE cart data is
 * fetched whenever the user enters the cart page or the checkout page while
 * signed in.
 *
 * The flags live in sessionStorage instead of module-level state: the
 * checkout page is entered through a full page load
 * (`window.location.href = '/checkout'`, see the talons that navigate there),
 * which wipes all JS module state. sessionStorage survives reloads within
 * the same tab and dies with the tab, which keeps the one-shot
 * "same browser session" semantics of the previous module-level
 * implementation. When storage is unavailable the flags read as unset, so
 * consumers fall back to running the reset - the safe default.
 *
 * `fromCheckout` — set by the CheckoutPage on unmount (when the destination is
 *   the cart page) or on pagehide (full-page exits); consumed by the CartPage.
 *   The reset must NOT run on the first cart-context entry directly after the
 *   checkout page (one-shot).
 *
 * `fromCart` — set by the CartPage on unmount (when the destination is the
 *   checkout page) and by the PriceSummary checkout button (shared by the
 *   MiniCart drawer and the CartPage); consumed by the CheckoutPage. The
 *   checkout reset is skipped for that entry because the cart context has
 *   already been reset (one-shot).
 */

const STORAGE_KEY_PREFIX = 'cartAutoApplyVoucher:';

const readFlag = key => {
    try {
        return window.sessionStorage.getItem(STORAGE_KEY_PREFIX + key) === '1';
    } catch (error) {
        // Storage unavailable (privacy mode, etc.) - treat as unset.
        return false;
    }
};

const writeFlag = (key, value) => {
    try {
        if (value) {
            window.sessionStorage.setItem(STORAGE_KEY_PREFIX + key, '1');
        } else {
            window.sessionStorage.removeItem(STORAGE_KEY_PREFIX + key);
        }
    } catch (error) {
        // Storage unavailable - nothing to persist; consumers fall back to
        // running the reset, which is the safe default.
    }
};

/**
 * Called by the CheckoutPage when it unmounts with the cart page as the
 * destination, or when the page is hidden (full-page exits such as the
 * browser back button): remember that the next cart-context entry is a
 * "return from checkout".
 */
export const markFromCheckout = () => {
    writeFlag('fromCheckout', true);
};

/**
 * Read the flag WITHOUT consuming it. Used during the first render so the
 * CartPage can decide whether to block its content (and therefore all cart
 * data queries) until the reset finishes.
 *
 * @returns {boolean}
 */
export const peekFromCheckoutFlag = () => readFlag('fromCheckout');

/**
 * Read and consume the flag (one-shot). Called by the CartPage on focus.
 *
 * @returns {boolean}
 */
export const consumeFromCheckoutFlag = () => {
    const value = readFlag('fromCheckout');
    writeFlag('fromCheckout', false);
    return value;
};

/**
 * Called by the CartPage when it unmounts with the checkout page as the
 * destination: remember that the next entry to the CheckoutPage comes
 * directly from the cart.
 */
export const markFromCart = () => {
    writeFlag('fromCart', true);
};

/**
 * Read the flag WITHOUT consuming it. Used during the first render so the
 * CheckoutPage can decide whether to block its content (and therefore all
 * cart data queries) until the reset finishes.
 *
 * @returns {boolean}
 */
export const peekFromCartFlag = () => readFlag('fromCart');

/**
 * Read and consume the flag (one-shot). Called by the CheckoutPage on mount.
 *
 * @returns {boolean}
 */
export const consumeFromCartFlag = () => {
    const value = readFlag('fromCart');
    writeFlag('fromCart', false);
    return value;
};
