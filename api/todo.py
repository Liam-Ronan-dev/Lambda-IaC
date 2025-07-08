# Access environment variables
import os

import time

# Official Python SDK for AWS - used here to talk to DynamoDB
import boto3
from uuid import uuid4

# sets up the web app to run inside AWS Lambda
from fastapi import FastAPI
from mangum import Mangum

# Defines expected request format
from pydantic import BaseModel
from typing import Optional

# Initialising FastAPI application
app = FastAPI()
# Wraps FastAPI so it works with Lambda
handler = Mangum(app)

class CreateTaskRequest(BaseModel):
    content: str
    user_id: Optional[str] = None
    task_id: Optional[str] = None
    is_done: bool = False


@app.get('/')
def root():
    return {"message": "hello world from todo API"}

@app.post('/create-task')
async def create_task(create_request: CreateTaskRequest):
    created_time = int(time.time())
    
    item = {
        "user_id": create_request.user_id,
        "content": create_request.content,
        "is_done": False,
        "created_time": created_time,
        "task_id": f"task_{uuid4().hex}",
        "ttl": int(created_time + 86400)
    }

    table = _get_table()
    table.put_item(Item=item)
    return { "task": item }

# Helper function to connect to DDB Table
def _get_table():
    table_name = os.environ.get("TABLE_NAME")
    return boto3.resource("dynamodb").Table(table_name)