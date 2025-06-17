from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.schedulers import SchedulerNotRunningError
from tasks import check_budget_alerts, generate_daily_reports, cleanup_old_notifications, cleanup_unverified_users
import logging

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()

def init_scheduler(app):
    # Add jobs
    scheduler.add_job(func=check_budget_alerts, trigger="interval", hours=24, id="Check budget alerts")
    scheduler.add_job(func=generate_daily_reports, trigger="interval", hours=24, id="Generate daily reports")
    scheduler.add_job(func=cleanup_old_notifications, trigger="interval", hours=24, id="Cleanup old notifications")
    scheduler.add_job(func=cleanup_unverified_users, trigger="interval", minutes=1, id="Cleanup unverified users")
    
    # Start the scheduler
    scheduler.start()
    logger.info("Scheduler started successfully")
    
    # Register shutdown handler
    @app.teardown_appcontext
    def shutdown_scheduler(exception=None):
        try:
            if scheduler.running:
                scheduler.shutdown()
                logger.info("Scheduler shut down successfully")
        except SchedulerNotRunningError:
            pass  # Ignore if scheduler is already stopped
        except Exception as e:
            logger.error(f"Error shutting down scheduler: {str(e)}") 