from datetime import datetime


class TrustPassport:

    def issue(
        self,
        username,
        trust_score,
        risk_level,
        behavioral_confidence,
        ticket_authorized
    ):

        device_trust = (
            "LOW"
            if trust_score < 50
            else "HIGH"
        )

        return {

            "identity": username,

            "trust_score": trust_score,

            "risk_level": risk_level,

            "device_trust": device_trust,

            "behavioral_confidence":
                behavioral_confidence,

            "ticket_authorized":
                ticket_authorized,

            "issued_at":
                datetime.utcnow().isoformat()
        }