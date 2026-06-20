GRAPH = {

    "EMPLOYEE": [
        "Loan Database"
    ],

    "VENDOR": [
        "Loan Database"
    ],

    "PRIVILEGED": [
        "Loan Database",
        "KYC Repository",
        "Treasury Database"
    ],

    "ADMIN": [
        "Loan Database",
        "KYC Repository",
        "Treasury Database",
        "SWIFT System"
    ]
}


RESOURCE_IMPACT = {

    "Loan Database": 60,

    "KYC Repository": 75,

    "Treasury Database": 90,

    "SWIFT System": 95
}


class AttackPathAgent:

    def analyze(self, role):

        resources = GRAPH.get(
            role,
            []
        )

        total_impact = 0

        for resource in resources:

            total_impact += RESOURCE_IMPACT[
                resource
            ]

        blast_radius = min(
            (total_impact / 320) * 100,
            100
        )

        lateral_movement_risk = (
            len(resources) * 20
        )

        return {

            "role": role,

            "reachable_resources":
                resources,

            "blast_radius":
                round(blast_radius, 2),

            "lateral_movement_risk":
                min(
                    lateral_movement_risk,
                    100
                )
        }