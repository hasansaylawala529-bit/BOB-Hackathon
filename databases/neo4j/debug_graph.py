import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

driver = GraphDatabase.driver(
    os.getenv("NEO4J_URI"),
    auth=(
        os.getenv("NEO4J_USER"),
        os.getenv("NEO4J_PASSWORD")
    )
)

with driver.session() as session:

    result = session.run("""
        MATCH (n)
        RETURN labels(n) AS labels,
               properties(n) AS props
    """)

    for record in result:
        print(record)

driver.close()