from fastapi import FastAPI

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