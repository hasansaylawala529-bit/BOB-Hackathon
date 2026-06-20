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

queries = [

    # Users
    """
    MERGE (:User {name:'john_priv'})
    """,

    """
    MERGE (:User {name:'ameya_admin'})
    """,

    # Roles
    """
    MERGE (:Role {name:'PRIVILEGED'})
    """,

    """
    MERGE (:Role {name:'ADMIN'})
    """,

    # Resources
    """
    MERGE (:Resource {name:'Loan Database'})
    """,

    """
    MERGE (:Resource {name:'KYC Repository'})
    """,

    """
    MERGE (:Resource {name:'Treasury Database'})
    """,

    """
    MERGE (:Resource {name:'SWIFT System'})
    """,

    # User → Role relationships
    """
    MATCH (u:User {name:'john_priv'})
    MATCH (r:Role {name:'PRIVILEGED'})
    MERGE (u)-[:HAS_ROLE]->(r)
    """,

    """
    MATCH (u:User {name:'ameya_admin'})
    MATCH (r:Role {name:'ADMIN'})
    MERGE (u)-[:HAS_ROLE]->(r)
    """,

    # PRIVILEGED permissions
    """
    MATCH (r:Role {name:'PRIVILEGED'})
    MATCH (db:Resource {name:'Loan Database'})
    MERGE (r)-[:CAN_ACCESS]->(db)
    """,

    """
    MATCH (r:Role {name:'PRIVILEGED'})
    MATCH (db:Resource {name:'KYC Repository'})
    MERGE (r)-[:CAN_ACCESS]->(db)
    """,

    """
    MATCH (r:Role {name:'PRIVILEGED'})
    MATCH (db:Resource {name:'Treasury Database'})
    MERGE (r)-[:CAN_ACCESS]->(db)
    """,

    # ADMIN permissions
    """
    MATCH (r:Role {name:'ADMIN'})
    MATCH (db:Resource {name:'Loan Database'})
    MERGE (r)-[:CAN_ACCESS]->(db)
    """,

    """
    MATCH (r:Role {name:'ADMIN'})
    MATCH (db:Resource {name:'KYC Repository'})
    MERGE (r)-[:CAN_ACCESS]->(db)
    """,

    """
    MATCH (r:Role {name:'ADMIN'})
    MATCH (db:Resource {name:'Treasury Database'})
    MERGE (r)-[:CAN_ACCESS]->(db)
    """,

    """
    MATCH (r:Role {name:'ADMIN'})
    MATCH (db:Resource {name:'SWIFT System'})
    MERGE (r)-[:CAN_ACCESS]->(db)
    """
]

with driver.session() as session:

    for q in queries:
        session.run(q)

print("Graph Loaded Successfully")

driver.close()