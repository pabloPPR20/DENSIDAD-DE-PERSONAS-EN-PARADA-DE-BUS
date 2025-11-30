export interface SupabaseMeasurement {
  id: number;
  person_count: number;
  status: 'normal' | 'moderate' | 'congested';
  sensor1_distance: number;
  sensor2_distance: number;
  location: string | Location; // Can be a JSON string or an object
  timestamp: string; // ISO 8601 string
  recommendation: string;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface BusStopData {
  // Fields from Supabase
  id: number;
  personCount: number; // Renamed from person_count
  status: 'normal' | 'moderate' | 'congested';
  sensor1_distance: number;
  sensor2_distance: number;
  location: Location;
  timestamp: string;
  recommendation: string;
  
  // Derived field for display
  stopId: string;
}
