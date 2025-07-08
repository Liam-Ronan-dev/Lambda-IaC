from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()
handler = Mangum(app)

@app.get('/')
def root():
    return {"message": "hello world from API"}