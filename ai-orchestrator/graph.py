from agents.behavioral_profiler import BehavioralProfiler
from agents.contextualizer import Contextualizer
from agents.privilege_auditor import PrivilegeAuditor
from agents.attack_path_agent import AttackPathAgent
from agents.trust_scorer import TrustScorer
from agents.response_agent import ResponseAgent
from engines.continuous_trust_engine import ContinuousTrustEngine
from agents.ticket_correlator import TicketCorrelator
from agents.threat_containment import ThreatContainmentEngine
from engines.trust_passport import TrustPassport

class MAOIROrchestrator:

    def __init__(self):

        self.behavior_agent = BehavioralProfiler()

        self.context_agent = Contextualizer()

        self.privilege_agent = PrivilegeAuditor()

        self.attack_agent = AttackPathAgent()

        self.trust_engine = ContinuousTrustEngine()

        self.scorer = TrustScorer()

        self.response_agent = ResponseAgent()

        self.ticket_agent = TicketCorrelator()

        self.containment_engine =ThreatContainmentEngine()

        self.passport_engine =TrustPassport()

    def investigate(self, payload):

        behavior = self.behavior_agent.analyze(
            username=payload["username"],
            keystroke_dwell=payload["keystroke_dwell"],
            keystroke_flight=payload["keystroke_flight"],
            mouse_speed=payload["mouse_speed"],
            scroll_speed=payload["scroll_speed"]
        )

        context = self.context_agent.analyze(
            username=payload["username"],
            device_known=payload["device_known"],
            city=payload["city"],
            country=payload["country"]
        )

        privilege = self.privilege_agent.analyze(
            resource=payload["resource"],
            query_type=payload["query_type"]
        )

        ticket = self.ticket_agent.analyze(
            username=payload["username"],
            resource=payload["resource"]
        )

        attack = self.attack_agent.analyze(
            role=payload["role"]
        )

        trust = self.trust_engine.calculate_trust_decay(
            initial_trust=100,
            hours_since_verification=
                payload["hours_since_verification"]
        )

        score = self.scorer.calculate(

            behavioral_score=
                behavior["anomaly_score"],

            context_score=
                context["context_risk_score"],

            privilege_score=
                privilege["privilege_risk_score"],

            attack_score=
                attack["blast_radius"],

            trust_score=
                trust,

            ticket_penalty=
                ticket["risk_penalty"]
        )

        response = self.response_agent.decide(
            score["risk_score"]
        )

        containment = (
            self.containment_engine.execute(
                score["risk_score"]
            )
        )

        passport = self.passport_engine.issue(

                username=payload["username"],

                trust_score=trust,

                risk_level=
                    score["risk_level"],

                behavioral_confidence=
                    behavior["confidence"],

                ticket_authorized=
                    ticket["ticket_authorized"]
            )

        reasons = []

        for factor in context["risk_factors"]:

            reasons.append(
                factor
            )

        if not ticket["ticket_authorized"]:

            reasons.append(
                "Access not linked to approved ticket"
            )

        if privilege["banking_impact"] >= 90:

            reasons.append(
                "High-value banking asset accessed"
            )

        if attack["blast_radius"] >= 60:

            reasons.append(
                "High blast radius identity"
            )

        if trust < 40:

            reasons.append(
                "Trust decay threshold exceeded"
            )

        return {

            "behavior": behavior,

            "context": context,

            "privilege": privilege,

            "attack": attack,

            "trust": trust,

            "risk": score,

            "response": response,

            "reasons": reasons,

            "ticket": ticket,

            "trust_passport": passport,

            "containment": containment

        }