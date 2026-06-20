class ThreatContainmentEngine:

    def execute(
        self,
        risk_score
    ):

        actions = []

        if risk_score < 30:

            actions.append(
                "Allow Session"
            )

        elif risk_score < 60:

            actions.extend([
                "Require MFA",
                "Increase Monitoring"
            ])

        elif risk_score < 80:

            actions.extend([
                "Restrict Data Export",
                "Mask Sensitive Data",
                "Require Manager Approval"
            ])

        else:

            actions.extend([
                "Quarantine Session",
                "Terminate Active Tokens",
                "Disable Exports",
                "Capture Forensic Evidence",
                "Notify SOC Team"
            ])

        return {
            "containment_actions":
                actions
        }