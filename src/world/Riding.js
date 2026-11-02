import { surfboard } from "./SurfRide";
import { skateboard } from "./SkateRide";
import { watercraft } from "./Harbor";
import { activityAsset } from "./Wardrobe";

// The minimap uses actual rental positions. World props have no floating labels.
export const rideStops = [
  surfboard,
  {
    ...skateboard,
    title: "Skateboard",
    icon: "skateboard",
    x: skateboard.x,
    z: skateboard.z,
  },
  ...watercraft.map((c) => ({
    ...c,
    x: c.boardX,
    z: c.boardZ,
    // Display the actual moored craft; navigation still targets its safe pier
    // boarding point. Separating these avoids overlapping rental buttons.
    mapPosition: { x: c.x, z: c.z },
    title: c.id === "boat" ? "Wakeboard ride" : "Jet ski",
    icon: c.id === "boat" ? "wakeboard" : "jetski",
  })),
];
export function riderPosition(ride) {
  return ride?.wakeboarding && ride.wakeboarder ? ride.wakeboarder : ride;
}
// A trick advances once from crouch to landing. Steady riding uses its own
// loop, so jumping is actual body animation as well as a board/lift effect.
export function boardPose(id, ride, wake, time, sheets, outfit = null) {
  const trick = ride?.trickProgress != null;
  const asset = activityAsset(
    id,
    outfit,
    trick ? "board-trick" : wake ? "wake-ride" : "board-ride",
    sheets,
  );
  const sheet = sheets[asset];
  return {
    asset,
    time:
      trick && sheet
        ? Math.min(
            (sheet.cycleFrames || sheet.columns) - 1,
            Math.floor(
              ride.trickProgress * (sheet.cycleFrames || sheet.columns),
            ),
          ) * sheet.frameMs
        : wake
          ? time
          : (ride?.gaitTime ?? time),
    moving: !!(wake || ride?.moving || trick),
  };
}
