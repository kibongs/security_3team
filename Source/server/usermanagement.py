from flask import Blueprint
from flask import Flask, render_template, redirect, request, url_for, flash, request, jsonify, session
import pyotp

import jwt
import datetime
import config

from database import db, User, Log
from server import app

from utils import token_required, valid_username, valid_password, snedmail

user_management = Blueprint('usermanagement', __name__, url_prefix='/')

@user_management.route("/signin", methods=['GET','POST'])
def signin():

  if request.method == 'GET':  
    form_user = request.args.get("username")
    form_pass = request.args.get("password")
    form_otp = request.args.get("otp")
  else:
    form_user = request.form.get("username")
    form_pass = request.form.get("password")
    form_otp = request.form.get("otp")
    
  if form_user is None or form_pass is None or form_otp is None:
    return {"result":{
              "status" : "fail",
              "message": "Invalid signin info."
           }}  

  result, value = valid_username(form_user)
  if not result:
    return jsonify(value)

  data = User.query.filter_by(username=form_user).first()	# ID 조회Query 실행

  if data is not None:
    if data.password == form_pass:
      totp_instance = pyotp.TOTP(data.otp)
      valid = totp_instance.verify(form_otp)
      if valid:
        data.otpfcnt = 0
        data.passwordfcnt = 0
        db.session.commit()
        token = jwt.encode({'public_id': data.username, 'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=45)}, config._JWT_SECRET_KEY_, "HS256")
        value = {"result":{
          "status" : "success",
          "token" : token,
          "message": ""
        }}

      else:
        data.otpfcnt = data.otpfcnt + 1
        db.session.commit()

        if data.passwordfcnt + data.otpfcnt > 2 :
          password = data.password
          data.password = password[::-1]
          data.passwordfcnt = 0
          data.otpfcnt = 0
          db.session.commit()
          snedmail(data.username, f"new password : {data.password}")
          value = {"result":{
            "status" : "fail",
            "token" : "",
            "message": f"A new password has been sent to you by backup e-mail({data.username})"
          }}

        else:
          value = {"result":{
            "status" : "fail",
            "token" : "",
            "message": "Invalid OTP or Password Number"
          }}

    else:
      data.passwordfcnt = data.passwordfcnt + 1
      db.session.commit()

      if data.passwordfcnt + data.otpfcnt > 2 :
        password = data.password
        data.password = password[::-1]
        data.passwordfcnt = 0
        data.otpfcnt = 0
        db.session.commit()
        snedmail(data.username, f"new password : {data.password}")
        value = {"result":{
          "status" : "fail",
          "token" : "",
          "message": f"A new password has been sent to you by backup e-mail({data.username})"
        }}

      else:
        value = {"result":{
          "status" : "fail",
          "token" : "",
          "message": "Invalid Password or OTP Number"
        }}

  else:
    value = {"result":{
      "status" : "fail",
      "token" : "",
      "message": "Invalid Username"
    }}

  return jsonify(value)

@user_management.route("/auth/<user>", methods=['GET'])
def OTP_auth(user):

  data = User.query.filter_by(username=user).first()

  if data is not None:
    return render_template('auth.html', title='User OTP Info.', secret_key=data.otp,
                             prov_uri=pyotp.TOTP(data.otp).provisioning_uri(name=user, issuer_name='3team Studio Project'))
  else:
    flash("Invalid user. Please try again.")
    return redirect(url_for("usermanagement.index"))


@user_management.route("/admin/signin", methods=['GET', 'POST'])
def adminsignin():
  form_user = request.form.get("username")
  form_pass = request.form.get("password")
  form_otp = request.form.get("otp")

  if request.method == 'POST':
    data = User.query.filter_by(username=form_user).first()

    if data is not None:
      if data.password == form_pass :
        totp_instance = pyotp.TOTP(data.otp)
        valid = totp_instance.verify(form_otp)
        if valid:
          if data.admin :
            session['username'] = "admin"
            data.otpfcnt = 0
            data.passwordfcnt = 0
            db.session.commit()
            return redirect(url_for("usermanagement.page"))
          else : 
            flash("You don't have admin authorizetion")
        else:
          data.otpfcnt = data.otpfcnt + 1
          db.session.commit()

          if data.passwordfcnt + data.otpfcnt > 2 :
            password = data.password
            data.password = password[::-1]
            data.passwordfcnt = 0
            data.otpfcnt = 0
            db.session.commit()
            snedmail(data.username, f"new password : {data.password}")
            flash(f"A new password has been sent to you by backup e-mail({data.username})")
          else:
            flash("Invalid Password or OTP number. Please try again.")

      else:
        data.passwordfcnt = data.passwordfcnt + 1
        db.session.commit()

        if data.passwordfcnt + data.otpfcnt > 2 :
          password = data.password
          data.password = password[::-1]
          data.passwordfcnt = 0
          data.otpfcnt = 0
          db.session.commit()
          snedmail(data.username, f"new password : {data.password}")
          flash(f"A new password has been sent to you by backup e-mail({data.username})")
        else:
          flash("Invalid Password or OTP number. Please try again.")
    else:
      flash("Invalid Username. Please try again.")

  return render_template('index.html', title='Admin SignIn')

@user_management.route('/admin/page')
def page():
  if not "username" in session:
    flash("You are not authorized to access admin page, Please sign in admin account")
    return render_template('index.html', title='Admin SignIn')

  if session['username'] != "admin":
    flash("You are not authorized to access admin page, Please sign in admin account")
    return render_template('index.html', title='Admin SignIn')

  return render_template('admin.html', title="Admin Page")

@user_management.route("/admin/signup", methods=['GET', 'POST'])
def siginup():
  if not "username" in session:
    flash("You are not authorized to signup, Please sign in admin account")
    return render_template('index.html', title='Admin SignIn')

  if session['username'] != "admin":
    flash("You are not authorized to signup, Please sign in admin account")
    return render_template('index.html', title='Admin SignIn')
  
  form_user = request.form.get("username")
  form_pass = request.form.get("password")
  form_confirm_pass = request.form.get("confirm_password")

  if request.method == 'POST':
    if form_user is None or form_pass is None or form_confirm_pass is None:
      return {"result":{
              "status" : "fail",
              "message": "Invalid signup info."
             }}  

    result, value = valid_username(form_user)
    if not result:
      flash(value)
      return render_template('signup.html', title='User Signup')
  
    result, value = valid_password(form_pass)
    if not result:
      flash(value)
      return render_template('signup.html', title='User Signup')

    data = User.query.filter_by(username=form_user).first()

    if data is not None:
      flash("User Name already exists. Please try with another one")
      return render_template('signup.html', title='User Signup')

    else:
      if form_pass == form_confirm_pass:
        otptoken=pyotp.random_base32()
        user = User(username=form_user, password=form_pass, otp=otptoken, admin=False)
        log = Log(username=form_user)
        db.session.add(user)
        db.session.add(log)
        db.session.commit()

        return render_template('auth.html', title="User OTP Info.", secret_key=otptoken,
                             prov_uri=pyotp.TOTP(otptoken).provisioning_uri(name=form_user, issuer_name='3team Studio Project'))

      else:
        flash("Password don't match")
        return render_template('signup.html', title='User Signup')

  return render_template('signup.html', title="User SignUp")

@user_management.route('/admin/log')
def adminlog():
  logs = Log.query.all()

  #sum_best = db.session.query(db.func.sum(Log.bestcnt)).first()[0]
  #sum_partial = db.session.query(db.func.sum(Log.partialcnt)).first()[0]
  #print(sum_best)
  #print(sum_partial)

  with  open("log.txt", "w+") as file:
    for log in logs:
      line = f"{log.username} | {log.qps} | {log.bestcnt} | {log.partialcnt} \n"
      file.write(line)
    file.close()

  return render_template('log.html', title='User Log', logs=logs)

@user_management.route('/admin/logout')
def adminlogout():
  if not "username" in session:
    flash("You are not authorized to logout admin page, Please sign in admin account")
    return render_template('index.html', title='Admin SignIn')

  if session['username'] != "admin":
    flash("You are not authorized to logout admin page, Please sign in admin account")
    return render_template('index.html', title='Admin SignIn')

  session.clear()
  flash("Logout Success")
  return render_template('index.html', title='Admin SignIn')


@user_management.route('/life', methods=['GET'])
def heartbeat():
  value = {"result":{
        "status" : "success",
        "server_status": "online"
      }}

  return jsonify(value)
