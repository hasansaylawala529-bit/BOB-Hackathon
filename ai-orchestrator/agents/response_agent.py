class ResponseAgent:

    def decide(
        self,
        risk_score
    ):

        if risk_score < 30:

            return {
                "action": "ALLOW"
            }

        elif risk_score < 60:

            return {
                "action": "STEP_UP_AUTH"
            }

        elif risk_score < 80:

            return {
                "action": "RESTRICT"
            }

        else:

            return {
                "action": "QUARANTINE"
            }
        