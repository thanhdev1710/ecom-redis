"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Trash2,
  Plus,
  X,
  Package,
  TrendingUp,
  Star,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { API } from "@/lib/base";
import { Categories, Product } from "@/types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [form, setForm] = useState<Partial<Product>>({
    id: "",
    name: "",
    brand: "",
    categoryId: "",
    price: 0,
    stock: 0,
    sold: 0,
    ratingAvg: 0,
    image: "",
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Categories[]>([]);

  // Lấy categories
  useEffect(() => {
    fetch(`${API}/categories`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
      })
      .catch((e) => console.error(e));
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API}/products`);
      url.searchParams.set("p", page.toString());

      const res = await fetch(url.toString());
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
      setTotalSold(data.totalSold || 0);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ép số chắc chắn
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        sold: Number(form.sold) || 0,
        ratingAvg: Number(form.ratingAvg) || 0,
      };

      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API}/products/${form.id}` : `${API}/products`;

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setForm({
        id: "",
        name: "",
        brand: "",
        categoryId: "",
        price: 0,
        stock: 0,
        sold: 0,
        ratingAvg: 0,
        image: "",
      });
      setEditing(null);
      await loadProducts();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá sản phẩm này?")) return;
    setLoading(true);
    try {
      await fetch(`${API}/products/${id}`, { method: "DELETE" });
      await loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name,
      brand: p.brand,
      categoryId: p.categoryId,
      price: p.price,
      stock: p.stock ?? 0,
      sold: p.sold ?? 0,
      ratingAvg: p.ratingAvg ?? 0,
      image: p.image ?? "",
    });
    setEditing(p.id || null);
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({
      id: "",
      name: "",
      brand: "",
      categoryId: "",
      price: 0,
      stock: 0,
      sold: 0,
      ratingAvg: 0,
      image: "",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">
            Quản lý sản phẩm
          </h1>
          <p className="text-muted-foreground">
            Thêm, chỉnh sửa và quản lý sản phẩm trong cửa hàng
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng sản phẩm
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đã bán
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalSold}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đánh giá TB
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {products.length > 0
                  ? (
                      products.reduce((s, p) => s + (p.ratingAvg || 0), 0) /
                      products.length
                    ).toFixed(1)
                  : "0.0"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>
                {editing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </CardTitle>
              <CardDescription>
                {editing
                  ? "Cập nhật thông tin sản phẩm"
                  : "Điền thông tin để thêm sản phẩm mới"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên sản phẩm</Label>
                  <Input
                    id="name"
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Thương hiệu</Label>
                  <Input
                    id="brand"
                    value={form.brand || ""}
                    onChange={(e) =>
                      setForm({ ...form, brand: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Danh mục</Label>
                  <Select
                    value={form.categoryId || ""}
                    onValueChange={(v) => setForm({ ...form, categoryId: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectGroup>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Giá (VNĐ)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={form.price ?? 0}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Tồn kho</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={form.stock ?? 0}
                    onChange={(e) =>
                      setForm({ ...form, stock: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Ảnh (URL)</Label>
                  <Input
                    id="image"
                    value={form.image || ""}
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {editing ? (
                      <>
                        <Pencil className="mr-2 h-4 w-4" /> Cập nhật
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" /> Thêm mới
                      </>
                    )}
                  </Button>
                  {editing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Danh sách */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách sản phẩm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="mx-auto mb-2 h-8 w-8" />
                    Chưa có sản phẩm nào
                  </div>
                ) : (
                  products.map((p) => (
                    <Card
                      key={p.id}
                      className={`transition-all hover:shadow-md ${
                        editing === p.id ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex max-lg:flex-col items-start gap-3 mb-2">
                              {p.image ? (
                                <Image
                                  alt=""
                                  src={p.image}
                                  width={120}
                                  height={120}
                                  className="h-24 w-24 rounded-md object-cover border"
                                />
                              ) : (
                                <div className="h-24 w-24 rounded-md bg-muted border" />
                              )}
                              <div className="flex-1">
                                <div className="flex flex-col gap-4">
                                  <h3 className="font-semibold text-foreground text-lg mb-1 truncate">
                                    {p.name}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <Badge
                                      variant="secondary"
                                      className="font-normal"
                                    >
                                      {p.brand || "—"}
                                    </Badge>
                                    <span>•</span>
                                    <span>
                                      {
                                        categories.find(
                                          (c) => c.id === p.categoryId
                                        )?.name
                                      }
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">
                                        Giá:{" "}
                                      </span>
                                      <span className="font-semibold text-foreground">
                                        {formatPrice(p.price)}
                                      </span>
                                    </div>
                                    {p.stock !== undefined && (
                                      <div>
                                        <span className="text-muted-foreground">
                                          Kho:{" "}
                                        </span>
                                        <span className="font-medium">
                                          {p.stock}
                                        </span>
                                      </div>
                                    )}
                                    {p.sold !== undefined && (
                                      <div>
                                        <span className="text-muted-foreground">
                                          Đã bán:{" "}
                                        </span>
                                        <span className="font-medium">
                                          {p.sold}
                                        </span>
                                      </div>
                                    )}
                                    {p.ratingAvg !== undefined && (
                                      <div className="flex items-center gap-1">
                                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                        <span className="font-medium">
                                          {Number(p.ratingAvg).toFixed(1)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(p)}
                              disabled={loading}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(p.id!)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(page - 1)}
                      className={
                        page === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => handlePageChange(i + 1)}
                        isActive={page === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(page + 1)}
                      className={
                        page === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
