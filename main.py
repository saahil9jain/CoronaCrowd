from flask import Flask, render_template
app = Flask(__name__, static_url_path='/assets/')

@app.route('/')
def home():
    return 'Corona Crowd - home page'

@app.route('/crowd/<crowd_id>')
def crowd(crowd_id=None):
    return render_template('crowd.html', crowd_id=crowd_id)
