from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_utils import EncryptedType
from sqlalchemy_utils.types.encrypted.encrypted_type import AesEngine
import config

db = SQLAlchemy()

key = config._DB_SECRET_KEY_

class User(db.Model):
  __tablename__ = "user"

  id = db.Column(db.Integer, primary_key=True)
  username = db.Column(db.String(80), unique=True)
  password = db.Column(EncryptedType(db.Unicode, key, AesEngine, "pkcs5"))
  otp = db.Column(EncryptedType(db.Unicode, key, AesEngine, "pkcs5"))
  passwordfcnt = db.Column(db.Integer, default=0)
  otpfcnt = db.Column(db.Integer, default=0)
  admin = db.Column(db.Boolean)

  def __init__(self, username, password, otp, admin):
    self.username = username
    self.password = password
    self.otp = otp
    self.admin = admin

class Plate(db.Model):
  __tablename__ = "plate"

  id = db.Column(db.Integer, primary_key=True)
  plate = db.Column(db.String(20), unique=True)
  status = db.Column(EncryptedType(db.Unicode, key, AesEngine, "pkcs5"))
  expiration_date = db.Column(EncryptedType(db.Unicode, key, AesEngine, "pkcs5"))
  name = db.Column(EncryptedType(db.Unicode, key, AesEngine, "pkcs5"))
  birth_date = db.Column(EncryptedType(db.Unicode, key, AesEngine, "pkcs5"))
  address1 = db.Column(EncryptedType(db.Unicode, key, AesEngine, "pkcs5"))
  address2 = db.Column(EncryptedType(db.Unicode, key, AesEngine, "pkcs5"))
  vehicle_year = db.Column(EncryptedType(db.Unicode, key, AesEngine, "pkcs5"))
  vehicle_make = db.Column(EncryptedType(db.Unicode, key, AesEngine, "pkcs5"))
  vehicle_model = db.Column(EncryptedType(db.Unicode, key, AesEngine, "pkcs5"))
  vehicle_color = db.Column(EncryptedType(db.Unicode, key, AesEngine, "pkcs5"))


  def __init__(self, plate, status, expiration_date, name, birth_date, address1, address2, vehicle_year, vehicle_make, vehicle_model, vehicle_color):
    self.plate = plate
    self.status = status
    self.expiration_date = expiration_date
    self.name = name
    self.birth_date = birth_date
    self.address1 = address1
    self.address2 = address2
    self.vehicle_year = vehicle_year
    self.vehicle_make = vehicle_make
    self.vehicle_model = vehicle_model
    self.vehicle_color = vehicle_color

class Log(db.Model):
  __tablename__ = "log"

  id = db.Column(db.Integer, primary_key=True)
  username = db.Column(db.String(80), unique=True)
  qps = db.Column(db.Float, default=0.0)
  lastsec = db.Column(db.Integer, default=0)
  bestcnt = db.Column(db.Integer, default=0)
  partialcnt  = db.Column(db.Integer, default=0)

  def __init__(self, username):
    self.username = username
