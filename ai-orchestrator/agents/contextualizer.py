from datetime import datetime
from engines.digital_identity_twin import DigitalIdentityTwin


class Contextualizer:

    def __init__(self):

        self.twin_engine = DigitalIdentityTwin()

    def analyze(
        self,
        username,
        device_known,
        city,
        country
    ):

        risk = 0
        factors = []

        twin = self.twin_engine.get_twin(
            username
        )

        current_hour = datetime.now().hour

        if not device_known:

            risk += 40

            factors.append(
                "Unknown device"
            )

        if city not in [
            "Mumbai",
            "Pune"
        ]:

            risk += 20

            factors.append(
                "New city"
            )

        if country != "India":

            risk += 50

            factors.append(
                "Foreign country"
            )

        if current_hour not in twin[
            "expected_hours"
        ]:

            risk += 30

            factors.append(
                "Outside expected work hours"
            )

        return {
            "context_risk_score":
                min(risk,100),

            "risk_factors":
                factors
        }