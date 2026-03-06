export const Images = {
  verified: require("../assets/images/verified.png"),
  placeholder: require("../assets/images/placeholder.jpeg"),
  location: require("../assets/images/location.png"),
};

// config/Images.ts
// Centralized image registry (loaded once)

export const DressImages: Record<string, any> = {
  // MEN
  "images/men/men_formal_shirt.png": require("@/assets/images/images/men/men_formal_shirt.png"),
  "images/men/men_blazer.png": require("@/assets/images/images/men/men_blazer.png"),
  "images/men/men_kurta.png": require("@/assets/images/images/men/men_kurta.png"),

  // WOMEN
  "images/women/women_blouse.png": require("@/assets/images/images/women/women_blouse.png"),
  "images/women/women_designer_blouse.png": require("@/assets/images/images/women/women_designer_blouse.png"),
  "images/women/salwar_kameez.png": require("@/assets/images/images/women/salwar_kameez.png"),
  "images/women/women_lehenga.png": require("@/assets/images/images/women/women_lehenga.png"),
  "images/women/women_gown.png": require("@/assets/images/images/women/women_gown.png"),

  // KIDS
  "images/kids/kids_frock.png": require("@/assets/images/images/kids/kids_frock.png"),
  "images/kids/kids_uniform.png": require("@/assets/images/images/kids/kids_uniform.png"),
  "images/kids/kids_kurta.png": require("@/assets/images/images/kids/kids_kurta.png"),
};
