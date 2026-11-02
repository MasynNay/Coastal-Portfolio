// Borrow a resident for a boat tour without advancing their normal routine.
export function createResidentPause() {
  const delays = new Map();
  let guest = null;
  return {
    hold(id, time) {
      guest = id ? { id, time } : null;
    },
    release(time) {
      if (guest)
        delays.set(guest.id, (delays.get(guest.id) || 0) + time - guest.time);
      guest = null;
    },
    timeFor(id, time) {
      return (guest?.id === id ? guest.time : time) - (delays.get(id) || 0);
    },
    id: () => guest?.id,
  };
}
