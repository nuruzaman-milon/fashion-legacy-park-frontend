"use client";

import * as React from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  addToCart as apiAddToCart,
  getCart,
  moveCartItemToWishlist,
  removeCartItem,
  removeUnavailableItems,
  updateCartItem,
  type Cart,
  type CartLine,
} from "@/lib/api/cart";
import {
  getWishlist,
  removeFromWishlist as apiRemoveFromWishlist,
  toggleWishlist as apiToggleWishlist,
  type WishlistItem,
} from "@/lib/api/wishlist";

/**
 * Shared cart + wishlist state for the whole storefront — one source of
 * truth so the header badges, product cards, detail page and the cart/
 * wishlist pages never disagree.
 *
 * Mutations are optimistic: local state changes immediately (that's what
 * the shopper sees), the API call runs behind it, and the server's
 * authoritative cart replaces the guess when it lands. On failure the
 * snapshot is restored and the error rethrown for the caller's UI.
 */

/** Local re-aggregation after an optimistic line change (mirrors backend). */
function recompute(lines: CartLine[]): Cart {
  const available = lines.filter((line) => line.isAvailable);
  return {
    lines,
    itemCount: lines.length,
    totalQuantity: lines.reduce((n, line) => n + line.quantity, 0),
    subtotal: available.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    ),
    unavailableCount: lines.length - available.length,
    hasUnavailableItems: available.length !== lines.length,
  };
}

type LoadState = "idle" | "loading" | "ready" | "error";

interface ShopContextValue {
  cart: Cart | null;
  cartState: LoadState;
  /** Badge count — includes adds still in flight. */
  cartCount: number;
  wishlist: WishlistItem[] | null;
  wishlistState: LoadState;
  wishlistCount: number;
  /** Instant heart state for any product, kept optimistic. */
  isWishlisted: (productId: string) => boolean;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeLine: (itemId: string) => Promise<void>;
  removeUnavailable: () => Promise<void>;
  moveToWishlist: (itemId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  removeWishlistItem: (productId: string) => Promise<void>;
  reloadCart: () => void;
  reloadWishlist: () => void;
}

const ShopContext = React.createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [cart, setCart] = React.useState<Cart | null>(null);
  const [cartState, setCartState] = React.useState<LoadState>("idle");
  const [wishlist, setWishlist] = React.useState<WishlistItem[] | null>(null);
  const [wishlistState, setWishlistState] = React.useState<LoadState>("idle");
  /** Product ids hearted right now — flips before the server confirms. */
  const [wishlistIds, setWishlistIds] = React.useState<ReadonlySet<string>>(
    new Set(),
  );
  /** Quantity of adds still in flight, so the badge moves instantly. */
  const [pendingAddQty, setPendingAddQty] = React.useState(0);

  const loadCart = React.useCallback(() => {
    getCart()
      .then((next) => {
        setCart(next);
        setCartState("ready");
      })
      .catch(() => setCartState("error"));
  }, []);

  const loadWishlist = React.useCallback(() => {
    getWishlist()
      .then((items) => {
        setWishlist(items);
        setWishlistIds(new Set(items.map((i) => i.productId)));
        setWishlistState("ready");
      })
      .catch(() => setWishlistState("error"));
  }, []);

  // Bootstrap on login, clear on logout. State updates happen in promise
  // callbacks, never synchronously in the effect body — "idle" with no data
  // already renders as loading in the views.
  React.useEffect(() => {
    if (status !== "authenticated") return;
    loadCart();
    loadWishlist();
    return () => {
      // Session ended (logout or expiry) — drop the previous user's data.
      setCart(null);
      setCartState("idle");
      setWishlist(null);
      setWishlistIds(new Set());
      setWishlistState("idle");
      setPendingAddQty(0);
    };
  }, [status, loadCart, loadWishlist]);

  /** Optimistic line edit: apply locally now, reconcile or roll back later. */
  const optimisticCart = React.useCallback(
    async (
      applyLocally: (lines: CartLine[]) => CartLine[],
      request: () => Promise<Cart>,
    ) => {
      const snapshot = cart;
      if (snapshot) setCart(recompute(applyLocally(snapshot.lines)));
      try {
        setCart(await request());
      } catch (error) {
        setCart(snapshot);
        throw error;
      }
    },
    [cart],
  );

  const addToCart = React.useCallback(
    async (variantId: string, quantity: number) => {
      setPendingAddQty((n) => n + quantity);
      try {
        setCart(await apiAddToCart(variantId, quantity));
      } finally {
        setPendingAddQty((n) => n - quantity);
      }
    },
    [],
  );

  const updateQuantity = React.useCallback(
    (itemId: string, quantity: number) =>
      optimisticCart(
        (lines) =>
          lines.map((line) =>
            line.id === itemId
              ? { ...line, quantity, lineTotal: line.unitPrice * quantity }
              : line,
          ),
        () => updateCartItem(itemId, quantity),
      ),
    [optimisticCart],
  );

  const removeLine = React.useCallback(
    (itemId: string) =>
      optimisticCart(
        (lines) => lines.filter((line) => line.id !== itemId),
        () => removeCartItem(itemId),
      ),
    [optimisticCart],
  );

  const removeUnavailable = React.useCallback(
    () =>
      optimisticCart(
        (lines) => lines.filter((line) => line.isAvailable),
        () => removeUnavailableItems(),
      ),
    [optimisticCart],
  );

  const moveToWishlist = React.useCallback(
    async (itemId: string) => {
      const productId = cart?.lines.find((l) => l.id === itemId)?.productId;
      if (productId) {
        setWishlistIds((ids) => new Set(ids).add(productId));
      }
      try {
        await optimisticCart(
          (lines) => lines.filter((line) => line.id !== itemId),
          () => moveCartItemToWishlist(itemId),
        );
        loadWishlist(); // fetch the full entry the wishlist page renders
      } catch (error) {
        if (productId) {
          setWishlistIds((ids) => {
            const next = new Set(ids);
            next.delete(productId);
            return next;
          });
        }
        throw error;
      }
    },
    [cart, optimisticCart, loadWishlist],
  );

  const toggleWishlist = React.useCallback(
    async (productId: string) => {
      const wasOn = wishlistIds.has(productId);
      setWishlistIds((ids) => {
        const next = new Set(ids);
        if (wasOn) next.delete(productId);
        else next.add(productId);
        return next;
      });
      if (wasOn) {
        setWishlist((items) =>
          items ? items.filter((i) => i.productId !== productId) : items,
        );
      }
      try {
        const wishlisted = await apiToggleWishlist(productId);
        if (wishlisted) loadWishlist(); // full entry for the wishlist page
        return wishlisted;
      } catch (error) {
        setWishlistIds((ids) => {
          const next = new Set(ids);
          if (wasOn) next.add(productId);
          else next.delete(productId);
          return next;
        });
        if (wasOn) loadWishlist();
        throw error;
      }
    },
    [wishlistIds, loadWishlist],
  );

  const removeWishlistItem = React.useCallback(
    async (productId: string) => {
      const snapshotItems = wishlist;
      const snapshotIds = wishlistIds;
      setWishlist((items) =>
        items ? items.filter((i) => i.productId !== productId) : items,
      );
      setWishlistIds((ids) => {
        const next = new Set(ids);
        next.delete(productId);
        return next;
      });
      try {
        await apiRemoveFromWishlist(productId);
      } catch (error) {
        setWishlist(snapshotItems);
        setWishlistIds(snapshotIds);
        throw error;
      }
    },
    [wishlist, wishlistIds],
  );

  const reloadCart = React.useCallback(() => {
    setCartState("loading");
    loadCart();
  }, [loadCart]);

  const reloadWishlist = React.useCallback(() => {
    setWishlistState("loading");
    loadWishlist();
  }, [loadWishlist]);

  const isWishlisted = React.useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds],
  );

  const value = React.useMemo<ShopContextValue>(
    () => ({
      cart,
      cartState,
      cartCount: (cart?.totalQuantity ?? 0) + pendingAddQty,
      wishlist,
      wishlistState,
      wishlistCount: wishlistIds.size,
      isWishlisted,
      addToCart,
      updateQuantity,
      removeLine,
      removeUnavailable,
      moveToWishlist,
      toggleWishlist,
      removeWishlistItem,
      reloadCart,
      reloadWishlist,
    }),
    [
      cart,
      cartState,
      pendingAddQty,
      wishlist,
      wishlistState,
      wishlistIds,
      isWishlisted,
      addToCart,
      updateQuantity,
      removeLine,
      removeUnavailable,
      moveToWishlist,
      toggleWishlist,
      removeWishlistItem,
      reloadCart,
      reloadWishlist,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const ctx = React.useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside <ShopProvider>");
  return ctx;
}
