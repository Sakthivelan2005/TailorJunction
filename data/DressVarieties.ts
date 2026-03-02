import { type Specialization } from "../types/shopDetails";
export const DressVarieties: Record<
  Exclude<Specialization, "Both">,
  string[]
> = {
  Gents: [
    "Shirt",
    "Pant",
    "Trousers",
    "Jeans",
    "Suit",
    "Blazer",
    "Waistcoat",
    "Kurta",
    "Sherwani",
  ],
  Ladies: [
    "Blouse",
    "Churidar",
    "Salwar",
    "Anarkali",
    "Lehenga",
    "Saree Blouse",
    "Gown",
    "Skirt",
  ],
  Kids: ["School Uniform", "Frock", "Shorts", "T-Shirt", "Ethnic Wear"],
};
