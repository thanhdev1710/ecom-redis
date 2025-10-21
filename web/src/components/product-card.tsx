"use client";

import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";
import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card className="group overflow-hidden border-border hover:shadow-lg transition-shadow duration-300 pt-0">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted cursor-pointer border-b-2">
          <Image
            width={300}
            height={400}
            src={product.image}
            alt={product.name}
            className="object-cover w-full h-full"
          />
          {product.stock < 20 && product.stock > 0 && (
            <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground">
              Sắp hết
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge className="absolute top-3 right-3 bg-muted text-muted-foreground">
              Hết hàng
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/product/${product.id}`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-base leading-tight line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </div>
        </Link>

        <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">
              {product.ratingAvg.toFixed(1)}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            Đã bán {product.sold}
          </span>
        </div>

        <p className="text-xl font-semibold text-primary">
          {product.price.toLocaleString("vi-VN")}₫
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => onAddToCart(product.id)}
          disabled={product.stock === 0}
          className="w-full"
          size="sm"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {product.stock === 0 ? "Hết hàng" : "Thêm vào giỏ"}
        </Button>
      </CardFooter>
    </Card>
  );
}
