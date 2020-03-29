from flask import Flask, render_template
import pyrebase # for connecting to firebase
app = Flask(__name__)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/crowd/<crowd_id>')
def crowd(crowd_id=None):

    # config firebase
    config = {
      "apiKey": "AIzaSyA-TtymaKaQYS1LiedsCmgdj3kV5Z2TtOo",
      "authDomain": "corona-crowd-cf195.firebaseapp.com",
      "databaseURL": "https://corona-crowd-cf195.firebaseio.com",
      "storageBucket": "corona-crowd-cf195.appspot.com"
    }
    firebase = pyrebase.initialize_app(config)

    # Get a reference to the database service
    db = firebase.database()

    matched_crowd = db.child("crowds").order_by_key().equal_to(crowd_id).get()
    crowd_obj = matched_crowd.val()

    # crowd_obj = {
    #     'id' : crowd_id,
    #     'name': 'Dunkin donuts'
    # }

    return crowd_obj
    # return render_template('crowd.html', crowd=crowd_obj)
