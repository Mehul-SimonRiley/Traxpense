from flask import Blueprint, request, jsonify
from models import User, Category
from extensions import db, jwt
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
import logging
from flask import current_app
from services.email_service import EmailService

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)
email_service = None

def init_email_service(app):
    global email_service
    email_service = EmailService(app)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        logger.info(f"Registration attempt for email: {data.get('email')}")
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            logger.warning(f"Registration failed: Email {data.get('email')} already registered")
            return jsonify({"error": "Email already registered"}), 400
        
        # Create new user
        user = User(
            name=data['name'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        logger.info(f"User created successfully with ID: {user.id}")
        
        # Send verification email
        if email_service:
            logger.info("Email service available, attempting to send verification email")
            success = email_service.send_verification_email(user.email)
            if not success:
                logger.error("Failed to send verification email")
                return jsonify({"error": "Failed to send verification email"}), 500
        else:
            logger.error("Email service not initialized")
            return jsonify({"error": "Email service not configured"}), 500
        
        return jsonify({
            "message": "Registration successful. Please check your email for verification code.",
            "user_id": user.id
        }), 201
        
    except Exception as e:
        logger.error(f"Error in registration: {str(e)}")
        logger.exception("Full traceback:")
        db.session.rollback()
        return jsonify({"error": "Registration failed"}), 500

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    try:
        data = request.json
        email = data.get('email')
        code = data.get('code')
        
        if not email or not code:
            return jsonify({"error": "Email and verification code are required"}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if user.is_email_verified:
            return jsonify({"error": "Email already verified"}), 400
        
        success, message = email_service.verify_code(email, code)
        if success:
            user.is_email_verified = True
            db.session.commit()
            return jsonify({"message": "Email verified successfully"}), 200
        else:
            return jsonify({"error": message}), 400
            
    except Exception as e:
        logger.error(f"Error in email verification: {str(e)}")
        return jsonify({"error": "Verification failed"}), 500

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if user.is_email_verified:
            return jsonify({"error": "Email already verified"}), 400
        
        if email_service:
            email_service.send_verification_email(email)
            return jsonify({"message": "Verification email sent"}), 200
        else:
            return jsonify({"error": "Email service not configured"}), 500
            
    except Exception as e:
        logger.error(f"Error in resending verification: {str(e)}")
        return jsonify({"error": "Failed to resend verification"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({"error": "Invalid email or password"}), 401
        
        if not user.is_email_verified:
            return jsonify({
                "error": "Email not verified",
                "user_id": user.id,
                "email": user.email
            }), 403
        
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in login: {str(e)}")
        return jsonify({"error": "Login failed"}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    try:
        current_user_id = get_jwt_identity()
        access_token = create_access_token(identity=current_user_id)
        return jsonify({"access_token": access_token}), 200
    except Exception as e:
        logger.error(f"Error in token refresh: {str(e)}")
        return jsonify({"error": "Token refresh failed"}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    current_user_id = get_jwt_identity()
    logger.info(f"Fetching profile for user ID: {current_user_id}")
    user = User.query.get(current_user_id)
    if not user:
        logger.warning(f"Profile fetch attempt for non-existent user ID: {current_user_id}")
        return jsonify({"msg": "User not found"}), 404
    logger.info(f"Profile fetched successfully for user ID: {current_user_id}")
    return jsonify(user.to_dict())

@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    logger.info(f"Updating profile for user ID: {current_user_id}")
    user = User.query.get(current_user_id)

    if not user:
        logger.warning(f"Profile update attempt for non-existent user ID: {current_user_id}")
        return jsonify({"msg": "User not found"}), 404

    data = request.get_json()
    logger.info(f"Received profile update data for user {current_user_id}: {data}")
    updated = False

    try:
        if 'name' in data and data['name']:
            user.name = data['name']
            updated = True
        if 'password' in data and data['password']:
            user.set_password(data['password'])
            updated = True

        if updated:
            db.session.commit()
            logger.info(f"Profile updated successfully for user ID: {current_user_id}")
            return jsonify({"msg": "Profile updated successfully", "user": user.to_dict()})
        else:
            logger.info(f"No fields to update for user ID: {current_user_id}")
            return jsonify({"msg": "No changes provided", "user": user.to_dict()})

    except Exception as e:
        db.session.rollback()
        logger.error(f'Profile update error for user {current_user_id}: {str(e)}')
        return jsonify({"msg": 'Failed to update profile'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required(optional=True)
def logout():
    # Client-side tokens are already cleared by the frontend.
    # This endpoint primarily serves to prevent a 404 and can be extended
    # for token blacklisting if server-side invalidation is needed.
    logger.info("User logged out successfully (client-side token cleared).")
    return jsonify({"msg": "Successfully logged out"}), 200 