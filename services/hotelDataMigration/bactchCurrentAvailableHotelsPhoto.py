import os
import requests
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi


def createAMongodbConnection() -> MongoClient:
    connectionString = f"mongodb+srv://{os.environ['MONGODB_USERNAME']}:{os.environ['MONGODB_PASSWD']}@cluster0.qsa9hsq.mongodb.net/?appName=Cluster0"
    client = MongoClient(connectionString, server_api=ServerApi('1')) ## Establish the connection
    try:
        client.admin.command('ping')
    except Exception as e:
        print(e)
    return client

def getTheCurrentAvailableIds() -> list:
    # create a valid URI fron system env
    uri = f"mongodb+srv://{os.environ['MONGODB_USERNAME']}:{os.environ['MONGODB_PASSWD']}@cluster0.qsa9hsq.mongodb.net/?appName=Cluster0"
    mongodbConnection = createAMongodbConnection()
    # Send a ping to confirm a successful connection
    db = mongodbConnection["metadata"]
    collection = db["currentAvailableHotelMetadata"]
    location_ids = [
        doc["location_id"]
        for doc in collection.find({}, {"location_id": 1, "_id": 0})
    ]
    mongodbConnection.close() # Close the connection
    return location_ids
def ingestCurrentAvailableHotelsPhoto(locationIDs: list) -> None:
    mongodbConnection = createAMongodbConnection() #mongoDB connection
    for id_ in locationIDs: # Create request based on Each location_id and offset limit = 3
        for offsetNumber in range(1,4):
            url = f'https://api.content.tripadvisor.com/api/v1/location/{id_}/photos?language=en&limit=5&offset=1&key={os.environ["TRIPADVISORAPI_KEY"]}'
            data = {"hotel_id":id_,**(requests.get(url).json())}
            print(f"Getting from locationID {id_} successfully, with the offset number: {offsetNumber}") # Using for logging feature
            writeToCollection = mongodbConnection["hotel_info"]['currentAvailableHotelsPhoto']
            writeToCollection.insert_one(data)

ingestCurrentAvailableHotelsPhoto(getTheCurrentAvailableIds())

11111
22222
33333
44444
55555