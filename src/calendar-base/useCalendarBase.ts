import { useState, useEvent, useHost, useMemo } from "atomico";
import { PlainDate, PlainYearMonth } from "../utils/temporal.js";
import { useDateProp, useDateFormatter } from "../utils/hooks.js";
import { clamp, toDate, getToday } from "../utils/date.js";

export type Pagination = "single" | "months";

type CalendarBaseOptions = {
  months: number;
  pageBy: Pagination;
  locale?: string;
  focusedDate: PlainDate | undefined;
  setFocusedDate: (date: PlainDate) => void;
};

const formatOptions = { year: "numeric" } as const;
const formatVerboseOptions = { year: "numeric", month: "long" } as const;

function diffInMonths(a: PlainYearMonth, b: PlainYearMonth): number {
  return (b.year - a.year) * 12 + b.month - a.month;
}

const createPage = (start: PlainYearMonth, months: number) => {
  start = months === 12 ? new PlainYearMonth(start.year, 1) : start;
  return {
    start,
    end: start.add({ months: months - 1 }),
  };
};

type UsePaginationOptions = {
  pageBy: Pagination;
  focusedDate: PlainDate;
  months: number;
  min?: PlainDate;
  max?: PlainDate;
  goto: (date: PlainDate) => void;
};

export interface CalendarFocusOptions extends FocusOptions {
  target?: "day" | "next" | "previous";
}

function usePagination({
  pageBy,
  focusedDate,
  months,
  max,
  min,
  goto,
}: UsePaginationOptions) {
  const step = pageBy === "single" ? 1 : months;

  // Track page start position as state, derive page from it
  const [pageStart, setPageStart] = useState(() =>
    focusedDate.toPlainYearMonth()
  );
  const page = useMemo(() => createPage(pageStart, months), [pageStart, months]);

  const contains = (date: PlainDate) => {
    const diff = diffInMonths(pageStart, date.toPlainYearMonth());
    return diff >= 0 && diff < months;
  };

  function clampToPage(date: PlainDate, pageStart: PlainYearMonth, pageEnd: PlainYearMonth): PlainDate {
    const focusedMonth = date.toPlainYearMonth();
    const startDiff = diffInMonths(focusedMonth, pageStart);
    const endDiff = diffInMonths(focusedMonth, pageEnd);

    // Clamp to page range
    if (startDiff > 0) {
      return date.add({ months: startDiff });
    } else if (endDiff < 0) {
      return date.add({ months: endDiff });
    }
    return date;
  }

  function updatePageBy(by: number) {
    const newPageStart = pageStart.add({ months: by });
    const newPage = createPage(newPageStart, months);
    setPageStart(newPageStart);

    // Clamp focused date to new page range
    const clampedDate = clampToPage(focusedDate, newPage.start, newPage.end);
    if (!focusedDate.equals(clampedDate)) {
      goto(clampedDate);
    }
  }

  // Wrap goto to also update page synchronously when focused date changes
  function gotoAndUpdatePage(date: PlainDate) {
    const focusedMonth = date.toPlainYearMonth();
    const diff = diffInMonths(pageStart, focusedMonth);

    // Update focused date first
    goto(date);

    // If new focused date is in current page, nothing more to do
    if (diff >= 0 && diff < months) {
      return;
    }

    // Compute new page start position to show the focused date
    let newPageStart: PlainYearMonth;
    if (diff === -1) {
      newPageStart = pageStart.add({ months: -step });
    } else if (diff === months) {
      newPageStart = pageStart.add({ months: step });
    } else {
      // Jump to focused date by moving in multiples of months
      newPageStart = pageStart.add({ months: Math.floor(diff / months) * months });
    }

    setPageStart(newPageStart);
  }

  return {
    page,
    goto: gotoAndUpdatePage,
    previous: !min || !contains(min) ? () => updatePageBy(-step) : undefined,
    next: !max || !contains(max) ? () => updatePageBy(step) : undefined,
  };
}

export function useCalendarBase({
  months,
  pageBy,
  locale,
  focusedDate: focusedDateProp,
  setFocusedDate,
}: CalendarBaseOptions) {
  const [min] = useDateProp("min");
  const [max] = useDateProp("max");
  const [today] = useDateProp("today");
  const dispatchFocusDay = useEvent<Date>("focusday");
  const dispatch = useEvent("change");

  const focusedDate = useMemo(
    () => clamp(focusedDateProp ?? today ?? getToday(), min, max),
    [focusedDateProp, today, min, max]
  );

  function gotoInternal(date: PlainDate) {
    setFocusedDate(date);
    dispatchFocusDay(toDate(date));
  }

  const { next, previous, page, goto } = usePagination({
    pageBy,
    focusedDate,
    months,
    min,
    max,
    goto: gotoInternal,
  });

  const host = useHost();
  function focus(options?: CalendarFocusOptions) {
    const target = options?.target ?? "day";
    if (target === "day") {
      host.current
        .querySelectorAll<HTMLElement>("calendar-month")
        .forEach((m) => m.focus(options));
    } else {
      host.current
        .shadowRoot!.querySelector<HTMLButtonElement>(`[part~='${target}']`)!
        .focus(options);
    }
  }

  return {
    format: useDateFormatter(formatOptions, locale),
    formatVerbose: useDateFormatter(formatVerboseOptions, locale),
    page,
    focusedDate,
    dispatch,
    onFocus(e: CustomEvent<PlainDate>) {
      e.stopPropagation();
      goto(e.detail);
      setTimeout(focus);
    },
    min,
    max,
    today,
    next,
    previous,
    focus,
  };
}
