"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/base";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Order = {
  id: string;
  uid: string;
  items: { pid: string; qty: number }[];
  total: number;
  status: "PLACED" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELED";
  createdAt: number;
  updatedAt?: number;
};

const ALL = [
  "PLACED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELED",
] as const;

const statusColors: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PROCESSING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  SHIPPED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string>("ALL");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function toMs(d: string) {
    if (!d) return undefined;
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : undefined;
  }

  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const url = new URL(`${API}/admin/orders`);
      url.searchParams.set("p", String(page));
      url.searchParams.set("limit", String(limit));
      if (status !== "ALL") url.searchParams.set("status", status);
      const f = toMs(from);
      const t = toMs(to);
      if (f) url.searchParams.set("from", String(f));
      if (t) url.searchParams.set("to", String(t));
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Load orders failed");
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Đơn hàng</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý và theo dõi tất cả đơn hàng
          </p>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bộ lọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Trạng thái</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    {ALL.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Từ ngày</label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Đến ngày</label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setPage(1);
                    load();
                  }}
                  className="w-full"
                >
                  Lọc
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {msg && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{msg}</AlertDescription>
          </Alert>
        )}

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách đơn hàng</CardTitle>
            <CardDescription>Tổng cộng: {total} đơn hàng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Cập nhật</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Không có đơn hàng
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-sm">
                          {o.id}
                        </TableCell>
                        <TableCell className="text-sm">{o.uid}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {o.total?.toLocaleString("vi-VN")}₫
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[o.status]}>
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {o.items.length} sản phẩm
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={o.status}
                            onValueChange={async (s) => {
                              const res = await fetch(
                                `${API}/admin/orders/${encodeURIComponent(
                                  o.id
                                )}/status`,
                                {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ status: s }),
                                }
                              );
                              const data = await res.json();
                              if (!data.ok) {
                                alert(data.message || "Update status failed");
                                return;
                              }
                              load();
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ALL.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {page} • Tổng: {total} đơn hàng
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= total}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
