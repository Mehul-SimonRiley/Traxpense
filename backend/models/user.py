from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class User(db.Model):
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    bio = db.Column(db.Text)
    date_of_birth = db.Column(db.Date)
    occupation = db.Column(db.String(100))
    location = db.Column(db.String(100))
    profile_picture = db.Column(db.String(200))
    is_email_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Define relationships
    categories = db.relationship('Category', backref='user', lazy=True)
    transactions = db.relationship('Transaction', backref='user', lazy=True)
    budgets = db.relationship('Budget', backref='user', lazy=True)
    
    def set_password(self, password):
        try:
            self.password_hash = generate_password_hash(password)
            logger.info(f"Password hash generated for user {self.id}")
        except Exception as e:
            logger.error(f"Error generating password hash for user {self.id}: {str(e)}")
            raise
        
    def check_password(self, password):
        try:
            result = check_password_hash(self.password_hash, password)
            logger.info(f"Password check for user {self.id}: {'successful' if result else 'failed'}")
            return result
        except Exception as e:
            logger.error(f"Error checking password for user {self.id}: {str(e)}")
            return False
        
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'bio': self.bio,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'occupation': self.occupation,
            'location': self.location,
            'profile_picture': self.profile_picture,
            'is_email_verified': self.is_email_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_by_id(cls, id):
        return cls.query.get(id)
    
    def get_id(self):
        return str(self.id)

    @classmethod
    def delete_unverified_users(cls):
        """Delete users who haven't verified their email within 15 minutes"""
        # Find users who haven't verified their email and are older than 15 minutes
        cutoff_time = datetime.utcnow() - timedelta(minutes=15)
        unverified_users = cls.query.filter(
            cls.is_email_verified == False,
            cls.created_at < cutoff_time
        ).all()
        
        # Delete each unverified user
        for user in unverified_users:
            db.session.delete(user)
        
        try:
            db.session.commit()
            return len(unverified_users)
        except Exception as e:
            db.session.rollback()
            raise e