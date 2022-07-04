import jwt
import datetime
from flask import request, jsonify, abort
from functools import wraps
import re
import pyotp
import sys
import smtplib
from email.mime.text import MIMEText

from database import db, User, Plate, Log
import config

def token_required(f):
  @wraps(f)
  def decorator(*args, **kwargs):
    auth = request.headers.get("Authorization")
    if not auth:
      value = {"result":{
        "status" : "fail",
        "message": "Valid token is Missing"
      }}
      return jsonify(value)
    
    token = None
    if auth.startswith("Bearer "):
      split = auth.split("Bearer")
      token = split[1].strip()
    if not token:
      value = {"result":{
        "status" : "fail",
        "message": "Valid token is Missing"
      }}
      return jsonify(value)
    
    try:
      data = jwt.decode(token, config._JWT_SECRET_KEY_, algorithms=["HS256"])
      valid_user = User.query.filter_by(username=data['public_id']).first()
    except:
      value = {"result":{
        "status" : "fail",
        "message": "Invalid token"
      }}
      return jsonify(value)
    
    return f(valid_user, *args, **kwargs)

  return decorator


def valid_platenumber(platenumber):
  if len(platenumber) > 7 : 
    value = {"result":{"status" : "fail",
                       "message": "Invailed plate_number length"}}
    return False, value
  
  elif re.findall('[`~!@$%^&*(),<.>/?]+', platenumber):
    value = {"result":{"status" : "fail",
                       "message": "Invailed plate number format"}}
    return False, value

  return True, {}

    
def valid_username(username):
  if username.find('@') < 0:
    value = "Please enter a vaild email address"
    return False, value

  return True, {}


def valid_password(password):
  if len(password) < 8 or len(password) > 21 and not re.findall('[0-9]+', password) and not re.findall('[a-z]', password) or not re.findall('[A-Z]', password):
    value = "password must be at least 8 characters with uppercase letters"
    return False, value

  elif not re.findall('[`~!@$%^&*(),<.>/?]+', password):
    value = "Password must include at least one of following character ~!@$%^&*(),<.>/?]+"
    return False, value

  return True, {}


def createdb():
  print("add plate")

  from faker import Faker
  from faker.generator import random
  from faker_vehicle import VehicleProvider
  from datetime import datetime

  fake = Faker('en_US')
  fake.add_provider(VehicleProvider)
  Faker.seed(0)
  f = open('platelist','r')

  for i in range(1500):
    if i < 79:
      plate_ = f.readline()
      plate_ = plate_.strip('\n')
      rnum=fake.pyint(1,10)
    else:
      plate_=fake.license_plate().replace(" ","")
      plate_=plate_.replace("-","")
      rnum=fake.pyint(1,100)
    output=plate_+"\n"
    if rnum < 3:
      status_="Owner Wanted"
    elif rnum <6:
      status_="Unpaid Fines - Tow"
    elif rnum <9:
      status_="Stolen"
    else:
      status_="No Wants / Warrants"
    output+=status_+"\n"
    expiration_date_=fake.date_between_dates(date_start=datetime(2022,1,1), date_end=datetime(2024,5,1)).strftime("%m/%d/%Y")
    output+=expiration_date_+"\n"

    birth_date_=fake.date_between_dates(date_start=datetime(1932,1,1), date_end=datetime(2004,1,1)).strftime("%m/%d/%Y")
    output+=birth_date_+"\n"

    address_=fake.address()
    addresslist=address_.splitlines()
    output+=address_+"\n"

    print(plate_+"|"+status_)
    plateitem = Plate(plate=plate_, status=status_, expiration_date=expiration_date_, name=fake.name(), birth_date=birth_date_,
                            address1=addresslist[0], address2=addresslist[1], vehicle_year=fake.vehicle_year(), vehicle_make=fake.vehicle_make(), vehicle_model=fake.vehicle_model(), vehicle_color=fake.safe_color_name())
    db.session.add(plateitem)
    db.session.commit()
    
def snedmail(username, maintext):
  s = smtplib.SMTP('smtp.gmail.com', 587)
  s.starttls()
  s.login(config._SYSTEM_ADMIN_MAIL_, config._SMTP_APP_KEY_)

  msg = MIMEText(maintext)
  msg['Subject'] = "change your information"

  s.sendmail(config._SYSTEM_ADMIN_MAIL_, username, msg.as_string())
  s.quit()
