"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/header";
import { ProductGrid } from "@/components/product-grid";
import { CartSheet } from "@/components/cart-sheet";
import { Hero } from "@/components/hero";
import { FilterBar } from "@/components/filter-bar";
import type { Product, CartItem } from "@/types";
import { API } from "@/lib/base";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";

function getUID() {
  if (typeof window === "undefined") return "guest";
  const raw = localStorage.getItem("email") || "guest";
  return raw.trim().toLowerCase();
}

export default function Page() {
  const [uid, setUid] = useState<string>(getUID());
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("price"); // price | ratingAvg
  const [sortOrder, setSortOrder] = useState<string>("ASC"); // ASC | DESC
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({
    min: "-inf",
    max: "+inf",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Cập nhật uid nếu user login/logout
  useEffect(() => {
    const handle = () => setUid(getUID());
    window.addEventListener("storage", handle);
    return () => window.removeEventListener("storage", handle);
  }, []);

  useEffect(() => {
    loadProducts();
    loadCart();
  }, [uid]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, sortBy, sortOrder, priceRange, page]);

  // Reset về page 1 khi đổi filter/search
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, sortBy, sortOrder, priceRange]);

  async function loadProducts() {
    setIsLoading(true);
    try {
      const url = new URL(`${API}/products`);
      if (searchQuery) url.searchParams.set("kw", searchQuery);
      if (selectedCategory !== "all")
        url.searchParams.set("cat", selectedCategory);
      url.searchParams.set("min", priceRange.min);
      url.searchParams.set("max", priceRange.max);
      url.searchParams.set("sort", sortBy);
      url.searchParams.set("order", sortOrder);
      url.searchParams.set("p", page.toString());

      const res = await fetch(url.toString());
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCart() {
    try {
      const res = await fetch(`${API}/cart/${uid}`);
      const data = await res.json();
      setCart(data.items || []);
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  }

  async function addToCart(productId: string) {
    try {
      await fetch(`${API}/cart/${uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid: productId, qty: 1 }), // increment +1
      });
      await loadCart();
      setIsCartOpen(true);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  }

  // qty ở đây là "mong muốn" (absolute). BE nhận increment ⇒ tính delta.
  async function updateCartQuantity(productId: string, desiredQty: number) {
    try {
      await fetch(`${API}/cart/${uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid: productId, qty: desiredQty, step: true }),
      });
      await loadCart();
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  }

  async function removeFromCart(productId: string) {
    try {
      await fetch(`${API}/cart/${uid}/item`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid: productId }),
      });
      await loadCart();
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  }

  async function handleCheckout() {
    try {
      const res = await fetch(`${API}/orders/${uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }), // BE không cần body, nhưng giữ cũng ok
      });
      const data = await res.json();
      if (data?.ok) {
        setCart([]);
        setIsCartOpen(false);
        await loadCart();
      }
    } catch (error) {
      console.error("Error during checkout:", error);
    }
  }

  function handleSearch(query: string) {
    setSearchQuery(query);
  }

  function handleFilterChange(filters: {
    category?: string;
    sort?: string;
    order?: string;
    priceRange?: { min: string; max: string };
  }) {
    if (filters.category !== undefined) setSelectedCategory(filters.category);
    if (filters.sort !== undefined) setSortBy(filters.sort);
    if (filters.order !== undefined) setSortOrder(filters.order);
    if (filters.priceRange !== undefined) setPriceRange(filters.priceRange);
  }

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );

  return (
    <div className="min-h-screen">
      <Header
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
        onSearch={handleSearch}
        searchQuery={searchQuery}
      />

      <Hero />

      <main className="container mx-auto px-4 py-12">
        <FilterBar
          selectedCategory={selectedCategory}
          sortBy={sortBy}
          sortOrder={sortOrder}
          priceRange={priceRange}
          onFilterChange={handleFilterChange}
        />

        <ProductGrid
          products={products}
          onAddToCart={addToCart}
          isLoading={isLoading}
        />

        {totalPages > 1 && (
          <Pagination className="self-center mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => setPage(i + 1)}
                    isActive={page === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={
                    page === totalPages ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </main>

      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
