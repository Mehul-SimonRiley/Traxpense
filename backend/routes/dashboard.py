from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.transaction import Transaction
from models.category import Category
from models.budget import Budget
from models.user import User
from extensions import db
from datetime import datetime, timedelta
from sqlalchemy import func, and_
import logging

logger = logging.getLogger(__name__)
dashboard_bp = Blueprint('dashboard', __name__)

def get_date_range(timeframe, start_date=None, end_date=None):
    today = datetime.now().date()
    if timeframe == "today":
        return today, today
    elif timeframe == "month":
        start = today.replace(day=1)
        if today.month == 12:
            end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        return start, end
    elif timeframe == "custom" and start_date and end_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            return start, end
        except ValueError as e:
            logger.error(f"Invalid date format: {e}")
            return None, None
    else:
        # Default to all time
        return None, None

@dashboard_bp.route('', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    try:
        user_id = get_jwt_identity()
        timeframe = request.args.get('timeframe', 'all')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        logger.info(f"Fetching dashboard data for user {user_id} with timeframe: {timeframe}")
        if timeframe == "custom":
            logger.info(f"Custom date range: {start_date} to {end_date}")

        start, end = get_date_range(timeframe, start_date, end_date)
        date_filter = []
        if start and end:
            date_filter = [Transaction.date >= start, Transaction.date <= end]

        # Get summary data
        summary_query = db.session.query(
            func.sum(Transaction.amount).filter(Transaction.type == 'expense').label('total_expenses'),
            func.sum(Transaction.amount).filter(Transaction.type == 'income').label('total_income')
        ).filter(Transaction.user_id == user_id, *date_filter)

        summary = summary_query.first()
        total_expenses = summary.total_expenses or 0
        total_income = summary.total_income or 0
        current_balance = total_income - total_expenses
        savings = max(0, current_balance)
        savings_rate = (savings / total_income * 100) if total_income > 0 else 0

        # Get recent transactions
        recent_transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            *date_filter
        ).order_by(Transaction.date.desc()).limit(5).all()

        # Get category breakdown
        category_breakdown = db.session.query(
            Category.name,
            func.sum(Transaction.amount).label('total')
        ).join(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'expense',
            *date_filter
        ).group_by(Category.name).all()

        # Get budget status
        budget_status = db.session.query(
            Category.name,
            Budget.amount.label('budget'),
            func.sum(Transaction.amount).label('spent')
        ).join(Budget).outerjoin(
            Transaction,
            and_(
                Transaction.category_id == Category.id,
                Transaction.user_id == user_id,
                *date_filter
            )
        ).filter(
            Budget.user_id == user_id
        ).group_by(Category.name, Budget.amount).all()

        # Get expense trends
        if db.engine.url.drivername == 'postgresql':
            month_label_expr = func.to_char(Transaction.date.cast(db.DateTime), 'YYYY-MM').label('month')
        else:
            # Default for SQLite
            month_label_expr = func.strftime('%Y-%m', Transaction.date).label('month')

        expense_trends = db.session.query(
            month_label_expr,
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'expense',
            *date_filter
        ).group_by('month').order_by('month').all()

        # Get income trends (NEW)
        income_trends = db.session.query(
            month_label_expr,
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'income',
            *date_filter
        ).group_by('month').order_by('month').all()

        response_data = {
            'summary': {
                'totalExpenses': total_expenses,
                'totalIncome': total_income,
                'currentBalance': current_balance,
                'savings': savings,
                'savingsRate': f"{savings_rate:.1f}%",
                'expenseTrend': calculate_trend(expense_trends),
                'incomeTrend': calculate_trend(income_trends, 'income'),
                'balanceTrend': calculate_balance_trend(current_balance, total_income)
            },
            'recentTransactions': [{
                'id': t.id,
                'description': t.description,
                'amount': t.amount,
                'type': t.type,
                'date': t.date.isoformat(),
                'category': t.category.name if t.category else None
            } for t in recent_transactions],
            'categoryBreakdown': [{
                'name': c.name,
                'total': c.total
            } for c in category_breakdown],
            'budgetStatus': [{
                'category': b.name,
                'budget': b.budget,
                'spent': b.spent or 0
            } for b in budget_status],
            'expenseTrends': [{
                'month': t.month,
                'total': t.total
            } for t in expense_trends],
            'incomeTrends': [{
                'month': t.month,
                'total': t.total
            } for t in income_trends]
        }

        logger.info(f"Successfully fetched dashboard data for user {user_id}")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Error fetching dashboard data: {str(e)}")
        return jsonify({'error': str(e)}), 500

def calculate_trend(trends, type='expense'):
    if not trends or len(trends) < 2:
        return "No trend data available"
    
    current = trends[-1].total
    previous = trends[-2].total
    
    if previous == 0:
        return "No previous data"
    
    change = ((current - previous) / previous) * 100
    
    if change > 5:
        return f"↑ {change:.1f}% increase"
    elif change < -5:
        return f"↓ {abs(change):.1f}% decrease"
    else:
        return "→ Stable"

def calculate_balance_trend(current_balance, total_income):
    if total_income == 0:
        return "No income data"
    
    savings_rate = (current_balance / total_income) * 100
    
    if savings_rate > 20:
        return f"↑ {savings_rate:.1f}% savings rate"
    elif savings_rate < 10:
        return f"↓ {savings_rate:.1f}% savings rate"
    else:
        return f"→ {savings_rate:.1f}% savings rate"

@dashboard_bp.route('/recent-transactions', methods=['GET'])
@jwt_required()
def get_recent_transactions():
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 5, type=int)
        
        transactions = Transaction.query.filter_by(user_id=user_id)\
            .order_by(Transaction.date.desc())\
            .limit(limit)\
            .all()
            
        return jsonify([t.to_dict() for t in transactions])
        
    except Exception as e:
        logger.error(f'Error fetching recent transactions: {str(e)}')
        return jsonify({'error': 'Failed to fetch recent transactions'}), 500

@dashboard_bp.route('/category-breakdown', methods=['GET'])
@jwt_required()
def get_category_breakdown():
    try:
        user_id = get_jwt_identity()
        
        # Get current month's transactions grouped by category
        today = datetime.utcnow()
        start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        breakdown = db.session.query(
            Category.name,
            Category.color,
            func.sum(Transaction.amount).label('total')
        ).join(
            Transaction,
            Transaction.category_id == Category.id
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'expense',
            Transaction.date >= start_of_month
        ).group_by(
            Category.name,
            Category.color
        ).all()
        
        total_expenses = sum(item.total for item in breakdown)
        
        result = [{
            'name': item.name,
            'color': item.color,
            'amount': item.total,
            'percentage': round((item.total / total_expenses * 100) if total_expenses > 0 else 0, 2)
        } for item in breakdown]
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f'Error fetching category breakdown: {str(e)}')
        return jsonify({'error': 'Failed to fetch category breakdown'}), 500

@dashboard_bp.route('/budget-status', methods=['GET'])
@jwt_required()
def get_budget_status():
    try:
        user_id = get_jwt_identity()
        
        # Get current month's start and end dates
        today = datetime.utcnow()
        start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Get active budgets and their spending
        budgets = db.session.query(
            Budget,
            Category.name.label('category_name'),
            func.coalesce(func.sum(Transaction.amount), 0).label('spent')
        ).join(
            Category,
            Budget.category_id == Category.id
        ).outerjoin(
            Transaction,
            db.and_(
                Transaction.category_id == Budget.category_id,
                Transaction.date >= start_of_month,
                Transaction.type == 'expense'
            )
        ).filter(
            Budget.user_id == user_id,
            Budget.start_date <= today,
            Budget.end_date >= today
        ).group_by(
            Budget.id,
            Category.name
        ).all()
        
        result = [{
            'category': budget.category_name,
            'limit': budget.Budget.amount,
            'spent': float(budget.spent),
            'percentage': round((float(budget.spent) / budget.Budget.amount * 100) if budget.Budget.amount > 0 else 0, 2)
        } for budget in budgets]
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f'Error fetching budget status: {str(e)}')
        return jsonify({'error': 'Failed to fetch budget status'}), 500