from engines.digital_identity_twin import DigitalIdentityTwin


class BehavioralProfiler:

    def __init__(self):

        self.twin_engine = DigitalIdentityTwin()

    def calculate_z_score(
        self,
        actual,
        baseline
    ):

        std_dev = baseline * 0.2

        if std_dev == 0:
            return 0

        return abs(
            (actual - baseline)
            / std_dev
        )

    def analyze(
        self,
        username,
        keystroke_dwell,
        keystroke_flight,
        mouse_speed,
        scroll_speed
    ):

        twin = self.twin_engine.predict(
            username
        )

        baseline = twin["baseline"]

        dwell_z = self.calculate_z_score(
            keystroke_dwell,
            baseline["keystroke_dwell_mean"]
        )

        flight_z = self.calculate_z_score(
            keystroke_flight,
            baseline["keystroke_flight_mean"]
        )

        mouse_z = self.calculate_z_score(
            mouse_speed,
            baseline["mouse_speed_mean"]
        )

        scroll_z = self.calculate_z_score(
            scroll_speed,
            baseline["scroll_speed_mean"]
        )

        avg_z = (
            dwell_z +
            flight_z +
            mouse_z +
            scroll_z
        ) / 4

        anomaly_score = min(
            avg_z * 25,
            100
        )

        return {
            "anomaly_score":
                round(anomaly_score, 2),

            "confidence":
                0.90,

            "deviations": {
                "dwell_z": round(dwell_z, 2),
                "flight_z": round(flight_z, 2),
                "mouse_z": round(mouse_z, 2),
                "scroll_z": round(scroll_z, 2)
            }
        }