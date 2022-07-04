from flask import Flask, render_template, redirect, request, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import os

from database import db
import usermanagement
import platequery
import config
from utils import createdb

app = Flask(__name__)

if __name__ == '__main__':
  app = Flask(__name__)
  app.config['DEBUG'] = True
  app.config['SQLALCHEMY_DATABASE_URI'] = config._DB_PATH_
  app.config["SECRET_KEY"] = config._SESSION_SECRET_KEY_

  db.init_app(app)
  if not os.path.isfile('./server.db'):
    with app.app_context():
      db.create_all()
      createdb()

  app.register_blueprint(usermanagement.user_management)
  app.register_blueprint(platequery.plate_query)

  app.run(host='0.0.0.0', port=80)
