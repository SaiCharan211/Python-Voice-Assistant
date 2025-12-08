from fastapi import FastAPI
from pydantic import BaseModel
from assistant import process_query 
from fastapi.middleware.cors import CORSMiddleware


app=FastAPI(title="Python Voice Assistant API")

origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      
    allow_credentials=True,
    allow_methods=["*"],        
    allow_headers=["*"],        
)

class Query(BaseModel):
    text: str 


@app.post('/query')
def handle_query(query: Query):
    response = process_query(query.text)
    return {'response':response}







