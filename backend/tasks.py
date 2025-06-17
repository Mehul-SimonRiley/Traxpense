from flask import current_app
from extensions import db
from models.budget import Budget
from models.notification import Notification
from models.transaction import Transaction
from datetime import datetime, timedelta
import logging
from sqlalchemy import func
from models.user import User

logger = logging.getLogger(__name__)

def check_budget_alerts():
    """Check all active budgets for alerts"""
    try:
        with current_app.app_context():
            # Get all active budgets
            today = datetime.utcnow().date()
            active_budgets = Budget.query.filter(
                Budget.start_date <= today,
                Budget.end_date >= today,
                Budget.alert_enabled == True
            ).all()
            
            for budget in active_budgets:
                # Calculate current spending
                current_spending = db.session.query(
                    func.sum(Transaction.amount)
                ).filter(
                    Transaction.user_id == budget.user_id,
                    Transaction.category_id == budget.category_id,
                    Transaction.type == 'expense',
                    Transaction.date >= budget.start_date,
                    Transaction.date <= today
                ).scalar() or 0
                
                # Check for alert
                alert_data = budget.check_alert(current_spending)
                if alert_data:
                    # Add category name to alert data
                    alert_data['category_name'] = budget.category.name
                    
                    # Create notification
                    notification = Notification.create_budget_alert(
                        budget.user_id,
                        alert_data
                    )
                    db.session.add(notification)
            
            db.session.commit()
            logger.info("Budget alerts checked successfully")
            
    except Exception as e:
        logger.error(f"Error checking budget alerts: {str(e)}")
        db.session.rollback()

def generate_daily_reports():
    """Generate daily reports for all users"""
    try:
        with current_app.app_context():
            # Get yesterday's date
            yesterday = datetime.utcnow().date() - timedelta(days=1)
            
            # Get all users with transactions
            users_with_transactions = db.session.query(
                Transaction.user_id
            ).filter(
                func.date(Transaction.date) == yesterday
            ).distinct().all()
            
            for user_id, in users_with_transactions:
                # Get daily summary
                daily_summary = db.session.query(
                    func.sum(Transaction.amount).filter(Transaction.type == 'income').label('total_income'),
                    func.sum(Transaction.amount).filter(Transaction.type == 'expense').label('total_expense')
                ).filter(
                    Transaction.user_id == user_id,
                    func.date(Transaction.date) == yesterday
                ).first()
                
                if daily_summary:
                    # Create daily report notification
                    notification = Notification.create_system_notification(
                        user_id=user_id,
                        title='Daily Summary',
                        message=f'Yesterday\'s Summary:\nIncome: {daily_summary.total_income or 0}\nExpenses: {daily_summary.total_expense or 0}',
                        metadata={
                            'date': yesterday.isoformat(),
                            'total_income': daily_summary.total_income or 0,
                            'total_expense': daily_summary.total_expense or 0
                        }
                    )
                    db.session.add(notification)
            
            db.session.commit()
            logger.info("Daily reports generated successfully")
            
    except Exception as e:
        logger.error(f"Error generating daily reports: {str(e)}")
        db.session.rollback()

def cleanup_old_notifications():
    """Remove notifications older than 30 days"""
    try:
        with current_app.app_context():
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            Notification.query.filter(
                Notification.created_at < thirty_days_ago
            ).delete()
            
            db.session.commit()
            logger.info("Old notifications cleaned up successfully")
            
    except Exception as e:
        logger.error(f"Error cleaning up old notifications: {str(e)}")
        db.session.rollback()

def cleanup_unverified_users():
    """Delete users who haven't verified their email within 15 minutes"""
    try:
        deleted_count = User.delete_unverified_users()
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} unverified users")
    except Exception as e:
        logger.error(f"Error cleaning up unverified users: {str(e)}") 