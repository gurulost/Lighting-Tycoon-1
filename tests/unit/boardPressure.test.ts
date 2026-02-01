import { countFreeSlots, getBoardPressureBand } from "@/lib/boardPressure";

const baseState = {
  boardSize: 6,
  board: [null, { id: "p1" }, null, null, null, null],
  stationSlots: [0],
  blockedSlots: [2],
  unlockedSlots: [],
};

describe("board pressure", () => {
  it("counts free slots excluding stations and locked slots", () => {
    expect(countFreeSlots(baseState)).toBe(3);
  });

  it("counts unlocked blocked slots", () => {
    const unlockedState = {
      ...baseState,
      unlockedSlots: [2],
    };

    expect(countFreeSlots(unlockedState)).toBe(4);
  });

  it("maps free slots to pressure bands", () => {
    expect(getBoardPressureBand(5)).toBe("green");
    expect(getBoardPressureBand(2)).toBe("yellow");
    expect(getBoardPressureBand(1)).toBe("red");
  });
});
