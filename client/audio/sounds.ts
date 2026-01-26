export type SfxId =
  | "spawn"
  | "merge_1"
  | "merge_2"
  | "merge_3"
  | "merge_4"
  | "merge_5"
  | "order_complete"
  | "upgrade"
  | "error"
  | "baron_offer"
  | "baron_accept"
  | "baron_decline"
  | "lockout"
  | "recycle"
  | "backpack"
  | "rd_unlock"
  | "rd_craft";

export const SFX: Record<
  SfxId,
  { file: number; volume: number; cooldownMs?: number; rateRange?: [number, number] }
> = {
  spawn: {
    file: require("../../assets/sounds/spawn.wav"),
    volume: 0.35,
    cooldownMs: 80,
    rateRange: [0.98, 1.02],
  },
  merge_1: {
    file: require("../../assets/sounds/merge_1.wav"),
    volume: 0.4,
    cooldownMs: 60,
    rateRange: [0.98, 1.03],
  },
  merge_2: {
    file: require("../../assets/sounds/merge_2.wav"),
    volume: 0.42,
    cooldownMs: 60,
    rateRange: [0.98, 1.03],
  },
  merge_3: {
    file: require("../../assets/sounds/merge_3.wav"),
    volume: 0.45,
    cooldownMs: 60,
    rateRange: [0.98, 1.03],
  },
  merge_4: {
    file: require("../../assets/sounds/merge_4.wav"),
    volume: 0.48,
    cooldownMs: 70,
    rateRange: [0.98, 1.03],
  },
  merge_5: {
    file: require("../../assets/sounds/merge_5.wav"),
    volume: 0.52,
    cooldownMs: 90,
    rateRange: [0.98, 1.03],
  },
  order_complete: {
    file: require("../../assets/sounds/order_complete.wav"),
    volume: 0.5,
    cooldownMs: 120,
    rateRange: [0.99, 1.01],
  },
  upgrade: {
    file: require("../../assets/sounds/upgrade.wav"),
    volume: 0.5,
    cooldownMs: 150,
  },
  error: {
    file: require("../../assets/sounds/error.wav"),
    volume: 0.38,
    cooldownMs: 160,
  },
  baron_offer: {
    file: require("../../assets/sounds/baron_offer.wav"),
    volume: 0.45,
    cooldownMs: 300,
  },
  baron_accept: {
    file: require("../../assets/sounds/baron_accept.wav"),
    volume: 0.5,
    cooldownMs: 200,
  },
  baron_decline: {
    file: require("../../assets/sounds/baron_decline.wav"),
    volume: 0.45,
    cooldownMs: 200,
  },
  lockout: {
    file: require("../../assets/sounds/lockout.wav"),
    volume: 0.48,
    cooldownMs: 400,
  },
  recycle: {
    file: require("../../assets/sounds/recycle.wav"),
    volume: 0.4,
    cooldownMs: 120,
    rateRange: [0.98, 1.02],
  },
  backpack: {
    file: require("../../assets/sounds/backpack.wav"),
    volume: 0.35,
    cooldownMs: 100,
    rateRange: [0.98, 1.02],
  },
  rd_unlock: {
    file: require("../../assets/sounds/rd_unlock.wav"),
    volume: 0.45,
    cooldownMs: 150,
  },
  rd_craft: {
    file: require("../../assets/sounds/rd_craft.wav"),
    volume: 0.5,
    cooldownMs: 200,
  },
};
