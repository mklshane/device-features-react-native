export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface TravelEntry {
  id: string;
  imageUri: string;
  location: LocationData;
  timestamp: number;
  description?: string;
}