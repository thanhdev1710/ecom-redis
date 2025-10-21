"use client";

import type React from "react";
import { ShoppingBag, Search, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}

export function Header({
  cartItemCount,
  onCartClick,
  onSearch,
  searchQuery,
}: HeaderProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearch);
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            <Link href="/" onClick={handleNavClick}>
              <h1 className="text-2xl font-semibold tracking-tight">
                BasicStore
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <a
                href="#"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Sản phẩm mới
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Bar */}
            {isSearchOpen ? (
              <form
                onSubmit={handleSearch}
                className="hidden md:flex items-center gap-2"
              >
                <Input
                  type="search"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-64"
                  autoFocus
                />
                <Button type="submit" size="sm">
                  Tìm
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onCartClick}
              className="relative"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {cartItemCount}
                </span>
              )}
            </Button>

            {/* User Profile Button */}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="hidden md:flex"
            >
              <Link href="/login">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <form onSubmit={handleSearch} className="md:hidden pb-4">
            <div className="flex items-center gap-2">
              <Input
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm">
                Tìm
              </Button>
            </div>
          </form>
        )}

        {isMobileMenuOpen && (
          <nav className="lg:hidden border-t border-border py-4 space-y-3">
            <a
              href="#"
              onClick={handleNavClick}
              className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
            >
              Sản phẩm mới
            </a>
            <Link
              href="/login"
              onClick={handleNavClick}
              className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
            >
              Đăng nhập
            </Link>
            <div className="px-4 pt-2">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Tìm kiếm..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Button type="submit" size="sm">
                  Tìm
                </Button>
              </form>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
