"use client";

import { useEffect, useState } from "react";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Product, CartItem } from "@/types";
import { API } from "@/lib/base";

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}

export function CartSheet({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: CartSheetProps) {
  const [cartWithDetails, setCartWithDetails] = useState<
    (CartItem & { product?: Product })[]
  >([]);

  useEffect(() => {
    async function fetchProducts() {
      const items = await Promise.all(
        cart.map(async (item) => {
          const res = await fetch(`${API}/products/${item.pid}`);
          const product = await res.json();
          return { ...item, product };
        })
      );
      setCartWithDetails(items);
    }

    if (cart.length > 0) fetchProducts();
    else setCartWithDetails([]);
  }, [cart]);

  const total = cartWithDetails.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.qty,
    0
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Giỏ hàng ({cart.length})
          </SheetTitle>
        </SheetHeader>
        <div className="h-full flex flex-col p-4">
          {cartWithDetails.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Giỏ hàng trống</p>
              <p className="text-sm text-muted-foreground mb-6">
                Thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
              </p>
              <Button onClick={onClose}>Tiếp tục mua sắm</Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-6 space-y-4">
                {cartWithDetails.map((item) => (
                  <div
                    key={item.pid}
                    className="flex gap-4 p-4 rounded-lg border border-border"
                  >
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.product?.image || "/placeholder.jpg"}
                        alt={item.product?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm leading-tight line-clamp-2">
                          {item.product?.name}
                        </h4>
                        <button
                          onClick={() => onRemove(item.pid)}
                          className="text-muted-foreground hover:text-foreground flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {item.product?.brand}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 border border-border rounded-md">
                          <button
                            onClick={() => onUpdateQuantity(item.pid, -1)}
                            className="p-1.5 hover:bg-accent transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.pid, 1)}
                            className="p-1.5 hover:bg-accent transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <p className="font-semibold">
                          {(
                            (item.product?.price || 0) * item.qty
                          ).toLocaleString("vi-VN")}
                          ₫
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Tổng cộng</span>
                  <span className="text-primary">
                    {total.toLocaleString("vi-VN")}₫
                  </span>
                </div>

                <Button onClick={onCheckout} className="w-full" size="lg">
                  Đặt hàng
                </Button>

                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full bg-transparent"
                >
                  Tiếp tục mua sắm
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
