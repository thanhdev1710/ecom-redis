"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { API } from "@/lib/base";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) router.replace("/user");
  }, [router]);

  // 🧠 Đăng nhập
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const email = loginData.email.trim().toLowerCase();

      const res = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: loginData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      localStorage.setItem("email", data.user.email);
      router.push("/user");
    } catch (err) {
      // TODO: bạn có thể hiện toast ở đây
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // 🧠 Đăng ký
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      // TODO: toast lỗi "Mật khẩu xác nhận không khớp"
      return;
    }

    setIsLoading(true);
    try {
      const email = registerData.email.trim().toLowerCase();

      const res = await fetch(`${API}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: registerData.password,
          fullName: registerData.name,
          email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Đăng ký thất bại");
      }

      localStorage.setItem("email", data.user.email);
      router.push("/user");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại trang chủ
          </Button>
        </Link>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Đăng nhập</TabsTrigger>
            <TabsTrigger value="register">Đăng ký</TabsTrigger>
          </TabsList>

          {/* --- LOGIN --- */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl ">Đăng nhập</CardTitle>
                <CardDescription>
                  Nhập email và mật khẩu để đăng nhập vào tài khoản của bạn
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mật khẩu</Label>
                    <Input
                      type="password"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 mt-6">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* --- REGISTER --- */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl ">Đăng ký</CardTitle>
                <CardDescription>
                  Tạo tài khoản mới để bắt đầu mua sắm
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Họ và tên</Label>
                    <Input
                      type="text"
                      value={registerData.name}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mật khẩu</Label>
                    <Input
                      type="password"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          password: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Xác nhận mật khẩu</Label>
                    <Input
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="mt-6">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
