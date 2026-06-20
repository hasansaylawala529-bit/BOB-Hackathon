OPEN_TICKETS = {

    "john_priv": [
        "Loan Database"
    ],

    "ameya_admin": [
        "Treasury Database",
        "SWIFT System"
    ]
}


class TicketCorrelator:

    def analyze(
        self,
        username,
        resource
    ):

        approved_resources = (
            OPEN_TICKETS.get(
                username,
                []
            )
        )

        authorized = (
            resource
            in approved_resources
        )

        if authorized:

            return {
                "ticket_authorized": True,
                "risk_penalty": 0,
                "reason":
                    "Valid ticket found"
            }

        return {
            "ticket_authorized": False,
            "risk_penalty": 40,
            "reason":
                "No matching ticket found"
        }