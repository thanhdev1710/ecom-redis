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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Edit2,
  Lock,
  Unlock,
  Shield,
  User,
  Grid,
  List,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type UserType = {
  email?: string;
  fullName?: string;
  phone?: string;
  location?: string;
  role?: "user" | "admin";
  isLocked?: "0" | "1";
  createdAt?: string;
};

export default function AdminUsersPage() {
  const [list, setList] = useState<UserType[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Partial<UserType> | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const url = new URL(`${API}/admin/users`);
      url.searchParams.set("p", String(page));
      url.searchParams.set("limit", String(limit));
      if (q.trim()) url.searchParams.set("q", q.trim());
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Load users failed");
      setList(data.users || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, limit]);

  const handleSave = async () => {
    if (!edit?.email) return;
    try {
      const res = await fetch(
        `${API}/admin/users/${encodeURIComponent(edit.email)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: edit.fullName || "",
            phone: edit.phone || "",
            location: edit.location || "",
          }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        alert(data.message || "Update failed");
        return;
      }
      setEdit(null);
      load();
    } catch (e: any) {
      alert(e?.message || "Error");
    }
  };

  const handleToggleRole = async () => {
    if (!edit?.email) return;
    const currentRole = (edit.role || "user") as "user" | "admin";
    const nextRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await fetch(
        `${API}/admin/users/${encodeURIComponent(edit.email)}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: nextRole }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        alert(data.message || "Change role failed");
        return;
      }
      setEdit({ ...edit, role: nextRole });
      load();
    } catch (e: any) {
      alert(e?.message || "Error");
    }
  };

  const handleToggleLock = async () => {
    if (!edit?.email) return;
    const isLocked = edit.isLocked === "1";
    try {
      const res = await fetch(
        `${API}/admin/users/${encodeURIComponent(edit.email)}/lock`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isLocked: !isLocked }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        alert(data.message || "Toggle lock failed");
        return;
      }
      setEdit({ ...edit, isLocked: !isLocked ? "1" : "0" });
      load();
    } catch (e: any) {
      alert(e?.message || "Error");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Người dùng</h1>
            <p className="text-muted-foreground mt-2">
              Quản lý tài khoản và quyền hạn người dùng
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              Bảng
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="gap-2"
            >
              <Grid className="h-4 w-4" />
              Lưới
            </Button>
          </div>
        </div>

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tìm kiếm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-col sm:flex-row">
              <Input
                placeholder="Tìm theo tên/điện thoại/email"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  setPage(1);
                  load();
                }}
              >
                Tìm
              </Button>
            </div>

            <div className="flex gap-4 mt-4 items-center flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Hiển thị:</label>
                <Input
                  type="number"
                  value={limit}
                  onChange={(e) =>
                    setLimit(Math.max(1, Number(e.target.value) || 20))
                  }
                  className="w-20"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Tổng: <span className="font-semibold">{total}</span> người dùng
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

        {viewMode === "table" ? (
          <>
            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>Danh sách người dùng</CardTitle>
                <CardDescription>
                  Trang {page} • {list.length} người dùng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Họ tên</TableHead>
                        <TableHead>Điện thoại</TableHead>
                        <TableHead>Vai trò</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Đang tải...
                          </TableCell>
                        </TableRow>
                      ) : list.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Không có người dùng
                          </TableCell>
                        </TableRow>
                      ) : (
                        list.map((u) => (
                          <TableRow key={u.email}>
                            <TableCell className="font-mono text-sm">
                              {u.email}
                            </TableCell>
                            <TableCell className="font-medium">
                              {u.fullName || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {u.phone || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  u.role === "admin" ? "default" : "secondary"
                                }
                                className="flex w-fit gap-1"
                              >
                                {u.role === "admin" ? (
                                  <Shield className="h-3 w-3" />
                                ) : (
                                  <User className="h-3 w-3" />
                                )}
                                {u.role === "admin" ? "Admin" : "User"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  u.isLocked === "1" ? "destructive" : "outline"
                                }
                              >
                                {u.isLocked === "1" ? "Khóa" : "Hoạt động"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {u.createdAt
                                ? new Date(
                                    Number(u.createdAt)
                                  ).toLocaleDateString("vi-VN")
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEdit(u)}
                                className="gap-2"
                              >
                                <Edit2 className="h-4 w-4" />
                                Sửa
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full text-center py-8">
                  Đang tải...
                </div>
              ) : list.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Không có người dùng
                </div>
              ) : (
                list.map((u) => (
                  <Card key={u.email} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {u.fullName || "Không có tên"}
                          </CardTitle>
                          <CardDescription className="text-xs truncate">
                            {u.email}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={u.role === "admin" ? "default" : "secondary"}
                          className="flex-shrink-0"
                        >
                          {u.role === "admin" ? "Admin" : "User"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Điện thoại
                        </p>
                        <p className="text-sm font-medium">{u.phone || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Trạng thái
                        </p>
                        <Badge
                          variant={
                            u.isLocked === "1" ? "destructive" : "outline"
                          }
                          className="w-fit"
                        >
                          {u.isLocked === "1" ? "Khóa" : "Hoạt động"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Ngày tạo
                        </p>
                        <p className="text-sm">
                          {u.createdAt
                            ? new Date(Number(u.createdAt)).toLocaleDateString(
                                "vi-VN"
                              )
                            : "-"}
                        </p>
                      </div>
                    </CardContent>
                    <div className="border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEdit(u)}
                        className="w-full gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Chỉnh sửa
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {page} • Tổng: {total} người dùng
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= total}
            >
              Sau
            </Button>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog
          open={!!edit}
          onOpenChange={(open: boolean) => !open && setEdit(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
              <DialogDescription>{edit?.email}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Họ tên</label>
                <Input
                  value={edit?.fullName || ""}
                  onChange={(e) =>
                    setEdit({ ...edit, fullName: e.target.value })
                  }
                  placeholder="Nhập họ tên"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Điện thoại</label>
                <Input
                  value={edit?.phone || ""}
                  onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Địa chỉ</label>
                <Input
                  value={edit?.location || ""}
                  onChange={(e) =>
                    setEdit({ ...edit, location: e.target.value })
                  }
                  placeholder="Nhập địa chỉ"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2 flex-col sm:flex-row">
              <Button
                variant="outline"
                onClick={() => handleToggleRole()}
                className="flex-1"
              >
                {edit?.role === "admin" ? "Hạ xuống User" : "Nâng lên Admin"}
              </Button>

              <Button
                variant={edit?.isLocked === "1" ? "default" : "destructive"}
                onClick={() => handleToggleLock()}
                className="flex-1"
              >
                {edit?.isLocked === "1" ? (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Mở khóa
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Khóa
                  </>
                )}
              </Button>

              <Button onClick={() => handleSave()} className="flex-1">
                Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
