class TrustScorer:

    def calculate(
        self,
        behavioral_score,
        context_score,
        privilege_score,
        attack_score,
        trust_score
    ):

        final_risk = (

            behavioral_score * 0.25 +

            context_score * 0.20 +

            privilege_score * 0.25 +

            attack_score * 0.15 +

            (100 - trust_score) * 0.15
        )

        final_risk = round(
            min(final_risk, 100),
            2
        )

        if final_risk < 30:

            level = "LOW"

        elif final_risk < 60:

            level = "MEDIUM"

        elif final_risk < 80:

            level = "HIGH"

        else:

            level = "CRITICAL"

        return {

            "risk_score":
                final_risk,

            "risk_level":
                level
        }