from typing import TypedDict

from langgraph.graph import StateGraph, END

from agents.behavioral_profiler import BehavioralProfiler
from agents.contextualizer import Contextualizer
from agents.privilege_auditor import PrivilegeAuditor
from agents.ticket_correlator import TicketCorrelator
from agents.attack_path_agent import AttackPathAgent
from agents.trust_scorer import TrustScorer
from agents.response_agent import ResponseAgent
from agents.threat_containment import ThreatContainmentEngine

from engines.continuous_trust_engine import ContinuousTrustEngine
from engines.trust_passport import TrustPassport


class AgentState(TypedDict):

    payload: dict

    behavior: dict
    context: dict
    privilege: dict
    ticket: dict
    attack: dict

    trust: float

    risk: dict

    response: dict

    containment: dict

    passport: dict


# =====================================================
# INITIALIZE AGENTS
# =====================================================

behavior_agent = BehavioralProfiler()

context_agent = Contextualizer()

privilege_agent = PrivilegeAuditor()

ticket_agent = TicketCorrelator()

attack_agent = AttackPathAgent()

trust_engine = ContinuousTrustEngine()

trust_scorer = TrustScorer()

response_agent = ResponseAgent()

containment_engine = ThreatContainmentEngine()

passport_engine = TrustPassport()


# =====================================================
# BEHAVIOR NODE
# =====================================================

def behavior_node(state):

    payload = state["payload"]

    state["behavior"] = behavior_agent.analyze(
        username=payload["username"],
        keystroke_dwell=payload["keystroke_dwell"],
        keystroke_flight=payload["keystroke_flight"],
        mouse_speed=payload["mouse_speed"],
        scroll_speed=payload["scroll_speed"]
    )

    return state


# =====================================================
# CONTEXT NODE
# =====================================================

def context_node(state):

    payload = state["payload"]

    state["context"] = context_agent.analyze(
        username=payload["username"],
        device_known=payload["device_known"],
        city=payload["city"],
        country=payload["country"]
    )

    return state


# =====================================================
# PRIVILEGE NODE
# =====================================================

def privilege_node(state):

    payload = state["payload"]

    state["privilege"] = privilege_agent.analyze(
        resource=payload["resource"],
        query_type=payload["query_type"]
    )

    return state


# =====================================================
# TICKET NODE
# =====================================================

def ticket_node(state):

    payload = state["payload"]

    state["ticket"] = ticket_agent.analyze(
        username=payload["username"],
        resource=payload["resource"]
    )

    return state


# =====================================================
# ATTACK GRAPH NODE
# =====================================================

def attack_node(state):

    payload = state["payload"]

    state["attack"] = attack_agent.analyze(
        role=payload["role"]
    )

    return state


# =====================================================
# TRUST DECAY NODE
# =====================================================

def trust_node(state):

    payload = state["payload"]

    state["trust"] = trust_engine.calculate_trust_decay(
        initial_trust=100,
        hours_since_verification=
            payload["hours_since_verification"]
    )

    return state


# =====================================================
# TRUST SCORER NODE
# =====================================================

def risk_node(state):

    ticket_penalty = 0

    if not state["ticket"]["ticket_authorized"]:
        ticket_penalty = state["ticket"]["risk_penalty"]

    state["risk"] = trust_scorer.calculate(

        behavioral_score=
            state["behavior"]["anomaly_score"],

        context_score=
            state["context"]["context_risk_score"],

        privilege_score=
            state["privilege"]["privilege_risk_score"],

        attack_score=
            state["attack"]["blast_radius"],

        trust_score=
            state["trust"],

        ticket_penalty=
            ticket_penalty

    )

    state["risk"]["risk_score"] += (
        ticket_penalty * 0.15
    )

    if state["risk"]["risk_score"] > 100:
        state["risk"]["risk_score"] = 100

    return state


# =====================================================
# RESPONSE NODE
# =====================================================

def response_node(state):

    state["response"] = response_agent.decide(
        state["risk"]["risk_score"]
    )

    return state


# =====================================================
# THREAT CONTAINMENT NODE
# =====================================================

def containment_node(state):

    state["containment"] = (
        containment_engine.execute(
            state["risk"]["risk_score"]
        )
    )

    return state


# =====================================================
# TRUST PASSPORT NODE
# =====================================================

def passport_node(state):

    state["passport"] = (
        passport_engine.issue(

            username=
                state["payload"]["username"],

            trust_score=
                state["trust"],

            risk_level=
                state["risk"]["risk_level"],

            behavioral_confidence=
                state["behavior"]["confidence"],

            ticket_authorized=
                state["ticket"]["ticket_authorized"]
        )
    )

    return state


# =====================================================
# LANGGRAPH
# =====================================================

workflow = StateGraph(AgentState)

workflow.add_node("behavior", behavior_node)

workflow.add_node("context", context_node)

workflow.add_node("privilege", privilege_node)

workflow.add_node("ticket", ticket_node)

workflow.add_node("attack", attack_node)

workflow.add_node("trust", trust_node)

workflow.add_node("risk", risk_node)

workflow.add_node("response", response_node)

workflow.add_node("containment", containment_node)

workflow.add_node("passport", passport_node)


workflow.set_entry_point("behavior")

workflow.add_edge("behavior", "context")

workflow.add_edge("context", "privilege")

workflow.add_edge("privilege", "ticket")

workflow.add_edge("ticket", "attack")

workflow.add_edge("attack", "trust")

workflow.add_edge("trust", "risk")

workflow.add_edge("risk", "response")

workflow.add_edge("response", "containment")

workflow.add_edge("containment", "passport")

workflow.add_edge("passport", END)


graph = workflow.compile()