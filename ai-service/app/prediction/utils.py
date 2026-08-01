"""Shared numeric helpers for rule-based prediction engines."""

from __future__ import annotations

from statistics import mean

from app.prediction.schemas.common import TimedValue


def latest(series: list[TimedValue]) -> float | None:
    if not series:
        return None
    return series[-1].value


def series_values(series: list[TimedValue]) -> list[float]:
    return [p.value for p in series]


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def trend_direction(values: list[float], *, epsilon: float = 0.0) -> str:
    """Return increasing | decreasing | stable | insufficient."""
    if len(values) < 2:
        return "insufficient"
    mid = len(values) // 2
    first = mean(values[: max(1, mid)])
    second = mean(values[mid:])
    delta = second - first
    threshold = epsilon if epsilon > 0 else max(0.5, abs(first) * 0.03)
    if delta > threshold:
        return "increasing"
    if delta < -threshold:
        return "decreasing"
    return "stable"


def consecutive_rising(values: list[float], *, min_days: int = 3) -> int:
    if len(values) < 2:
        return 0
    streak = 0
    for i in range(1, len(values)):
        if values[i] > values[i - 1]:
            streak += 1
        else:
            streak = 0
    return streak if streak >= min_days - 1 else streak


def score_from_range(
    value: float | None,
    *,
    ideal_low: float,
    ideal_high: float,
    warn_low: float,
    warn_high: float,
) -> float:
    """Map a clinical value into 0–100 contribution score (higher better)."""
    if value is None:
        return 55.0
    if ideal_low <= value <= ideal_high:
        return 95.0
    if warn_low <= value < ideal_low:
        span = max(ideal_low - warn_low, 1e-6)
        return 70.0 + 25.0 * (value - warn_low) / span
    if ideal_high < value <= warn_high:
        span = max(warn_high - ideal_high, 1e-6)
        return 95.0 - 25.0 * (value - ideal_high) / span
    if value < warn_low:
        return clamp(40.0 - (warn_low - value), 5, 40)
    return clamp(40.0 - (value - warn_high), 5, 40)


def inverse_pain_score(pain: float | None) -> float:
    if pain is None:
        return 70.0
    return clamp(100.0 - pain * 10.0)


def pct_or_default(value: float | None, default: float = 60.0) -> float:
    return default if value is None else clamp(value)
