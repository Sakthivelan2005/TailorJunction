export type Specialization = "Gents" | "Ladies" | "Kids" | "Both";
export interface ShopDetailsType {
  // SHOP DETAILS
  selectedSpecs: Specialization | null;
  setSelectedSpecs: React.Dispatch<React.SetStateAction<Specialization | null>>;

  dressVarieties: number[]; // ✅ FIXED
  setDressVarieties: React.Dispatch<React.SetStateAction<number[]>>;

  shopName: string;
  setShopName: (name: string) => void;

  shopLocation: string;
  setShopLocation: (location: string) => void;

  houseNo: string;
  setHouseNo: (value: string) => void;

  street: string;
  setStreet: (value: string) => void;

  area: string;
  setArea: (value: string) => void;

  district: string;
  setDistrict: (value: string) => void;

  profilePhoto: string | null;
  setProfilePhoto: (uri: string | null) => void;

  shopPhoto: string | null;
  setShopPhoto: (uri: string | null) => void;

  pincode: string;
  setPincode: (value: string) => void;

  saveTailorPricing: (
    tailorId: string | undefined,
    selectedDressIds: number[],
    allDressTypes: { dress_id: number; base_price: number }[],
  ) => Promise<void>;
}
