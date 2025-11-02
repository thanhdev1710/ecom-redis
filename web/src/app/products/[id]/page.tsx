"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, ArrowLeft, Minus, Plus } from "lucide-react";
import type { Product, CartItem } from "@/types";
import { CartSheet } from "@/components/cart-sheet";
import { API } from "@/lib/base";
import toast from "react-hot-toast";

const normalizeEmail = (s: string | null) =>
  (s || "").trim().toLowerCase() || "guest";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [uid, setUid] = useState<string>(
    typeof window !== "undefined"
      ? normalizeEmail(localStorage.getItem("email"))
      : "guest"
  );
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // cập nhật uid nếu user đăng nhập/đăng xuất ở tab khác
  useEffect(() => {
    const onStorage = () =>
      setUid(normalizeEmail(localStorage.getItem("email")));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  useEffect(() => {
    loadCart();
  }, [uid]);

  async function loadProduct() {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/products/${productId}`);
      const data = await res.json();
      setProduct(data);
    } catch (error) {
      console.error("Error loading product:", error);
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

  async function addToCart() {
    try {
      await fetch(`${API}/cart/${uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // BE dùng HINCRBY → đây là increment theo số lượng đang chọn
        body: JSON.stringify({ pid: productId, qty: quantity }),
      });
      await loadCart();
      toast.success("Thêm giỏ hàng thành công");
      setIsCartOpen(true);
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi thêm giỏ hàng");
      console.error("Error adding to cart:", error);
    }
  }

  // FE truyền "mong muốn" => tính delta gửi lên BE (BE nhận increment)
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

  async function removeFromCart(pid: string) {
    try {
      await fetch(`${API}/cart/${uid}/item`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid }),
      });
      await loadCart();
      toast.success("Xóa giỏ hàng thành công");
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi xóa giỏ hàng");
      console.error("Error removing from cart:", error);
    }
  }

  async function handleCheckout() {
    try {
      const res = await fetch(`${API}/orders/${uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();

      if (data?.ok) {
        setCart([]);
        setIsCartOpen(false);
        await loadCart();
        toast.success("Đặt hàng thành công");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi đặt hàng");
      console.error("Error during checkout:", error);
    }
  }

  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header
          cartItemCount={cartItemCount}
          onCartClick={() => setIsCartOpen(true)}
          onSearch={() => {}}
          searchQuery=""
        />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header
          cartItemCount={cartItemCount}
          onCartClick={() => setIsCartOpen(true)}
          onSearch={() => {}}
          searchQuery=""
        />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-lg text-muted-foreground">
            Không tìm thấy sản phẩm
          </p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Quay lại trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
        onSearch={() => {}}
        searchQuery=""
      />

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="object-cover w-full h-full"
            />
            {product.stock < 20 && product.stock > 0 && (
              <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground">
                Sắp hết
              </Badge>
            )}
            {product.stock === 0 && (
              <Badge className="absolute top-4 right-4 bg-muted text-muted-foreground">
                Hết hàng
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-2">
              <Badge variant="secondary">{product.brand}</Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-medium">
                  {product.ratingAvg.toFixed(1)}
                </span>
              </div>
              <span className="text-muted-foreground">
                Đã bán {product.sold}
              </span>
              <span className="text-muted-foreground">
                Còn {product.stock} sản phẩm
              </span>
            </div>

            <div className="mb-8">
              <p className="text-4xl font-bold text-primary">
                {product.price.toLocaleString("vi-VN")}₫
              </p>
            </div>

            <div className="border-t border-b border-border py-6 mb-6">
              <h3 className="font-medium mb-3">Mô tả sản phẩm</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sản phẩm chất lượng cao từ thương hiệu {product.brand}. Thiết kế
                hiện đại, phù hợp với nhiều phong cách. Chất liệu cao cấp, thoải
                mái khi mặc.
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Số lượng</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium w-12 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={addToCart}
              disabled={product.stock === 0}
              size="lg"
              className="w-full md:w-auto"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {product.stock === 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
            </Button>
          </div>
        </div>
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
