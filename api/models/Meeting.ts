export interface Meeting {
  id: string,
  hostUid: string,             // usuario que creó la reunión
  title: string,
  description?: string,
  createdAt: number,
  updatedAt: number,
  startTime?: number,
  endTime?: number,
  active: boolean,
  participants: string[],      // array de UIDs
  maxParticipants: number
}

