export interface AuthResponse {
  token: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  status?: 'online' | 'offline' | 'busy' | string;
  currentLocation?: string;
  vehicle?: string;
  createdAt?: string;
}

export interface Job {
  id: string;
  pickup: string;
  dropoff: string;
  passengerName?: string;
  passengerPhone?: string;
  status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | string;
  fare?: number;
  assignedDriverId?: string;
  createdAt?: string;
}

export interface DispatchEvent {
  type: string;
  payload: unknown;
  timestamp?: string;
}
