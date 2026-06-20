import json
from pathlib import Path


class DigitalIdentityTwin:

    def __init__(self):

        self.twins = self.load_twins()

    def load_twins(self):

        from pathlib import Path

        current_file = Path(__file__).resolve()

        project_root = current_file.parent.parent.parent

        twin_path = (
            project_root /
            "databases" /
            "mongodb" /
            "digital_twins.json"
        )

        with open(twin_path, "r") as f:
            return json.load(f)

    def get_twin(self, username):

        return self.twins.get(username)

    def predict(self, username):

        twin = self.get_twin(username)

        if not twin:
            return None

        return {
            "expected_hours":
                twin["expected_hours"],

            "expected_resources":
                twin["expected_resources"],

            "typical_db_queries":
                twin["typical_db_queries"],

            "baseline":
                twin["biometric_baseline"]
        }