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
import { AlertCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type RevPoint = { t: number; total: number };
type Product = {
  id: string;
  name: string;
  brand?: string;
  categoryId?: string;
  price: number;
  sold?: number;
  ratingAvg?: number;
};

export default function AdminAnalyticsPage() {
  const [bucket, setBucket] = useState<"day" | "week" | "month">("day");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [series, setSeries] = useState<RevPoint[]>([]);
  const [top, setTop] = useState<Product[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function toMs(d: string) {
    if (!d) return undefined;
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : undefined;
  }

  async function loadRevenue() {
    setMsg("");
    setLoading(true);
    try {
      const url = new URL(`${API}/admin/analytics/revenue`);
      url.searchParams.set("bucket", bucket);
      const f = toMs(from);
      const t = toMs(to);
      if (f) url.searchParams.set("from", String(f));
      if (t) url.searchParams.set("to", String(t));
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Load revenue failed");
      setSeries(data.series || []);
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function loadTop() {
    try {
      const url = new URL(`${API}/admin/analytics/top-products`);
      url.searchParams.set("limit", "10");
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Load top products failed");
      setTop(data.products || []);
    } catch (e: any) {
      setMsg(e?.message || "Error");
    }
  }

  useEffect(() => {
    loadRevenue();
    loadTop();
  }, []);

  const totalRevenue = series.reduce((sum, item) => sum + item.total, 0);

  const chartData = series.map((p) => ({
    date: new Date(p.t).toLocaleDateString("vi-VN"),
    revenue: p.total,
  }));

  const topProductsChartData = top.slice(0, 5).map((p) => ({
    name: p.name.substring(0, 15),
    sold: p.sold ?? 0,
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phân tích</h1>
          <p className="text-muted-foreground mt-2">
            Xem doanh thu và sản phẩm bán chạy
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
                <label className="text-sm font-medium">Khoảng thời gian</label>
                <Select
                  value={bucket}
                  onValueChange={(v) => setBucket(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Ngày</SelectItem>
                    <SelectItem value="week">Tuần</SelectItem>
                    <SelectItem value="month">Tháng</SelectItem>
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

              <div className="flex items-end gap-2">
                <Button onClick={() => loadRevenue()} className="flex-1">
                  Tải doanh thu
                </Button>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => loadTop()}
                  variant="outline"
                  className="w-full"
                >
                  Tải Top
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

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng doanh thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalRevenue.toLocaleString("vi-VN")}₫
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {series.length} kỳ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Doanh thu trung bình
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {series.length > 0
                  ? (totalRevenue / series.length).toLocaleString("vi-VN")
                  : 0}
                ₫
              </div>
              <p className="text-xs text-muted-foreground mt-1">Mỗi {bucket}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sản phẩm bán chạy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {top.length > 0 ? top[0].sold ?? 0 : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bán được</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo {bucket}</CardTitle>
            <CardDescription>Biểu đồ doanh thu chi tiết</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : series.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `${value.toLocaleString("vi-VN")}₫`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    name="Doanh thu"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue Table */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết doanh thu</CardTitle>
            <CardDescription>
              Doanh thu chi tiết cho từng {bucket}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {series.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    series.map((p) => (
                      <TableRow key={p.t}>
                        <TableCell className="text-sm">
                          {new Date(p.t).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {p.total.toLocaleString("vi-VN")}₫
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sản phẩm bán chạy
            </CardTitle>
            <CardDescription>
              Top 5 sản phẩm có doanh số cao nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            {top.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProductsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sold" fill="#10b981" name="Đã bán" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết sản phẩm bán chạy</CardTitle>
            <CardDescription>
              Top 10 sản phẩm có doanh số cao nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead>Thương hiệu</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead className="text-right">Đã bán</TableHead>
                    <TableHead className="text-right">Đánh giá</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    top.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-sm">
                          {p.id}
                        </TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-sm">
                          {p.brand || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {p.categoryId || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.price?.toLocaleString("vi-VN")}₫
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {p.sold ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.ratingAvg ? p.ratingAvg.toFixed(1) : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
