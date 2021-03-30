import os, json
from Google import Create_Service
from py_REDcap import getValues

def create_service():
    CLIENT_SECRET_FILE = 'client_secret.json'
    API_NAME = 'sheets'
    API_VERSION = 'v4'
    SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

    service= Create_Service(CLIENT_SECRET_FILE, API_NAME, API_VERSION, SCOPES)
    return service

def getSpreadSheetID():
    configFile = open("config.json","r")
    content = json.loads(configFile.read())
    return content["spreadsheet_id"]

def getWorksheetID(title):
    service = create_service()
    spreadsheet_id = getSpreadSheetID()
    data = service.spreadsheets().get(spreadsheetId=spreadsheet_id, ranges=[], includeGridData=False).execute()
    
    for x in data["sheets"]:
        if x["properties"]["title"] == title:
            return x["properties"]["sheetId"]
    return None


def pushJSON(jsonObject):
    importMode = jsonObject['mode']
    data = generateTuple(jsonObject['object'])
    
    if(importMode == "replace"):
        # replacing sheet data
        # TODO: put this code here
        print("put code to replace sheet here")
    else:
        # creating new sheet
        v = generateTuple(json.loads(getValues()))
        service = create_service()
        spreadsheet_id = getSpreadSheetID()
        for x in v:
            createWorksheet(service, spreadsheet_id, x)
            values = v[x]
            value_range_body = {
                'majorDimension' : 'ROWS',
                'values' : values
            }
            worksheet_range = x+'!A1'
            updateData(service,spreadsheet_id, worksheet_range, values, value_range_body)
    
    return "1"

"""
function to generate a values tuple from json
"""
def generateTuple(jsonObject):
    
    keys = list(jsonObject.keys())
    
    newObject = {}
    
    for key in keys:
        event = jsonObject[key]
        eventKeys = list(event.keys())
        
        eventObject = ()
        
        headerObject = ()
        for headerKey in list(event[eventKeys[0]]):
            headerObject = headerObject+(headerKey,)
        
        eventObject = eventObject+(headerObject,)
        
        for eventKey in eventKeys:
            participantObject = ()
            for participantKey in list(event[eventKey].keys()):
                participantValue = event[eventKey][participantKey].replace("\n"," ")
                participantObject = participantObject+(participantValue,)
            eventObject = eventObject+(participantObject,)
        
        newObject[key] = eventObject
    
    return newObject

def batch(service, spreadsheet_id, requests):
    """
    function to run batch updates on the sheet.
    """
    body = {
        'requests': requests
    }
    return service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body=body).execute()


def renameSheet(service, spreadsheet_id, new_name):
    """
    function to rename sheet
    """
    batch(service, spreadsheet_id, {
        "updateSpreadsheetProperties": {
            "properties": {
                "title": new_name,
            },
            "fields": "title",
        }
    })

"""
function that updates a google sheet's values
"""
def updateData(service,spreadsheet_id, worksheet_range: str, values: tuple, value_range_body: dict):
    service.spreadsheets().values().update(
        spreadsheetId = spreadsheet_id,
        valueInputOption = 'USER_ENTERED',
        range= worksheet_range,
        body = value_range_body
    ).execute()



#function that clears the data of a worksheet
def clearData(sheetName: str):
    service = create_service()
    spreadsheet_id = getSpreadSheetID()
    service.spreadsheets( ).values( ).clear(
        spreadsheetId=spreadsheet_id,
        range='{0}!A1:Z'.format( sheetName ),
        body={}
    ).execute( )
    
def deleteWorksheet(worksheetID):
    request_body = {
            'requests': [
                {'deleteSheet': {
                    'sheetId': worksheetID }
                 }   
            ]
        }
    service.spreadsheets().batchUpdate(
    spreadsheetId=spreadsheet_id,
    body = request_body
     ).execute()

'''
function that takes in the service, spreadsheetID, and title of the new worksheet
creates a worksheet with 20 by 5 with the specified title
'''
def createWorksheet(title:str):
    service = create_service()
    spreadsheet_id = getSpreadSheetID()
    request_body = {
            'requests': [
                {'addSheet': { "properties" :{
                        'title': title,
                        'gridProperties' : {
                            'rowCount' : 20,
                            'columnCount' : 40
                        },
                        'hidden' : False}
                    }
                }   
            ]
        }
    service.spreadsheets().batchUpdate(
    spreadsheetId=spreadsheet_id,
    body = request_body
     ).execute()

if __name__ == "__main__":
    service = create_service()
    spreadsheet_id = getSpreadSheetID()
    mySpreadsheets = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    worksheet_range = 'Sheet1!A1'
    values =[]
    value_range_body = {
        'majorDimension' : 'ROWS',
        'values' : values
    }
    clearData("Sheet1")
    """
    for loop to create multiple worksheets
    """
    worksheetTitles = ('Test1', 'Test2', 'Test3')
    '''for title in worksheetTitles:
        createWorksheet(service, spreadsheet_id, title)'''
    
    
    #updateData(service,spreadsheet_id, worksheet_range, values, value_range_body)
    
    #print(getWorksheetID("a"))
    deleteWorksheet(getWorksheetID("Sheet3"))
    #print(generateTuple(json.loads(getValues())))
    

    
