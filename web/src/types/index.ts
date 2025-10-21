export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  categoryId: string;
  ratingAvg: number;
  sold: number;
  image: string;
}

export interface CartItem {
  pid: string;
  qty: number;
}

export interface Categories {
  id: string;
  key: string;
  name: string;
}
