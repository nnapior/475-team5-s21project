from flask import Flask, render_template, request, flash, session, redirect, url_for
from lib.py_REDcap import getValues
from lib.createModifySpreadsheet import *
from lib.py_REDcap_import import import_data
from lib.py_REDcap_delete import delete_records
from lib.Google import *
from forms import SettingsForm
import json
import cv2


app = Flask(__name__)


@app.route('/scripts.js')
def getScripts():
    with open("js/scripts.js", "r") as f:
        return f.read()


@app.route('/signin.js')
def getSignin():
    with open("js/signin.js", "r") as f:
        return f.read()


@app.route('/')
@app.route('/home')
def home():
    if 'redcap_api_key' not in session:
        flash("Please enter your REDcap API key in the Settings", "info")
    return render_template('homepage.html')


@app.route('/settings', methods=['GET', 'POST'])
def settings():
    form = SettingsForm(request.form)
    if request.method == 'POST' and form.validate():
        session['redcap_api_key'] = form.redcap_api_key.data
        flash('REDcap API key entered successfully!', "success")
        return redirect(url_for('home'))
    return render_template('settings.html', form=form)


@app.route('/style.css')
def getStyle():
    with open("css/style.css", "r") as f:
        return f.read()


@app.route('/pushData', methods=['PUT', 'POST'])
def pushData():
    if(request.json):
        return pushJSON(request.json)
    else:
        return print("-1")


@app.route('/renameSheet', methods=['PUT', 'POST'])
def renameSheetRequest():
    if(request.json):
        if(request.json["newName"]):
            return renameSheet(request.json["newName"])
    return "-1"


@app.route('/clearSheet', methods=['PUT', 'POST'])
def clearSheetRequest():
    return cleanSheet()


@app.route('/getSheets', methods=['PUT', 'POST'])
def getSheetsRequest():
    if request.json:
        return getSheets(request.json)
    else:
        return print("-1")


@app.route('/authREDCap', methods=['POST'])
def authREDCapRequest():
    return "1"


@app.route('/authGoogle', methods=['POST'])
def authGoogleRequest():
    CLIENT_SECRET_FILE = 'config/client_secret.json'
    API_NAME = 'sheets'
    API_VERSION = 'v4'
    SCOPES = ['https://www.googleapis.com/auth/spreadsheets',
              'https://www.googleapis.com/auth/drive.metadata.readonly']

    return signInGoogle(CLIENT_SECRET_FILE, API_NAME, API_VERSION, SCOPES)


@app.route('/signOutGoogle', methods=['POST'])
def signOutGoogleRequest():
    if(request.json):
        if(request.json["creds"] and request.json["key"]):
            return signOutGoogle(request.json["creds"], request.json["key"])
    return "-1"


@app.route('/pullData')
def pullData():
    return getValues(session['redcap_api_key'])


@app.route('/import_sheets_to_redcap', methods=['PUT', 'POST'])
def import_to_redcap():
    if request.json:
        response = import_data(request.json)
        flash(response)
        return redirect(url_for("home"))
    else:
        return print("-1")


@app.route('/delete_record_redcap', methods=["POST"])
def delete_record():
    if request.json:
        deleted = delete_records(request.json['id'])
        return json.dumps({'deleted': deleted})


if __name__ == '__main__':
    app.secret_key = 'e71f3911e68fafd3249dc212cc9954ec'
    app.run(debug=True)
