// types/dress.ts
export type DressCategory = "men" | "women" | "kids";

export interface DressType {
  dress_id: number;
  category: DressCategory;
  dress_name: string;
  dress_image: string;
  base_price: number;
}
