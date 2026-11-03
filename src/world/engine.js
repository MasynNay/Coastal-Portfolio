import { startWindSong } from "./WindStatue";
import { restSpots, createRestSpots } from "./RestSpots";
import { gameTitles } from "./games/GameLocations";
import { createSurfRide, surfboard } from "./SurfRide";
import { createFloatHunt } from "./FloatHunt";
import { readShells, addShell, createShellSpawns } from "./Shells";
import { beachStations, createBeachActivities } from "./BeachActivities";
import { isSand } from "./Coast";
import { rideStops, riderPosition } from "./Riding";
import { createAxolotlRace, axolotlRaceMarker } from "./AxolotlRace";
import { axolotlArcade } from "./AxolotlFlight";
import { createOceanPraise } from "./OceanPraise";
import { createSkateRide, skateboard } from "./SkateRide";
import { createResidentPause } from "./ResidentPause";
import { createNpcTricks, trickPose } from "./NpcTricks";
import { createNpcRides } from "./NpcRides";
import { readAquariums, saveAquariums, addFish, removeFish } from "./Fish";
import { createDuckPlay } from "./DuckPlay";
import { travelTarget } from "./Travel";
import { createDogPlay } from "./DogPlay";
import {
  readTerrariums,
  addBug,
  removeBug,
  saveTerrariums,
  bugSpecies,
  createBugSpawns,
  bugTrees,
} from "./Bugs";
import { abilityActive, abilityLocksMovement, startAbility } from "./Abilities";
import { bikes, createBikeRide } from "./Bikes";
import { planGlide, glideVisual } from "./Glide";
import { createWebs } from "./Heroes";
import { townProps, pond, mailboxes, isOcean } from "./TownLayout";
import { walkSpeed, runSpeed } from "./Movement";
import { advanceGait } from "./Gait";
import { familyGreeting } from "./Interactions";
import { characterSelection } from "./Wardrobe";
import { createFishingSequence } from "./Fishing";
import { surfEntry, isWater, isWaterSurface, axolotlColors } from "./Surf";
import {
  doorApproach,
  doorArrival,
  roomEntrance,
  roomExit,
  enteringBuilding,
  leavingRoom,
} from "./WorldLayout";
import { flyDepartureMs, flyArrivalMs } from "./Fly";
import { roamingPeople, roamingAnimals } from "./Roaming";
import { goosePair } from "./Ducks";
import { createSkySalute } from "./Sky";
import {
  buildings,
  animals,
  characters,
  obstacles,
  roomObstacles,
} from "./config";
import { canStand, move, findPath } from "./navigation";
import { movementDirection } from "./animation";
import { createCanvasScene } from "./canvasScene";
import { createKeyboardInput } from "./keyboardInput";
import { createPointerInput } from "./PointerInput";
import { createWaterRide } from "./WaterRides";
import { watercraft } from "./Harbor";
import { createFrameLoop } from "./frameLoop";

const closeInteractionTypes = new Set(["shell", "float", "sandcastle", "kite"]);

// Input and collision stay independent of the renderer and character model assets.
// State is private to this instance; React receives changes to prompts/rooms, not every step.
export function createWorld(host, callbacks) {
  const scene = createCanvasScene(host, () => {
    if (!disposed) requestDraw();
  });
  let room = null,
    character = "masyn",
    outfit = null,
    position = {
      x: 0,
      z: 9,
    },
    direction = 0,
    moving = false;
  let gaitTime = 0,
    worldTime = 0,
    skyTime = 0,
    rideTime = 0,
    salutePose = null;
  const skySalute = createSkySalute();
  let action = null;
  let surfing = false;
  let fishingPhase = null,
    fishingStarted = 0,
    fishingTarget = null;
  const fishing = createFishingSequence({
    onPhase(phase) {
      fishingPhase = phase;
      publish();
      requestDraw();
    },
    onFinish(result) {
      if (result.caught && result.fishId) {
        fishCollection = saveAquariums(addFish(fishCollection, result.fishId));
        callbacks.onAquariums?.(fishCollection);
      }
      fishingPhase = null;
      action = null;
      publish();
      requestDraw();
      callbacks.onEvent?.({
        type: "fishing-result",
        ...result,
      });
    },
  });
  function cancelFishing() {
    fishing.cancel();
    fishingPhase = null;
    if (action === "fish") action = null;
  }
  function startFishing() {
    if (skySalute.active()) return;
    if (
      room ||
      loading ||
      frozen ||
      travelInProgress ||
      fishingPhase ||
      activityBusy() ||
      abilityLocksMovement(abilityEffect, worldTime)
    )
      return;
    if (!shore() && !surfing && !nearFishingSpot()) return;
    stop();
    if (Math.hypot(position.x - pond.x, position.z - pond.z) < 8)
      direction = movementDirection(pond.x - position.x, pond.z - position.z);
    const angle = (direction * Math.PI) / 4;
    fishingTarget =
      [2.3, 3, 3.5, 1.8, 1.2, 0.8]
        .map((distance) => ({
          x: position.x + Math.sin(angle) * distance,
          z: position.z + Math.cos(angle) * distance,
        }))
        .find((p) => isWaterSurface(p.x, p.z)) || shore();
    if (!fishingTarget) return;
    fishingStarted = performance.now();
    action = "fish";
    fishing.start(
      isOcean(fishingTarget.x, fishingTarget.z) ? "saltwater" : "freshwater",
    );
  }
  let flightTimer = null,
    travelInProgress = false;
  let townReady = false,
    dirty = true;
  let loading = true,
    frozen = false,
    disposed = false,
    path = [],
    pathRunning = false,
    touchRunning = false,
    lastRoom = null,
    loadVersion = 0;
  let keyboardState = null,
    pointerInput = null;
  const wantsRun = () =>
    keys.has("shift") || (path.length ? pathRunning : touchRunning);
  let fishCollection = readAquariums(),
    bugCollection = readTerrariums(),
    shellCollection = readShells();
  const keys = new Set();
  const floatHunt = createFloatHunt(),
    shellSpawns = createShellSpawns(),
    beachActivities = createBeachActivities();
  const dogPlay = createDogPlay(),
    duckPlay = createDuckPlay(),
    webs = createWebs(),
    bikeRide = createBikeRide(),
    waterRide = createWaterRide(),
    skateRide = createSkateRide(),
    rest = createRestSpots(),
    surfRide = createSurfRide((p) => canStand(p.x, p.z, obstacles)),
    axolotlRace = createAxolotlRace(),
    guestPause = createResidentPause(),
    oceanPraise = createOceanPraise(),
    tricks = createNpcTricks(),
    npcRides = createNpcRides();
  const bugSpawns = createBugSpawns();
  let webEffects = [];
  let abilityEffect = null;
  function cancelAbility() {
    if (abilityEffect?.kind === "glide") {
      position = { x: abilityEffect.x, z: abilityEffect.z };
      direction = abilityEffect.direction;
    }
    abilityEffect = null;
  }
  const activityBusy = () =>
    dogPlay.active() ||
    duckPlay.active() ||
    bikeRide.active() ||
    waterRide.active() ||
    skateRide.active() ||
    axolotlRace.active() ||
    surfRide.active() ||
    beachActivities.busy();
  const manualWatercraft = () =>
    waterRide.id() === "jetski" && waterRide.snapshot()?.phase === "riding";
  const manualCraft = () =>
    manualWatercraft() || skateRide.manual() || surfRide.manual();
  function cancelActivities() {
    skySalute.cancel();
    salutePose = null;
    const restingOrigin = rest.stop();
    if (restingOrigin) position = { ...restingOrigin };
    beachActivities.cancel();
    const surferOrigin = surfRide.cancel();
    if (surferOrigin) position = { ...surferOrigin };
    const raceOrigin = axolotlRace.cancel();
    if (raceOrigin) restoreRaceOrigin(raceOrigin);
    oceanPraise.cancel();
    guestPause.release(worldTime);
    const skateOrigin = skateRide.cancel();
    if (skateOrigin) position = { ...skateOrigin };
    const waterOrigin = waterRide.cancel();
    if (waterOrigin) {
      position = { x: waterOrigin.x, z: waterOrigin.z };
      surfing = waterOrigin.surfing;
    }
    const origin = bikeRide.cancel();
    if (origin) position = { ...origin };
    tricks.cancel(worldTime);
    dogPlay.cancel();
    duckPlay.cancel(worldTime);
  }
  // Race costumes are temporary. Travel, selection, stopping and completion all
  // restore the exact pier position, appearance and surf state that we borrowed.
  function restoreRaceOrigin(origin) {
    position = { x: origin.x, z: origin.z };
    direction = origin.direction;
    outfit = origin.outfit;
    surfing = origin.surfing;
  }
  function worldAnimals() {
    const play = dogPlay.snapshot(),
      duck = duckPlay.snapshot();
    return roamingAnimals(worldTime, bugSpawns.active(worldTime))
      .filter((a) => bugSpawns.visible(a.id, worldTime))
      .map((a) => {
        const spot = bugSpawns.position(a.id, worldTime);
        if (spot) {
          a = {
            ...a,
            x: spot.x,
            z: spot.z,
            lift: spot.lift,
          };
        }
        if (play?.id === a.id && !play.done)
          return {
            ...a,
            ...play.dog,
          };
        const playingBird = duck?.members?.find((member) => member.id === a.id);
        if (playingBird && !duck.done)
          return {
            ...a,
            ...playingBird.duck,
          };
        if (a.kind === "duck" || a.kind === "goose")
          return duckPlay.resume(a, worldTime);
        const anchor = dogPlay.settled().get(a.id);
        if (!anchor) return a;
        const t = (worldTime - anchor.at) / 4000,
          x = anchor.x + Math.sin(t) * 0.8,
          z = anchor.z + (Math.cos(t) - 1) * 0.5;
        return canStand(x, z, obstacles)
          ? {
              ...a,
              x,
              z,
            }
          : {
              ...a,
              x: anchor.x,
              z: anchor.z,
              moving: false,
            };
      });
  }
  let heart = null,
    heartTimer = null,
    lastStatus = "",
    lastLabels = "";
  function worldResidents() {
    if (axolotlRace.active()) return axolotlRace.snapshot().racers;
    const effects = tricks.snapshot(worldTime);
    return roamingPeople(worldTime, (id, t) =>
      npcRides.actorTime(id, tricks.actorTime(id, guestPause.timeFor(id, t))),
    ).map((a) => {
      const resident = npcRides.decorate(
        trickPose(
          a,
          effects.find((e) => e.id === a.id),
        ),
      );
      // Borrowed residents cannot be assigned a bicycle or another interaction
      // while they are wakeboarding behind the player's boat.
      return resident.id === guestPause.id()
        ? { ...resident, hidden: true }
        : resident;
    });
  }
  function state() {
    return {
      room,
      residents: worldResidents(),
      oceanPraise: room ? null : oceanPraise.snapshot(worldTime),
      skateRide: skateRide.snapshot(),
      surfRide: surfRide.snapshot(),
      rest: rest.snapshot(worldTime),
      npcTricks: tricks.snapshot(worldTime),
      night: room ? 0 : tricks.night(worldTime),
      animals: worldAnimals(),
      dogPlay: dogPlay.snapshot(),
      duckPlay: duckPlay.snapshot(),
      bikeRide: bikeRide.snapshot(),
      waterRide: waterRide.snapshot(),
      axolotlRace: axolotlRace.snapshot(),
      bikeParking: bikeRide.parking(),
      webEffects,
      abilityEffect,
      treeShake: bugSpawns.treeShake(worldTime),
      worldTime,
      skyTime,
      rideTime,
      salute: salutePose,
      character,
      outfit,
      position,
      direction,
      moving,
      gaitTime,
      action,
      fishingPhase,
      fishingTarget,
      fishingElapsed: performance.now() - fishingStarted,
      surfing,
      running: wantsRun(),
      loading,
      glassFloats: floatHunt.points(),
      floatHunt: floatHunt.snapshot(),
      shells: shellSpawns.snapshot(),
      beach: beachActivities.snapshot(worldTime),
      heart,
      destination: path[path.length - 1],
      inputSource: keys.size ? "keyboard" : path.length ? "pointer" : "idle",
      heldKeys: [...keys].join(","),
      scheduler: loop.statistics?.() || {},
      inputTrace: keyboardState?.statistics?.() || [],
    };
  }
  const fishingSpots = [
    {
      id: "pond",
      x: pond.x,
      z: pond.z + pond.rz + 0.7,
      label: "Go fishing",
      type: "fishing",
    },
    {
      id: "harbor",
      x: 0,
      z: 29,
      label: "Cast into the sea",
      type: "fishing",
    },
  ];
  const nearFishingSpot = () =>
    fishingSpots.some(
      (p) => Math.hypot(position.x - p.x, position.z - p.z) < 2.45,
    );
  function points() {
    if (room)
      return [
        {
          id: "exit",
          ...roomExit,
          label: "Return to town",
          type: "exit",
        },
        {
          id: room,
          x: 0,
          z: -3.9,
          label: `Read ${buildings.find((b) => b.id === room).title}`,
          type: "content",
        },
        ...(room === "home"
          ? [
              {
                id: "trivia",
                x: -9.3,
                z: -6.5,
                label: "Watch a little Friends?",
                type: "trivia",
              },
            ]
          : []),
      ];
    return [
      ...restSpots.map((p) => ({ ...p, type: "rest" })),
      axolotlRaceMarker,
      { ...surfboard, type: "surfboard", label: "Catch a wave" },
      ...fishingSpots,
      ...watercraft.flatMap((c) => [
        {
          ...c,
          x: c.boardX,
          z: c.boardZ,
          type: "watercraft",
          label: c.id === "boat" ? "Take a wakeboard ride" : "Ride the jet ski",
        },
        {
          ...c,
          type: "watercraft",
          label: c.id === "boat" ? "Take a wakeboard ride" : "Ride the jet ski",
        },
      ]),
      ...bugTrees.map((t) => ({
        ...t,
        type: "tree",
        label: "Shake tree · find bugs",
      })),
      ...bikes.map((b) => ({
        ...b,
        type: "bike",
        label: `Ride the ${b.name}`,
      })),
      ...(!room && !surfing
        ? [{ ...skateboard, type: "skateboard", label: "Ride the skateboard" }]
        : []),
      ...mailboxes.map((p) => ({
        ...p,
        type: "mailbox",
        label: "Read the mailbox",
      })),
      ...townProps.map((p) => ({
        ...p,
        label:
          p.id === "wind-statue"
            ? "Conduct the sea breeze"
            : p.id === "shell-fountain"
              ? axolotlArcade.label
              : gameTitles[p.id]
                ? "Play " + gameTitles[p.id]
                : "Explore " + p.id.replaceAll("-", " "),
        type:
          p.id === "shell-fountain"
            ? "axolotl-game"
            : gameTitles[p.id]
              ? "island-game"
              : "town-prop",
      })),
      ...buildings.map((b) => ({
        id: b.id,
        ...doorApproach(b),
        label: `Enter ${b.title}`,
        type: "building",
      })),
      ...state()
        .residents.filter((r) => r.id !== character && !r.room && !r.hidden)
        .map((r) => ({
          ...r,
          label: `Say hello to ${characters.find((c) => c.id === r.id).name}`,
          type: "person",
        })),
      ...state()
        .animals.filter((a) => !a.lift && !a.ambient)
        .map((a) => ({
          ...a,
          label:
            a.kind === "dog" || a.kind === "duck"
              ? `Play with ${a.name}`
              : bugSpecies.some((s) => s.id === a.id)
                ? "Catch bug"
                : `Meet ${a.name}`,
          type:
            a.kind === "dog"
              ? "dog"
              : a.kind === "duck"
                ? "duck"
                : bugSpecies.some((s) => s.id === a.id)
                  ? "bug"
                  : "animal",
        })),
      ...[goosePair(state().animals)].filter(Boolean),
      ...floatHunt
        .points()
        .map((p) => ({ ...p, type: "float", label: `Collect ${p.name}` })),
      ...shellSpawns.snapshot(),
      ...(!surfing ? beachStations : []),
    ];
  }
  function nearby() {
    return points()
      .map((p) => ({
        ...p,
        distance: Math.hypot(position.x - p.x, position.z - p.z),
      }))
      .filter(
        (p) => p.distance < (closeInteractionTypes.has(p.type) ? 1.65 : 2.45),
      )
      .sort(
        (a, b) =>
          Number(["duck", "dog"].includes(b.type) && b.distance < 1.8) -
            Number(["duck", "dog"].includes(a.type) && a.distance < 1.8) ||
          a.distance - b.distance,
      )[0];
  }
  function shore() {
    return !room && !surfing && !waterRide.active()
      ? surfEntry(position, direction, (p) =>
          canStand(p.x, p.z, obstacles, false, true),
        )
      : null;
  }
  function publish() {
    const selected = nearby();
    const snapshot = {
      room,
      character,
      outfit,
      loading,
      prompt: loading
        ? null
        : rest.active()
          ? "Stand up"
          : axolotlRace.active()
            ? "Leave the race"
            : skateRide.active()
              ? "Return the skateboard"
              : waterRide.active()
                ? "Return to pier"
                : bikeRide.active()
                  ? "A little ride around the pond…"
                  : beachActivities.busy()
                    ? "Building a sandcastle…"
                    : surfRide.active()
                      ? "Steer onto a beach to step ashore"
                      : isBeachInteraction(selected)
                        ? selected.label
                        : selected?.type === "duck" && selected.distance < 1.8
                          ? selected.label
                          : ["watercraft", "race", "surfboard"].includes(
                                selected?.type,
                              )
                            ? selected.label
                            : surfing
                              ? "Surfing · return to shore to walk"
                              : shore()
                                ? `Surf on your ${axolotlColors[character]} axolotl`
                                : nearby()?.label || null,
      fishingPhase,
      interactionBusy: beachActivities.busy(),
      surfingBoard: surfRide.active(),
      surfTransitioning: surfRide.active() && !surfRide.manual(),
      race: axolotlRace.active()
        ? {
            phase: axolotlRace.snapshot().phase,
            countdown: axolotlRace.snapshot().countdown,
          }
        : null,
      canFish:
        !room && !activityBusy() && (!!shore() || surfing || nearFishingSpot()),
      canSurf: !activityBusy() && !!shore(),
      surfing,
      promptType: bikeRide.active() ? null : selected?.type || null,
      bike: bikeRide.active() ? bikeRide.snapshot()?.id : null,
      skateboarding: skateRide.active(),
      skateReturning: skateRide.snapshot()?.phase === "returning",
      watercraft: waterRide.active() ? waterRide.id() : null,
      waterReturning:
        waterRide.active() && waterRide.snapshot()?.phase === "returning",
      floatCount: floatHunt.snapshot().found.length,
      foundFloats: floatHunt.snapshot().found,
      floatDiscoveries: floatHunt.snapshot().discovered,
      hunt: floatHunt.snapshot().active,
    };
    const signature = JSON.stringify(snapshot);
    if (signature !== lastStatus) {
      lastStatus = signature;
      callbacks.onStatus?.(snapshot);
    }
    callbacks.onMap?.(position, surfing, room);
    const labels = scene.labels(),
      labelKey = JSON.stringify(labels);
    if (labelKey !== lastLabels) {
      lastLabels = labelKey;
      callbacks.onLabels?.(labels);
    }
  }
  function stop(reason = "stop") {
    surfRide.stop();
    waterRide.stop();
    skateRide.stop();
    keyboardState?.clear(reason);
    pointerInput?.clear();
    pathRunning = false;
    keys.clear();
    path = [];
    moving = false;
  }
  function requestDraw() {
    dirty = true;
    loop.wake();
  }
  function cancelFlight() {
    clearTimeout(flightTimer);
    flightTimer = null;
    travelInProgress = false;
    scene.cancelFly?.();
  }
  // Loading is cancellable by version: a slow room image cannot reopen a room after leaving it.
  async function changeRoom(id) {
    if (!townReady) return;
    cancelFlight();
    cancelFishing();
    cancelActivities();
    webs.clear();
    cancelAbility();
    stop();
    const version = ++loadVersion;
    room = id;
    surfing = false;
    loading = !!id;
    if (id) {
      lastRoom = id;
      if (character === "masyn") outfit = id;
      position = {
        ...roomEntrance,
      };
    } else {
      const b = buildings.find((b) => b.id === lastRoom);
      position = b
        ? doorArrival(b)
        : {
            x: 0,
            z: 9,
          };
    }
    scene.snapCamera(position);
    scene.resize(state());
    publish();
    requestDraw();
    if (id) {
      try {
        await scene.loadRoom(id, character);
      } catch (e) {
        if (!disposed && version === loadVersion) callbacks.onError?.(e);
      }
      if (disposed || version !== loadVersion) return;
      loading = false;
      callbacks.onVisit?.(id);
      callbacks.onEvent?.({
        type: "content",
        id,
      });
      publish();
      requestDraw();
    }
  }
  // Close-up beach objects take precedence over the surf prompt at the same shore.
  function isBeachInteraction(p) {
    return !room && p?.distance < 1.65 && closeInteractionTypes.has(p.type);
  }
  function interact() {
    if (skySalute.active()) return;
    if (!frozen && rest.active()) {
      position = rest.stop();
      stop();
      publish();
      requestDraw();
      return;
    }
    if (!frozen && surfRide.active()) {
      return;
    }
    if (!frozen && axolotlRace.active()) {
      restoreRaceOrigin(axolotlRace.cancel());
      stop();
      publish();
      requestDraw();
      return;
    }
    if (!frozen && skateRide.active()) {
      skateRide.return();
      stop();
      publish();
      requestDraw();
      return;
    }
    if (!frozen && waterRide.active()) {
      waterRide.return(rideTime);
      stop();
      publish();
      requestDraw();
      return;
    }
    if (
      frozen ||
      loading ||
      travelInProgress ||
      fishingPhase ||
      activityBusy() ||
      abilityLocksMovement(abilityEffect, worldTime)
    )
      return;
    const duckTarget = nearby();
    if (duckTarget?.id === "wind-statue") {
      stop();
      cancelAbility();
      direction = 0;
      abilityEffect = startWindSong(
        { id: character, outfit, ...position },
        worldTime,
      );
      callbacks.onEvent?.({ type: "wind-song" });
      publish();
      requestDraw();
      return;
    }
    if (duckTarget?.type === "rest") {
      stop();
      cancelAbility();
      const seat = rest.start(duckTarget.id, position, worldTime);
      if (seat) {
        position = { x: seat.x, z: seat.z };
        direction = seat.direction;
        publish();
        requestDraw();
      }
      return;
    }
    if (duckTarget?.type === "surfboard") {
      stop();
      cancelAbility();
      surfing = false;
      surfRide.start(position, rideTime);
      publish();
      requestDraw();
      return;
    }
    if (isBeachInteraction(duckTarget)) {
      stop();
      const p = duckTarget;
      if (p.type === "float") {
        const saved = floatHunt.collect(p.id);
        if (saved)
          callbacks.onEvent?.({
            type: "float",
            name: p.name,
            count: saved.found.length,
          });
      } else if (p.type === "shell") {
        const shell = shellSpawns.collect(p.id, worldTime);
        if (shell) {
          shellCollection = addShell(shellCollection, shell.id);
          callbacks.onShells?.(shellCollection);
          callbacks.onEvent?.({
            type: "notice",
            message: `Found ${shell.name}! ${shell.rarity} · See Shells in the Field Guide.`,
          });
        }
      } else if (isSand(position.x, position.z)) {
        if (p.type === "sandcastle") {
          cancelAbility();
          position = { x: p.x + 1, z: p.z + 0.65 };
          direction = 6;
          beachActivities.build(worldTime);
        } else beachActivities.fly(worldTime, direction);
      }
      publish();
      requestDraw();
      return;
    }
    if (duckTarget?.type === "race") {
      stop();
      cancelAbility();
      cancelActivities();
      npcRides.cancel(worldTime);
      if (
        axolotlRace.start(
          { ...position, direction, outfit, surfing },
          worldTime,
        )
      ) {
        const racer = axolotlRace
          .snapshot()
          .racers.find((r) => r.id === character);
        position = { x: racer.x, z: racer.z };
        direction = racer.direction;
        outfit = null;
        surfing = true;
        publish();
        requestDraw();
      }
      return;
    }
    if (duckTarget?.type === "skateboard") {
      stop();
      if (skateRide.start(position, rideTime)) {
        position = { x: skateboard.x, z: skateboard.z };
        publish();
        requestDraw();
      }
      return;
    }
    if (duckTarget?.type === "watercraft") {
      stop();
      const crew = worldResidents();
      const guest =
        duckTarget.id === "boat"
          ? (
              crew.find(
                (r) =>
                  r.id !== character &&
                  !r.hidden &&
                  !r.surfing &&
                  !r.bike &&
                  !r.frog,
              ) || crew.find((r) => r.id !== character && !r.hidden && !r.bike)
            )?.id
          : null;
      if (
        waterRide.start(
          duckTarget.id,
          position,
          surfing,
          rideTime,
          guest,
          character,
        )
      ) {
        guestPause.hold(guest, worldTime);
        const ride = waterRide.snapshot();
        const rider = riderPosition(ride);
        position = { x: rider.x, z: rider.z };
        surfing = false;
        direction = ride.direction;
        publish();
        requestDraw();
      }
      return;
    }
    if (duckTarget?.type === "duck" && duckTarget.distance < 1.8) {
      stop();
      callbacks.onEvent?.(duckTarget);
      return;
    }
    const water = shore();
    if (water) {
      stop();
      surfing = true;
      position = water;
      scene.snapCamera(position);
      publish();
      requestDraw();
      return;
    }
    const p = nearby();
    if (!p) return;
    if (p.type === "tree") {
      stop();
      const result = bugSpawns.shake(p, worldTime, (q) =>
        canStand(q.x, q.z, obstacles),
      );
      callbacks.onEvent?.({
        type: "notice",
        message: result.count
          ? "Three little visitors fell from the branches! Move close to a bug, then press E or tap its Catch action."
          : result.reason,
      });
      publish();
      requestDraw();
      return;
    }
    if (p.type === "bike") {
      stop();
      if (npcRides.active(p.id) || !bikeRide.start(p.id, position, rideTime))
        callbacks.onEvent?.({
          type: "notice",
          message: "The bike route is busy. Try again in a moment.",
        });
      publish();
      requestDraw();
      return;
    }
    if (p.type === "building") changeRoom(p.id);
    else if (p.type === "exit") changeRoom(null);
    else if (p.type === "fishing") startFishing();
    else {
      if (p.type === "animal" || p.id === "mi-shell") {
        heart = {
          x: p.x,
          z: p.z,
          born: performance.now(),
        };
        clearTimeout(heartTimer);
        heartTimer = setTimeout(() => {
          heart = null;
          requestDraw();
        }, 1400);
        requestDraw();
      }
      const type =
        p.type === "person" ? familyGreeting(character, p.id) : p.type;
      callbacks.onEvent?.({
        ...p,
        type,
        room,
      });
    }
  }
  function useAbility() {
    if (skySalute.active()) return;
    if (
      !frozen &&
      !loading &&
      !travelInProgress &&
      character === "masyn" &&
      outfit === "panem"
    ) {
      skySalute.start(worldTime);
      salutePose = skySalute.update(skyTime, false, worldTime);
      requestDraw();
      return;
    }
    if (
      !frozen &&
      !loading &&
      (manualCraft() ||
        (waterRide.id() === "boat" && waterRide.snapshot()?.phase === "riding"))
    ) {
      if (skateRide.manual()) skateRide.trick(rideTime);
      else if (surfRide.manual()) surfRide.trick(rideTime);
      else waterRide.trick(rideTime);
      requestDraw();
      return;
    }
    if (
      frozen ||
      loading ||
      travelInProgress ||
      fishingPhase ||
      activityBusy() ||
      abilityActive(abilityEffect, worldTime)
    )
      return;
    const actor = { id: character, outfit, ...position, direction, surfing };
    if (["ezra", "fitzgerald"].includes(character))
      webs.shoot(actor, worldTime);
    else {
      abilityEffect = tricks.start(
        startAbility(actor, worldTime),
        worldResidents(),
        character,
        worldTime,
        !room,
      );
      if (abilityEffect?.kind === "trident")
        oceanPraise.summon({ ...actor, kind: "trident", room }, worldTime);
      if (abilityEffect?.target) direction = abilityEffect.direction;
      if (abilityEffect?.kind === "glide") {
        abilityEffect = planGlide(abilityEffect, (p) =>
          canStand(p.x, p.z, room ? roomObstacles : obstacles, !!room),
        );
        if (!abilityEffect)
          callbacks.onEvent?.({
            type: "notice",
            message: "Find a little clear space for your glider.",
          });
      }
      if (abilityEffect?.asset) path = [];
    }
    requestDraw();
  }
  const directionHeld = (key) =>
    keyboardState?.isActive?.(key) ?? keys.has(key);
  // Walking and steerable rides read the same held input. Taking the stronger
  // alias avoids doubling speed when WASD and its arrow key are held together.
  function movementInput() {
    const strength = (key) =>
      keyboardState?.strength?.(key) ?? Number(directionHeld(key));
    return {
      x:
        Math.max(strength("d"), strength("arrowright")) -
        Math.max(strength("a"), strength("arrowleft")),
      z:
        Math.max(strength("s"), strength("arrowdown")) -
        Math.max(strength("w"), strength("arrowup")),
    };
  }
  const loop = createFrameLoop((now, dt) => {
    if (disposed || document.hidden) return false;
    if (!frozen && !loading) worldTime += dt * 1000;
    if (!frozen && !loading && !room) skyTime += dt * 1000;
    salutePose = skySalute.update(
      skyTime,
      !room && !loading && !travelInProgress && !axolotlRace.active(),
      worldTime,
    );
    const saluting = !!salutePose;
    // Scripted rides need their own clock: skipping updates alone would make
    // an absolute-time bicycle/boat route jump forward after the salute.
    if (!frozen && !loading && !saluting) rideTime += dt * 1000;
    if (saluting && abilityEffect && !frozen)
      abilityEffect.started += dt * 1000;
    if (abilityEffect && !abilityActive(abilityEffect, worldTime)) {
      cancelAbility();
      dirty = true;
    }
    const glide = glideVisual(abilityEffect, worldTime);
    if (glide && !saluting) {
      position = { x: glide.x, z: glide.z };
      direction = glide.direction;
    }
    if (!frozen && !loading && !axolotlRace.active())
      npcRides.update(
        worldTime,
        worldResidents(),
        character,
        bikeRide.active() ? bikeRide.snapshot() : null,
      );
    const wasMoving = moving;
    moving = false;
    let remaining = dt;
    if (!frozen && !loading && axolotlRace.active()) {
      const race = axolotlRace.update(worldTime);
      if (race.done) {
        restoreRaceOrigin(race.origin);
        stop();
        callbacks.onEvent?.({
          type: "race-result",
          winner: race.winner,
          order: race.order,
        });
      } else {
        const racer = race.racers.find((r) => r.id === character);
        position = { x: racer.x, z: racer.z };
        direction = racer.direction;
        moving = racer.moving;
      }
      // Publish the restored pier view before the result dialog freezes play.
      dirty = true;
    }
    if (!frozen && !loading && !saluting && surfRide.active()) {
      const ride = surfRide.update(dt, rideTime, movementInput());
      position = { x: ride.x, z: ride.z };
      direction = ride.direction;
      moving = ride.moving;
      dirty = true;
      if (ride.done) {
        stop();
        callbacks.onEvent?.({
          type: "notice",
          message: "Back on the beach. That was a good wave!",
        });
      }
    }
    if (!frozen && !loading && !saluting && waterRide.active()) {
      const ride = waterRide.update(dt, rideTime, movementInput());
      const rider = riderPosition(ride);
      position = { x: rider.x, z: rider.z };
      direction = rider.direction;
      moving = ride.moving;
      if (ride.done) {
        guestPause.release(worldTime);
        surfing = ride.surfing;
        stop();
        callbacks.onEvent?.({
          type: "notice",
          message: "Back at the pier. Thanks for riding!",
        });
      }
    }
    if (!frozen && !loading && !saluting && skateRide.active()) {
      const ride = skateRide.update(dt, rideTime, movementInput());
      position = { x: ride.x, z: ride.z };
      direction = ride.direction;
      moving = ride.moving;
      if (ride.done) {
        stop();
        callbacks.onEvent?.({
          type: "notice",
          message: "Board returned to the rack. Nice ride!",
        });
      }
    }
    if (!frozen && !loading && !saluting && bikeRide.active()) {
      const ride = bikeRide.update(rideTime);
      position = { x: ride.x, z: ride.z };
      direction = ride.direction;
      moving = ride.moving;
      gaitTime = ride.time;
      if (ride.done)
        callbacks.onEvent?.({
          type: "notice",
          message: "Back at the bike rack. Thanks for riding!",
        });
    }
    if (!frozen && !loading && !saluting && dogPlay.active()) {
      const result = dogPlay.update(dt, worldTime);
      if (result) {
        const previous = position;
        position = {
          x: result.player.x,
          z: result.player.z,
        };
        const dx = position.x - previous.x,
          dz = position.z - previous.z;
        moving = Math.hypot(dx, dz) > 0.0001;
        if (moving) {
          direction = movementDirection(dx, dz);
          gaitTime += advanceGait(Math.hypot(dx, dz));
        }
        if (result.done)
          callbacks.onEvent?.({
            type: "dog",
            id: result.id,
            name: animals.find((a) => a.id === result.id)?.name,
          });
      }
    }
    if (!frozen && !loading && !saluting && duckPlay.active()) {
      const result = duckPlay.update(dt, worldTime);
      if (result) {
        const previous = position;
        position = {
          x: result.player.x,
          z: result.player.z,
        };
        surfing = result.surfing;
        const dx = position.x - previous.x,
          dz = position.z - previous.z;
        moving = Math.hypot(dx, dz) > 0.0001;
        if (moving) {
          direction = movementDirection(dx, dz);
          gaitTime += advanceGait(Math.hypot(dx, dz));
        }
        if (result.done)
          callbacks.onEvent?.({
            type: "duck-finished",
            id: result.id,
            kind: result.kind,
            name: result.name,
            members: result.id === "goose-pair" ? result.members : undefined,
          });
      }
    }
    if (
      !frozen &&
      !loading &&
      !travelInProgress &&
      !fishingPhase &&
      !saluting &&
      !activityBusy() &&
      !abilityLocksMovement(abilityEffect, worldTime)
    )
      do {
        const simulationDt = Math.min(remaining, 1 / 60);
        remaining -= simulationDt;
        const { x: horizontal, z: vertical } = movementInput();
        let { dx, dz } = scene.movement(horizontal, vertical);
        const keyboardDriven = !!(dx || dz);
        if (keyboardDriven) {
          if (rest.active()) position = rest.stop();
          path = [];
        } else if (path.length) {
          // Consume reached waypoints in this frame, avoiding a one-frame pause at every grid square.
          while (
            path.length &&
            Math.hypot(path[0].x - position.x, path[0].z - position.z) < 0.15
          )
            path.shift();
          if (path.length) {
            dx = path[0].x - position.x;
            dz = path[0].z - position.z;
          }
        }
        const length = Math.hypot(dx, dz);
        if (length) {
          // An input event can request a redraw at the same timestamp. Keep
          // the current stride on that zero-time frame instead of resetting
          // to idle while a direction/path is still held.
          if (simulationDt === 0 && wasMoving) moving = true;
          const running = wantsRun();
          const speed = running ? runSpeed : walkSpeed;
          // A key supplies a direction, not a destination one unit away. Only click paths
          // need an arrival cap; capping the keyboard vector slows running on late frames.
          const distance =
            (speed *
              simulationDt *
              (keyboardDriven
                ? Math.min(
                    1,
                    Math.max(Math.abs(horizontal), Math.abs(vertical)),
                  )
                : 1)) /
            scene.speedScale(dx / length, dz / length);
          const step = keyboardDriven ? distance : Math.min(distance, length);
          const previous = position;
          const next = move(
            position,
            (dx / length) * step,
            (dz / length) * step,
            room ? roomObstacles : obstacles,
            !!room,
            surfing,
          );
          const advanced =
            Math.hypot(next.x - position.x, next.z - position.z) > 0.0001;
          moving ||= advanced;
          if (advanced) {
            const projected = scene.facing(
              next.x - previous.x,
              next.z - previous.z,
            );
            gaitTime += advanceGait(
              Math.hypot(projected.x, projected.z),
              running,
            );
          }
          position = next;
          if (surfing && !isWater(position.x, position.z)) surfing = false;
          const door = !room && enteringBuilding(position, previous, buildings);
          if (door) {
            changeRoom(door);
            break;
          }
          if (room && leavingRoom(position, previous)) {
            changeRoom(null);
            break;
          }
          const facing = scene.facing(next.x - previous.x, next.z - previous.z);
          if (advanced) {
            direction = movementDirection(facing.x, facing.z);
          }
          // A path blocked by a changed position stops rather than running an idle loop forever.
          if (simulationDt > 0 && !advanced && path.length) path = [];
        }
      } while (remaining > 0.000001);
    if (!loading && !travelInProgress) {
      const actors = (room ? [] : worldResidents()).filter(
        (a) => a.id !== character && !a.surfing && !a.hidden && !a.frog,
      );
      if (!surfing)
        actors.push({
          id: character,
          outfit,
          x: position.x,
          z: position.z,
          direction,
        });
      webEffects = webs.update(actors, worldTime);
    }
    if (!frozen && !loading && !travelInProgress && !room) {
      shellSpawns.update(worldTime, position);
      if (beachActivities.animating()) dirty = true;
      if (
        !isSand(position.x, position.z) &&
        beachActivities.snapshot(worldTime).kite
      )
        beachActivities.cancel();
      const message = beachActivities.update(
        worldTime,
        position,
        direction,
        moving && !surfing && !activityBusy(),
      );
      if (message) callbacks.onEvent?.({ type: "notice", message });
    }
    if (!moving) gaitTime = 0;
    if (
      dirty ||
      moving ||
      wasMoving ||
      abilityActive(abilityEffect, worldTime) ||
      scene.animating() ||
      tricks.animating(worldTime)
    ) {
      dirty = false;
      scene.draw(state(), now);
      publish();
    }
    return (
      !loading &&
      !frozen &&
      (activityBusy() ||
        rest.active() ||
        beachActivities.animating() ||
        path.length > 0 ||
        [...keys].some((k) => k !== "shift") ||
        abilityActive(abilityEffect, worldTime) ||
        scene.animating() ||
        tricks.animating(worldTime))
    );
  });
  keyboardState = createKeyboardInput(keys, {
    enabled: () =>
      !frozen &&
      !travelInProgress &&
      !fishingPhase &&
      (!activityBusy() ||
        waterRide.active() ||
        surfRide.active() ||
        skateRide.active() ||
        axolotlRace.active()),
    trace: new URLSearchParams(window.location.search).has("input"),
    onInteract: interact,
    onAbility: useAbility,
    onStop: () => {
      cancelAbility();
      stop("space-stop");
      requestDraw();
    },
    onChange: (immediate) => {
      dirty = true;
      loop.wake({
        immediate,
      });
    },
  });
  function blur() {
    stop("blur");
    requestDraw();
  }
  function visibility() {
    stop("visibility");
    if (document.hidden) loop.sleep();
    else requestDraw();
  }
  function navigate(e, running = false, previousTarget = null) {
    if (skySalute.active()) return;
    if (
      frozen ||
      loading ||
      travelInProgress ||
      fishingPhase ||
      (activityBusy() && !manualCraft()) ||
      abilityLocksMovement(abilityEffect, worldTime) ||
      e.button !== 0
    )
      return;
    scene.canvas.focus?.({
      preventScroll: true,
    });
    let target = previousTarget || scene.hit(e.clientX, e.clientY);
    if (rest.active()) position = rest.stop();
    if (manualCraft()) {
      keyboardState?.clear("jet-navigation");
      const accepted = skateRide.manual()
        ? skateRide.steer(target)
        : surfRide.manual()
          ? surfRide.steer(target)
          : waterRide.steer(target);
      requestDraw();
      return accepted ? target : null;
    }
    if (!room) {
      const door = buildings.find(
        (b) =>
          Math.abs(target.x - b.x) < 1 &&
          target.z > b.z + 0.5 &&
          target.z < b.z + 4.3,
      );
      if (door) target = doorApproach(door);
    }
    if (
      canStand(
        target.x,
        target.z,
        room ? roomObstacles : obstacles,
        !!room,
        surfing,
      )
    ) {
      pathRunning = running || e.shiftKey || keys.has("shift");
      keyboardState?.clear("pointer-navigation");
      path = findPath(
        position,
        target,
        room ? roomObstacles : obstacles,
        !!room,
        surfing,
      );
      requestDraw();
      return target;
    }
    return null;
  }
  const resize = () => {
    scene.resize(state());
    requestDraw();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", visibility);
  pointerInput = createPointerInput(scene.canvas, {
    enabled: () =>
      !frozen &&
      !loading &&
      !travelInProgress &&
      !fishingPhase &&
      (!activityBusy() || manualCraft()) &&
      !abilityLocksMovement(abilityEffect, worldTime),
    onTap: navigate,
    onZoom: (delta) => {
      scene.setZoom(delta, state());
      requestDraw();
    },
    onPinch: () => {
      keyboardState?.clear("pinch");
      path = [];
      pathRunning = false;
      moving = false;
      requestDraw();
    },
  });
  const wheel = (e) => {
    if (e.shiftKey) {
      e.preventDefault();
      scene.setZoom(-e.deltaY / 500, state());
      requestDraw();
    }
  };
  scene.canvas.addEventListener("wheel", wheel, {
    passive: false,
  });
  resize();
  publish();
  scene
    .loadTown()
    .then(() => {
      if (disposed) return;
      townReady = true;
      scene.canvas.focus?.({
        preventScroll: true,
      });
      loading = false;
      publish();
      requestDraw();
    })
    .catch((e) => {
      if (!disposed) callbacks.onError?.(e);
    });
  return {
    interact,
    walkToRide(id) {
      if (
        room ||
        frozen ||
        loading ||
        travelInProgress ||
        fishingPhase ||
        activityBusy() ||
        surfing
      )
        return false;
      const stopAt = rideStops.find((s) => s.id === id);
      if (!stopAt) return false;
      const route = findPath(position, stopAt, obstacles);
      if (
        !route.length &&
        Math.hypot(position.x - stopAt.x, position.z - stopAt.z) > 0.8
      )
        return false;
      stop();
      path = route;
      pathRunning = false;
      requestDraw();
      return true;
    },
    ability: useAbility,
    endRide() {
      if (skateRide.active()) {
        skateRide.return();
        stop();
        publish();
        requestDraw();
        return;
      }
      if (waterRide.active()) {
        waterRide.return(rideTime);
        stop();
        publish();
        requestDraw();
        return;
      }
      const origin = bikeRide.cancel();
      if (origin) position = { ...origin };
      stop();
      publish();
      requestDraw();
    },
    fish: startFishing,
    playDog(id, kind) {
      if (room || surfing || loading || travelInProgress) return false;
      const dog = worldAnimals().find((a) => a.id === id && a.kind === "dog");
      if (!dog) return false;
      stop();
      cancelFishing();
      cancelActivities();
      const started = dogPlay.start(id, kind, position, dog);
      if (started) {
        publish();
        requestDraw();
      }
      return started;
    },
    playDuck(id, kind) {
      if (room || loading || travelInProgress) return false;
      const flock = worldAnimals(),
        pair = id === "goose-pair" ? goosePair(flock) : null;
      const duck =
        pair?.members[0] ||
        flock.find((a) => a.id === id && a.kind === "duck" && !a.ambient);
      if (!duck) return false;
      stop();
      cancelFishing();
      cancelActivities();
      const started = duckPlay.start(
        id,
        kind,
        position,
        duck,
        surfing,
        pair?.members.slice(1),
      );
      if (started) {
        publish();
        requestDraw();
      }
      return started;
    },
    catchBug(id) {
      if (!bugSpecies.some((s) => s.id === id)) return false;
      if (!bugSpawns.catch(id, worldTime)) return false;
      bugCollection = saveTerrariums(addBug(bugCollection, id));
      callbacks.onCollection?.(bugCollection);
      publish();
      requestDraw();
      return true;
    },
    releaseFish(id) {
      if (!fishCollection[id]) return false;
      fishCollection = saveAquariums(removeFish(fishCollection, id));
      callbacks.onAquariums?.(fishCollection);
      publish();
      requestDraw();
      return true;
    },
    releaseBug(id) {
      if (!bugCollection[id]) return false;
      bugCollection = saveTerrariums(removeBug(bugCollection, id));
      callbacks.onCollection?.(bugCollection);
      publish();
      requestDraw();
    },
    setCharacter(id) {
      cancelFlight();
      const selection = characterSelection(id);
      if (!selection) return;
      npcRides.cancel(worldTime, selection.character);
      cancelFishing();
      cancelActivities();
      webs.clear();
      cancelAbility();
      stop();
      ++loadVersion;
      if (disposed) return;
      // All character sheets are loaded with the town; selection is immediate.
      character = selection.character;
      outfit = selection.outfit;
      loading = false;
      publish();
      requestDraw();
    },
    setAction(value) {
      action = value;
      requestDraw();
    },
    enter: changeRoom,
    freeze(value) {
      frozen = value;
      if (value && fishingPhase) {
        cancelFishing();
        publish();
      }
      if (!value)
        scene.canvas.focus?.({
          preventScroll: true,
        });
      stop();
      requestDraw();
    },
    stop() {
      cancelFishing();
      cancelAbility();
      if (!manualCraft()) cancelActivities();
      stop("touch-stop");
      publish();
      requestDraw();
    },
    setRunning(value) {
      touchRunning = !!value;
      if (path.length) pathRunning = touchRunning;
      dirty = true;
      loop.wake({ immediate: true });
    },
    control(key, down) {
      if (frozen || fishingPhase || (activityBusy() && !manualCraft())) return;
      if (down) {
        keys.add(key);
      } else keys.delete(key);
      loop.wake({
        immediate: down,
      });
    },
    travel(id) {
      if (!townReady) return;
      const target = travelTarget(id, room);
      if (!target) return;
      if (target.room && target.room === room) {
        callbacks.onEvent?.({
          type: "content",
          id: room,
        });
        return;
      }
      cancelFishing();
      cancelActivities();
      webs.clear();
      cancelAbility();
      stop();
      cancelFlight();
      const version = ++loadVersion;
      travelInProgress = true;
      scene.fly?.("out");
      publish();
      requestDraw();
      flightTimer = setTimeout(async () => {
        if (disposed || version !== loadVersion) return;
        scene.holdFade?.(true);
        requestDraw();
        try {
          if (target.room) await scene.loadRoom(target.room, character);
        } catch (error) {
          if (!disposed && version === loadVersion) {
            cancelFlight();
            callbacks.onError?.(error);
            requestDraw();
          }
          return;
        }
        if (disposed || version !== loadVersion) return;
        room = target.room;
        surfing = target.surfing;
        loading = false;
        position = {
          ...target.position,
        };
        direction = 0;
        if (room) {
          lastRoom = room;
          if (character === "masyn") outfit = room;
        }
        scene.snapCamera(position);
        scene.resize(state());
        scene.holdFade?.(false);
        scene.fly?.("in");
        publish();
        requestDraw();
        flightTimer = setTimeout(() => {
          if (disposed || version !== loadVersion) return;
          travelInProgress = false;
          scene.canvas.focus?.({
            preventScroll: true,
          });
          if (room) {
            callbacks.onVisit?.(room);
            callbacks.onEvent?.({
              type: "content",
              id: room,
            });
          }
          publish();
          requestDraw();
        }, flyArrivalMs);
      }, flyDepartureMs);
    },
    reset() {
      if (!townReady) return;
      cancelFlight();
      cancelFishing();
      cancelActivities();
      webs.clear();
      cancelAbility();
      ++loadVersion;
      room = null;
      surfing = false;
      loading = false;
      stop();
      position = {
        x: 0,
        z: 9,
      };
      scene.snapCamera(position);
      scene.resize(state());
      publish();
      requestDraw();
    },
    zoom(delta) {
      scene.setZoom(-delta / 15, state());
      publish();
      requestDraw();
    },
    startHunt(restart = false) {
      floatHunt.start(
        worldTime,
        (p) =>
          canStand(p.x, p.z, obstacles) &&
          !buildings.some(
            (b) => Math.abs(p.x - b.x) < 7 && p.z > b.z - 9 && p.z < b.z + 4.5,
          ) &&
          !beachStations.some(
            (site) => Math.hypot(p.x - site.x, p.z - site.z) < 2.4,
          ),
        restart,
      );
      publish();
      requestDraw();
    },
    dispose() {
      disposed = true;
      ++loadVersion;
      loop.dispose();
      observer.disconnect();
      clearTimeout(heartTimer);
      cancelFlight();
      cancelFishing();
      cancelActivities();
      webs.clear();
      cancelAbility();
      npcRides.cancel(worldTime);
      keyboardState.dispose();
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      pointerInput.dispose();
      scene.canvas.removeEventListener("wheel", wheel);
      scene.dispose();
    },
  };
}
