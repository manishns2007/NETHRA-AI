from fastapi import FastAPI
from contextlib import asynccontextmanager

app = FastAPI()

@app.post("/test-upload")
async def test_upload():
    try:
        from app.services.processing.pipeline import process_evidence
        result = process_evidence.delay('123')
        return {"task_id": str(result.id)}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
