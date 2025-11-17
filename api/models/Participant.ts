export interface Participant {
  id: string,
  meetingId: string,
  role: "host" | "guest",
  joinedAt: number,
  isMuted: boolean,
  isCameraOn: boolean,
  handRaised: boolean
}
