// Socket.io client for emitting events to users
// In production, this would connect to your WebSocket server

let socketInstance: unknown = null;

export function setSocketInstance(io: unknown) {
  socketInstance = io;
}

export function getSocketInstance() {
  return socketInstance;
}

/**
 * Emit an event to a specific user's room
 */
export function emitToUser(
  userId: string,
  event: string,
  data: Record<string, unknown>
) {
  if (socketInstance && typeof (socketInstance as { to?: unknown }).to === "function") {
    const io = socketInstance as { to: (room: string) => { emit: (event: string, data: unknown) => void } };
    io.to(`user-${userId}`).emit(event, data);
  } else {
    // Log for debugging when socket is not available
    console.log(`[Socket] Would emit to user-${userId}:`, event, data);
  }
}

/**
 * Broadcast an event to all connected clients
 */
export function broadcast(event: string, data: Record<string, unknown>) {
  if (socketInstance && typeof (socketInstance as { emit?: unknown }).emit === "function") {
    const io = socketInstance as { emit: (event: string, data: unknown) => void };
    io.emit(event, data);
  } else {
    console.log(`[Socket] Would broadcast:`, event, data);
  }
}
