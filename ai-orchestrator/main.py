from fastapi import FastAPI
from langgraph_flow import graph

app = FastAPI(
    title="MAO-IR AI Orchestrator"
)


@app.get("/")
def root():

    return {
        "message": "MAO-IR Running"
    }


@app.get("/api/health")
def health():

    return {
        "status": "healthy"
    }


@app.post("/api/investigate")
def investigate(payload: dict):

    result = graph.invoke({
        "payload": payload
    })

    return result