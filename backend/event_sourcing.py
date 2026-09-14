"""Event sourcing reducer, state reconstruction, and temporal replay machine.

Pure reducer function f(State, Event) -> State guarantees bit-identical snapshot
reconstruction at any historical sequence milestone without mutating the active database head.
"""

from __future__ import annotations

import copy
import hashlib
import json
from typing import Any, Dict, List, Optional, Tuple


def calculate_state_checksum(state: Dict[str, Any]) -> str:
    """Compute deterministic SHA-256 checksum over state dictionary."""
    canonical_json = json.dumps(state, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()


def apply_profile_event(
    current_state: Dict[str, Any],
    event_type: str,
    delta: Dict[str, Any],
) -> Dict[str, Any]:
    """Pure functional state transition without side effects.
    
    Given prior state S_{k-1} and event E_k = (event_type, delta),
    computes new state S_k.
    """
    next_state = copy.deepcopy(current_state)

    if event_type in ("ProfileInitialized", "ProfileCreated"):
        return copy.deepcopy(delta)

    if event_type in ("IncomeAdjusted", "ExpenseAdjusted", "AssetAllocationChanged", "GoalToggled"):
        for key, value in delta.items():
            next_state[key] = copy.deepcopy(value)

    elif event_type == "ChildAdded":
        next_state["num_children"] = next_state.get("num_children", 0) + 1
        next_state["children_under_25"] = next_state.get("children_under_25", 0) + 1
        if "child_age" in delta:
            next_state["youngest_dependent_age"] = delta["child_age"]
        for key, value in delta.items():
            if key not in ("num_children", "children_under_25"):
                next_state[key] = copy.deepcopy(value)

    elif event_type == "PropertyPurchased":
        next_state["has_property"] = True
        next_state["property_price"] = delta.get("property_price", next_state.get("property_price", 350000.0))
        next_state["property_down_payment"] = delta.get("property_down_payment", delta.get("down_payment", next_state.get("property_down_payment", 70000.0)))
        next_state["mortgage_rate"] = delta.get("mortgage_rate", next_state.get("mortgage_rate", 0.038))
        for key, value in delta.items():
            next_state[key] = copy.deepcopy(value)

    else:
        # Forward compatibility: merge delta fields safely
        for key, value in delta.items():
            next_state[key] = copy.deepcopy(value)

    return next_state


def replay_profile_events(
    events: List[Any],
    target_sequence: Optional[int] = None,
) -> Dict[str, Any]:
    """Deterministically reconstruct state from sequence of profile events.
    
    Accepts list of ProfileEvent models or event dicts.
    """
    state: Dict[str, Any] = {}

    def _get_seq(ev: Any) -> int:
        return getattr(ev, "sequence_number", None) or ev.get("sequence_number", 0)

    def _get_type(ev: Any) -> str:
        return getattr(ev, "event_type", None) or ev.get("event_type", "Unknown")

    def _get_delta(ev: Any) -> Dict[str, Any]:
        d = getattr(ev, "delta_payload", None)
        if d is None and isinstance(ev, dict):
            d = ev.get("delta_payload", {})
        return d or {}

    sorted_events = sorted(events, key=_get_seq)

    for ev in sorted_events:
        seq = _get_seq(ev)
        if target_sequence is not None and seq > target_sequence:
            break
        ev_type = _get_type(ev)
        delta = _get_delta(ev)
        state = apply_profile_event(state, ev_type, delta)

    return state


def infer_event_type_and_delta(
    old_state: Dict[str, Any],
    new_state: Dict[str, Any],
) -> Tuple[str, Dict[str, Any]]:
    """Compare old and new profile states to infer semantic event type and delta payload."""
    delta: Dict[str, Any] = {}

    for key, new_val in new_state.items():
        if key not in old_state or old_state[key] != new_val:
            delta[key] = new_val

    if not old_state:
        return "ProfileInitialized", new_state

    # Semantic event classification
    if "num_children" in delta and delta["num_children"] > old_state.get("num_children", 0):
        return "ChildAdded", delta

    if "has_property" in delta and delta["has_property"] is True and not old_state.get("has_property"):
        return "PropertyPurchased", delta

    if any(k in delta for k in ("income", "income_growth_rate", "tax_class", "employment_status")):
        return "IncomeAdjusted", delta

    if any(k in delta for k in ("living_expenses", "monthly_investment", "current_savings", "debt_amount")):
        return "ExpenseAdjusted", delta

    if any(k in delta for k in ("risk_tolerance", "investment_strategy", "asset_weights")):
        return "AssetAllocationChanged", delta

    if any(k in delta for k in ("retirement_age", "target_replacement_ratio", "longevity_age")):
        return "GoalToggled", delta

    return "ProfileUpdated", delta
