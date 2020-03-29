from flask import Flask, render_template
app = Flask(__name__)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/crowd/<crowd_id>')
def crowd(crowd_id=None):
    crowd_obj = {
        'id' : crowd_id,
        'name': 'Dunkin donuts'
    }
    return render_template('crowd.html', crowd=crowd_obj)
