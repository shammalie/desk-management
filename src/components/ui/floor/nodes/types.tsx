export enum BookingStatus {
  AVAILABLE = "Available",
  BOOKED = "Booked",
  UNAVAILABLE = "Unavailable",
}

export enum NodeType {
  Desk = 'desk',
  Room = 'room'
}

export type CustomNodeType = {
  key: NodeType,
  name: string;
  status: BookingStatus;
  rotation?: number;
  rotationSnap: boolean;
};
