"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { API } from "@/lib/base";
import { Categories } from "@/types";
import { useEffect, useState } from "react";

interface FilterBarProps {
  selectedCategory: string;
  sortBy: string;
  sortOrder: string;
  priceRange: { min: string; max: string };
  onFilterChange: (filters: {
    category?: string;
    sort?: string;
    order?: string;
    priceRange?: { min: string; max: string };
  }) => void;
}

export function FilterBar({
  selectedCategory,
  sortBy,
  sortOrder,
  priceRange,
  onFilterChange,
}: FilterBarProps) {
  const [categories, setCategories] = useState<Categories[]>([]);
  const [localPriceRange, setLocalPriceRange] = useState([0, 2000000]);

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories);
      });
  }, []);

  const handlePriceChange = (values: number[]) => {
    setLocalPriceRange(values);
    // Convert to API format
    const min = values[0] === 0 ? "-inf" : values[0].toString();
    const max = values[1] === 2000000 ? "+inf" : values[1].toString();
    onFilterChange({ priceRange: { min, max } });
  };

  return (
    <div
      id="products"
      className="flex flex-col gap-6 mb-8 pb-6 border-b border-border"
    >
      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onFilterChange({ category: "all" })}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-accent"
          }`}
        >
          Tất cả
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            onClick={() => onFilterChange({ category: item.id })}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Sort and price filters */}
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
        <div className="flex gap-3 items-center flex-wrap">
          {/* Sort by field */}
          <Select
            value={sortBy}
            onValueChange={(value) => onFilterChange({ sort: value })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Giá</SelectItem>
              <SelectItem value="rating">Đánh giá</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort order */}
          <Select
            value={sortOrder}
            onValueChange={(value) => onFilterChange({ order: value })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Thứ tự" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASC">Tăng dần</SelectItem>
              <SelectItem value="DESC">Giảm dần</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price range slider */}
        <div className="w-full sm:w-[300px]">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Giá: {localPriceRange[0].toLocaleString("vi-VN")}₫</span>
            <span>{localPriceRange[1].toLocaleString("vi-VN")}₫</span>
          </div>
          <Slider
            min={0}
            max={2000000}
            step={50000}
            value={localPriceRange}
            onValueChange={handlePriceChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
