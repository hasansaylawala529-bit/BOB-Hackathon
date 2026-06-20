from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

load_dotenv()

driver = GraphDatabase.driver(
    os.getenv("NEO4J_URI"),
    auth=(
        os.getenv("NEO4J_USER"),
        os.getenv("NEO4J_PASSWORD")
    )
)


def get_reachable_resources(role):

    query = """
    MATCH (r:Role {name:$role})
    -[:CAN_ACCESS]->
    (resource:Resource)

    RETURN DISTINCT resource.name AS resource
    """

    with driver.session() as session:

        result = session.run(
            query,
            role=role
        )

        return [
            record["resource"]
            for record in result
        ]