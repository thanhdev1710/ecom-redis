"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Package,
  ShoppingBag,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { API } from "@/lib/base";

interface Product {
  name: string;
  price: number;
  image?: string;
}

interface OrderItem {
  pid: string;
  qty: number;
  product?: Product;
}

interface Order {
  id: string;
  items?: OrderItem[];
  status?: string;
  createdAt?: string;
}

interface UserProfile {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  createdAt?: string;
}

const normalizeEmail = (s: string | null) =>
  (s || "").trim().toLowerCase() || null;

export default function UserPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    createdAt: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);

  const [notice, setNotice] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Lấy email từ localStorage và fetch profile + orders
  useEffect(() => {
    const stored = normalizeEmail(localStorage.getItem("email"));
    if (!stored) {
      setError("Chưa đăng nhập hoặc thiếu email trong localStorage.");
      setLoading(false);
      return;
    }
    setEmail(stored);

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/users/${stored}`);
        const data = await res.json();
        if (!res.ok || !data.ok)
          throw new Error(data.message || "Không lấy được hồ sơ");
        const u = data.user || {};
        setProfile({
          fullName: u.fullName || "",
          email: u.email || stored,
          phone: u.phone || "",
          location: u.location || "",
          createdAt: u.createdAt,
        });
      } catch (e: any) {
        console.warn("Fetch profile error:", e?.message || e);
      }
    };

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API}/users/${stored}/orders`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.message || "Lỗi không xác định");
        setOrders(data.orders || []);
      } catch (err: any) {
        setError(err.message || "Không thể tải đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    fetchOrders();
  }, []);

  // 💾 Cập nhật hồ sơ (BE: chỉ cho fullName, phone, location — KHÔNG gửi email)
  const handleUpdateProfile = async (payload: Partial<UserProfile>) => {
    if (!email) return;
    setSavingProfile(true);
    setNotice(null);
    try {
      const res = await fetch(`${API}/users/${email}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: payload.fullName ?? profile.fullName,
          phone: payload.phone ?? profile.phone,
          location: payload.location ?? profile.location,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok)
        throw new Error(data.message || "Cập nhật thất bại");
      setProfile((p) => ({ ...p, ...data.user }));
      setNotice({ type: "success", msg: "Cập nhật thông tin thành công" });
      setShowEdit(false);
    } catch (e: any) {
      setNotice({ type: "error", msg: e?.message || "Có lỗi khi cập nhật" });
    } finally {
      setSavingProfile(false);
    }
  };

  // 🔐 Đổi mật khẩu (đơn giản)
  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!email) return;
    setChangingPass(true);
    setNotice(null);
    try {
      const res = await fetch(`${API}/users/${email}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok)
        throw new Error(data.message || "Đổi mật khẩu thất bại");
      setNotice({ type: "success", msg: "Đổi mật khẩu thành công" });
      setShowChangePass(false);
    } catch (e: any) {
      setNotice({
        type: "error",
        msg: e?.message || "Có lỗi khi đổi mật khẩu",
      });
    } finally {
      setChangingPass(false);
    }
  };

  const getStatusColor = (status?: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("complete") || s.includes("hoàn thành"))
      return "bg-green-100 text-green-800 border-green-200";
    if (s.includes("process") || s.includes("xử lý"))
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (s.includes("ship") || s.includes("giao"))
      return "bg-purple-100 text-purple-800 border-purple-200";
    if (s.includes("cancel") || s.includes("hủy"))
      return "bg-red-100 text-red-800 border-red-200";
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  const calculateTotal = (items?: OrderItem[]) =>
    items?.reduce(
      (sum, item) => sum + (item.product?.price || 0) * (item.qty || 0),
      0
    ) || 0;

  function handleLogout() {
    localStorage.removeItem("email");
    // nếu bạn còn lưu token khác thì xoá thêm ở đây
    router.push("/");
  }

  // 🌀 Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          cartItemCount={0}
          onCartClick={() => {}}
          onSearch={() => {}}
          searchQuery=""
        />
        <main className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted rounded-lg w-1/3" />
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ⚠️ Error
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          cartItemCount={0}
          onCartClick={() => {}}
          onSearch={() => {}}
          searchQuery=""
        />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-destructive/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Có lỗi xảy ra
                    </h3>
                    <p className="text-muted-foreground">{error}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => router.push("/login")}>
                      Đăng nhập
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                    >
                      Thử lại
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // ✅ Main UI
  return (
    <div className="min-h-screen bg-background">
      <Header
        cartItemCount={0}
        onCartClick={() => {}}
        onSearch={() => {}}
        searchQuery=""
      />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2">
                Tài khoản của tôi
              </h1>
              <p className="text-muted-foreground">{email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>

          {/* --- Summary cards --- */}
          <div className="grid md:grid-cols-3 gap-6">
            <SummaryCard
              icon={<ShoppingBag className="h-6 w-6 text-primary" />}
              label="Tổng đơn hàng"
              value={orders.length}
            />
            <SummaryCard
              icon={<Package className="h-6 w-6 text-green-700" />}
              label="Đã hoàn thành"
              value={
                orders.filter(
                  (o) =>
                    o.status?.toLowerCase().includes("complete") ||
                    o.status?.toLowerCase().includes("hoàn thành")
                ).length
              }
            />
            <SummaryCard
              icon={<TrendingUp className="h-6 w-6 text-blue-700" />}
              label="Đang xử lý"
              value={
                orders.filter(
                  (o) =>
                    o.status?.toLowerCase().includes("process") ||
                    o.status?.toLowerCase().includes("xử lý")
                ).length
              }
            />
          </div>

          {/* --- Personal info --- */}
          <PersonalInfoCard
            username={email}
            profile={profile}
            showEdit={showEdit}
            setShowEdit={setShowEdit}
            showChangePass={showChangePass}
            setShowChangePass={setShowChangePass}
            onSaveProfile={handleUpdateProfile}
            savingProfile={savingProfile}
            onChangePassword={handleChangePassword}
            changingPass={changingPass}
            notice={notice}
          />

          {/* --- Orders list --- */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Đơn hàng của bạn</CardTitle>
                    <CardDescription>
                      Theo dõi và quản lý các đơn hàng
                    </CardDescription>
                  </div>
                </div>
                <Link href="/">
                  <Button variant="outline" size="sm">
                    Tiếp tục mua sắm
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent>
              {orders.length === 0 ? (
                <EmptyOrder />
              ) : (
                <div className="space-y-4">
                  {orders.map((order, idx) => (
                    <OrderCard
                      key={idx}
                      order={order}
                      idx={idx}
                      getStatusColor={getStatusColor}
                      calculateTotal={calculateTotal}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

/* -------------------- Components -------------------- */

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PersonalInfoCard({
  username,
  profile,
  showEdit,
  setShowEdit,
  showChangePass,
  setShowChangePass,
  onSaveProfile,
  savingProfile,
  onChangePassword,
  changingPass,
  notice,
}: {
  username: string | null;
  profile: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    createdAt?: string;
  };
  showEdit: boolean;
  setShowEdit: Dispatch<SetStateAction<boolean>>;
  showChangePass: boolean;
  setShowChangePass: Dispatch<SetStateAction<boolean>>;
  onSaveProfile: (payload: {
    fullName?: string;
    phone?: string;
    location?: string;
  }) => Promise<void>;
  savingProfile: boolean;
  onChangePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  changingPass: boolean;
  notice: { type: "success" | "error"; msg: string } | null;
}) {
  const [form, setForm] = useState({
    fullName: profile.fullName || "",
    phone: profile.phone || "",
    location: profile.location || "",
  });

  const [pass, setPass] = useState({ currentPassword: "", newPassword: "" });

  useEffect(() => {
    setForm({
      fullName: profile.fullName || "",
      phone: profile.phone || "",
      location: profile.location || "",
    });
  }, [profile]);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>Quản lý thông tin tài khoản</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Thông báo */}
        {notice && (
          <div
            className={`text-sm px-3 py-2 rounded-md border ${
              notice.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {notice.msg}
          </div>
        )}

        {/* Thông tin hiện tại */}
        <div className="grid md:grid-cols-2 gap-6">
          <InfoRow
            icon={<User />}
            label="Họ tên"
            value={profile.fullName || "Chưa cập nhật"}
          />
          <InfoRow
            icon={<Mail />}
            label="Email"
            value={profile.email || `${username}`}
          />
          <InfoRow
            icon={<Phone />}
            label="Số điện thoại"
            value={profile.phone || "Chưa cập nhật"}
          />
          <InfoRow
            icon={<MapPin />}
            label="Địa chỉ"
            value={profile.location || "Chưa cập nhật"}
          />
          <InfoRow
            icon={<Calendar />}
            label="Ngày tham gia"
            value={
              profile.createdAt
                ? new Date(Number(profile.createdAt)).toLocaleDateString(
                    "vi-VN",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )
                : "—"
            }
          />
        </div>

        <Separator />

        {/* Nút hành động */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowEdit((v) => !v)}>
            {showEdit ? "Đóng" : "Cập nhật thông tin"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowChangePass((v) => !v)}
          >
            {showChangePass ? "Đóng" : "Đổi mật khẩu"}
          </Button>
        </div>

        {/* Form cập nhật hồ sơ */}
        {showEdit && (
          <div className="mt-2 space-y-4 p-4 border rounded-xl bg-muted/30">
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Họ tên"
                value={form.fullName}
                onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
                placeholder="VD: Nguyễn Văn A"
              />
              {/* Email chỉ hiển thị, không cho sửa */}
              <Field
                label="Email (không thể đổi)"
                type="email"
                value={profile.email || username || ""}
                onChange={() => {}}
                placeholder="email@domain.com"
                readOnly
              />
              <Field
                label="Số điện thoại"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="VD: 0901234567"
              />
              <Field
                label="Địa chỉ"
                value={form.location}
                onChange={(v) => setForm((f) => ({ ...f, location: v }))}
                placeholder="123 Lê Trọng Tân"
              />
            </div>
            <div className="flex gap-3">
              <Button
                disabled={savingProfile}
                onClick={() => onSaveProfile(form)}
              >
                {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setForm({
                    fullName: profile.fullName || "",
                    phone: profile.phone || "",
                    location: profile.location || "",
                  })
                }
              >
                Hoàn tác
              </Button>
            </div>
          </div>
        )}

        {/* Form đổi mật khẩu */}
        {showChangePass && (
          <div className="mt-2 space-y-4 p-4 border rounded-xl bg-muted/30">
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Mật khẩu hiện tại"
                type="password"
                value={pass.currentPassword}
                onChange={(v) => setPass((p) => ({ ...p, currentPassword: v }))}
                placeholder="••••••••"
              />
              <Field
                label="Mật khẩu mới"
                type="password"
                value={pass.newPassword}
                onChange={(v) => setPass((p) => ({ ...p, newPassword: v }))}
                placeholder="Tối thiểu 8 ký tự"
              />
            </div>
            <div className="flex gap-3">
              <Button
                disabled={
                  changingPass || !pass.currentPassword || !pass.newPassword
                }
                onClick={() =>
                  onChangePassword(pass.currentPassword, pass.newPassword)
                }
              >
                {changingPass ? "Đang đổi..." : "Đổi mật khẩu"}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setPass({ currentPassword: "", newPassword: "" })
                }
              >
                Xoá nhập
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-5 w-5 text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

function EmptyOrder() {
  return (
    <div className="text-center py-16">
      <div className="h-20 w-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Chưa có đơn hàng nào</h3>
      <p className="text-muted-foreground mb-6">
        Bắt đầu khám phá và mua sắm ngay hôm nay
      </p>
      <Link href="/">
        <Button size="lg">Khám phá sản phẩm</Button>
      </Link>
    </div>
  );
}

function OrderCard({
  order,
  idx,
  getStatusColor,
  calculateTotal,
}: {
  order: Order;
  idx: number;
  getStatusColor: (status?: string) => string;
  calculateTotal: (items?: OrderItem[]) => number;
}) {
  return (
    <Card className="border hover:shadow-md transition-all hover:border-primary/50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg">
                  Đơn hàng #{order.id || `ORD-${idx + 1}`}
                </p>
                <Badge
                  className={getStatusColor(order.status)}
                  variant="outline"
                >
                  {order.status || "Đang xử lý"}
                </Badge>
              </div>
              {order.createdAt && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {order.items?.length ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Sản phẩm:
              </p>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-md bg-background border flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Số lượng: {item.qty}
                        </p>
                      </div>
                    </div>
                    {item.product?.price && (
                      <p className="font-semibold">
                        {(item.product?.price * item.qty).toLocaleString(
                          "vi-VN"
                        )}
                        ₫
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              {order.items?.length || 0} sản phẩm
            </p>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Tổng cộng</p>
              <p className="text-2xl font-bold text-primary">
                {calculateTotal(order.items).toLocaleString("vi-VN")}₫
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <input
        type={type}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary ${
          readOnly ? "bg-muted cursor-not-allowed text-muted-foreground" : ""
        }`}
        value={value}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  );
}
