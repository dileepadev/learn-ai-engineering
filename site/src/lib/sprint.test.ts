import { describe, expect, it } from "vitest";
import { addDays, daysBetween, effortHours, planSprint, toLocalDate, type PhaseLoad } from "./sprint.ts";

const phase = (slug: string, effort: number, doneFraction = 0): PhaseLoad => ({
  slug,
  title: slug,
  effortHours: effort,
  doneFraction,
});

describe("calendar arithmetic", () => {
  it("counts whole days, across month and year ends", () => {
    expect(daysBetween("2026-11-04", "2026-12-31")).toBe(57);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
  });

  it("reads a Date as the viewer's local calendar day", () => {
    expect(toLocalDate(new Date(2026, 10, 4, 23, 59))).toBe("2026-11-04");
  });
});

describe("effortHours", () => {
  it("takes the midpoint of a range and the floor of an open one", () => {
    expect(effortHours("~25–40 hours.")).toBe(32.5);
    expect(effortHours("~30–50 hours if Python is new territory; a fraction of that as a refresher.")).toBe(40);
    expect(effortHours("40+ hours. Scope it like a product.")).toBe(40);
  });

  it("falls back rather than failing on a reworded line", () => {
    expect(effortHours(undefined)).toBe(30);
    expect(effortHours("as long as it takes", 12)).toBe(12);
  });
});

describe("planSprint", () => {
  const base = { today: "2026-11-04", deadline: "2026-12-31" };

  it("counts today and the deadline day as days left", () => {
    const plan = planSprint({ ...base, phases: [phase("a", 10)], hoursPerWeek: null });
    expect(plan.daysLeft).toBe(58);
  });

  it("shares the remaining days out in proportion to hours left, ending on the deadline", () => {
    const plan = planSprint({ ...base, phases: [phase("a", 10), phase("b", 30)], hoursPerWeek: null });
    expect(plan.hoursLeft).toBe(40);
    expect(plan.phases.map((p) => p.finishBy)).toEqual(["2026-11-18", "2026-12-31"]);
    expect(plan.phases.map((p) => p.state)).toEqual(["current", "upcoming"]);
    expect(plan.hoursPerWeekNeeded).toBeCloseTo((40 * 7) / 58);
  });

  it("drops finished work from the plan, so testing out moves every date", () => {
    const plan = planSprint({
      ...base,
      phases: [phase("a", 10, 1), phase("b", 30, 0.5)],
      hoursPerWeek: null,
    });
    expect(plan.hoursLeft).toBe(15);
    expect(plan.phases[0]).toMatchObject({ state: "done", finishBy: null, hoursLeft: 0 });
    expect(plan.phases[1]).toMatchObject({ state: "current", finishBy: "2026-12-31" });
  });

  it("says on track when the learner's hours finish in time", () => {
    const plan = planSprint({ ...base, phases: [phase("a", 40)], hoursPerWeek: 10 });
    expect(plan.projectedFinish).toBe("2026-12-01");
    expect(plan.daysToSpare).toBe(30);
    expect(plan.pace).toBe("on-track");
  });

  it("says behind, with how late, when they do not", () => {
    const plan = planSprint({ ...base, phases: [phase("a", 40)], hoursPerWeek: 4 });
    expect(plan.projectedFinish).toBe("2027-01-12");
    expect(plan.daysToSpare).toBe(-12);
    expect(plan.pace).toBe("behind");
  });

  it("asks for hours before judging pace", () => {
    expect(planSprint({ ...base, phases: [phase("a", 40)], hoursPerWeek: null }).pace).toBe("unknown");
  });

  it("reports done when everything is ticked", () => {
    const plan = planSprint({ ...base, phases: [phase("a", 40, 1)], hoursPerWeek: 10 });
    expect(plan).toMatchObject({ pace: "done", hoursLeft: 0, projectedFinish: null });
  });

  it("closes the window after the deadline", () => {
    const plan = planSprint({
      today: "2027-01-02",
      deadline: "2026-12-31",
      phases: [phase("a", 40)],
      hoursPerWeek: 10,
    });
    expect(plan).toMatchObject({ daysLeft: 0, hoursPerWeekNeeded: null, pace: "over" });
    expect(plan.phases[0]?.finishBy).toBeNull();
  });

  it("treats nonsense progress as zero rather than producing NaN dates", () => {
    const plan = planSprint({ ...base, phases: [phase("a", 10, Number.NaN)], hoursPerWeek: null });
    expect(plan.hoursLeft).toBe(10);
    expect(plan.phases[0]?.finishBy).toBe("2026-12-31");
  });
});
