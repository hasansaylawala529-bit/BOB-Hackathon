import math


class ContinuousTrustEngine:

    def calculate_trust_decay(
        self,
        initial_trust,
        hours_since_verification,
        decay_rate=0.02
    ):

        current_trust = (
            initial_trust *
            math.exp(
                -decay_rate *
                hours_since_verification
            )
        )

        return round(
            current_trust,
            2
        )

    def update_trust(
        self,
        previous_trust,
        observed_trust
    ):

        alpha = 0.3

        updated = (
            alpha *
            observed_trust
        ) + (
            (1 - alpha) *
            previous_trust
        )

        return round(
            updated,
            2
        )