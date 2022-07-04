from flask import Blueprint, jsonify, request

from database import db, Plate, Log
from utils import token_required, valid_platenumber
import time
import config

plate_query = Blueprint('plate', __name__, url_prefix='/plate')

@plate_query.route("/get", methods=['GET'])
@token_required
def getPlate(valid_user):
  if valid_user is not None:

    plate_number = request.args.get('plate_number')

    if plate_number is None:
      value = {"result":{"status" : "fail",
                         "message":"Invailed plase number"}}
      return jsonify(value)

    result, value = valid_platenumber(plate_number)
    if not result:
      return jsonify(value)

    data = Plate.query.filter_by(plate=plate_number).first()

    if data is not None:
      value = {"result":{
        "status" : "success",
        "plate": data.plate,
        "status": data.status,
        "expiration_date": data.expiration_date,
        "name": data.name,
        "birth_date": data.birth_date,
        "address1": data.address1,
        "address2": data.address2,
        "vehicle_year": data.vehicle_year,
        "vehicle_make": data.vehicle_make,
        "vehicle_model": data.vehicle_model,
        "vehicle_color": data.vehicle_color,
        "match_info":"Best"
      }}

      log = Log.query.filter_by(username=valid_user.username).first()

      if log is not None:

        log.bestcnt = log.bestcnt + 1

        now = int(time.time())
        if log.lastsec == 0:
          log.qps = 1.0
          log.lastsec = int(time.time())
        elif now - log.lastsec > 1:
          log.qps = 1.0
          log.lastsec = int(time.time())
        elif now - log.lastsec < 1:
          log.qps = log.qps + 1.0

        db.session.commit()

      return jsonify(value)

    if config._PARTIAL_MATCH_ == "end":
      endpartialstr = f"{plate_number}_"
      endpartialdata = Plate.query.filter(Plate.plate.like(endpartialstr)).first()

      if endpartialdata is not None:
        value = {"result":{
          "status" : "success",
          "plate": endpartialdata.plate,
          "status": endpartialdata.status,
          "expiration_date": endpartialdata.expiration_date,
          "name": endpartialdata.name,
          "birth_date": endpartialdata.birth_date,
          "address1": endpartialdata.address1,
          "address2": endpartialdata.address2,
          "vehicle_year": endpartialdata.vehicle_year,
          "vehicle_make": endpartialdata.vehicle_make,
          "vehicle_model": endpartialdata.vehicle_model,
          "vehicle_color": endpartialdata.vehicle_color,
          "match_info":"Partial"
        }}

        log = Log.query.filter_by(username=valid_user.username).first()

        if log is not None:
          log.partialcnt = log.partialcnt + 1

          now = int(time.time())
          if log.lastsec == 0:
            log.qps = 1.0
            log.lastsec = int(time.time())
          elif now - log.lastsec > 1:
            log.qps = 1.0
            log.lastsec = int(time.time())
          elif now - log.lastsec < 1:
            log.qps = log.qps + 1.0

          db.session.commit()

        return jsonify(value)
    else:
      frontpartialstr = f"_{plate_number}"
      frontpartialdata = Plate.query.filter(Plate.plate.like(frontpartialstr)).first()

      if frontpartialdata is not None:
        value = {"result":{
          "status" : "success",
          "plate": frontpartialdata.plate,
          "status": frontpartialdata.status,
          "expiration_date": frontpartialdata.expiration_date,
          "name": frontpartialdata.name,
          "birth_date": frontpartialdata.birth_date,
          "address1": frontpartialdata.address1,
          "address2": frontpartialdata.address2,
          "vehicle_year": frontpartialdata.vehicle_year,
          "vehicle_make": frontpartialdata.vehicle_make,
          "vehicle_model": frontpartialdata.vehicle_model,
          "vehicle_color": frontpartialdata.vehicle_color,
          "match_info":"Partial"
        }}
    
        log = Log.query.filter_by(username=valid_user.username).first()
        
        if log is not None:
 
          log.partialcnt = log.partialcnt + 1

          now = int(time.time())
          if log.lastsec == 0:
            log.qps = 1.0
            log.lastsec = int(time.time())
          elif now - log.lastsec > 1:
            log.qps = 1.0
            log.lastsec = int(time.time())
          elif now - log.lastsec < 1:
            log.qps = log.qps + 1.0

          db.session.commit()

        return jsonify(value)

    log = Log.query.filter_by(username=valid_user.username).first()
        
    if log is not None:
      now = int(time.time())
      if log.lastsec == 0:
        log.qps = 1.0
        log.lastsec = int(time.time())
      elif now - log.lastsec > 1:
        log.qps = 1.0
        log.lastsec = int(time.time())
      elif now - log.lastsec < 1:
        log.qps = log.qps + 1.0

      db.session.commit()
    
    value = {"result":{"status" : "fail",
                       "message":"not matched"}}
    return jsonify(value)
