import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User

logger = logging.getLogger("app.cleanup")

def cleanup_expired_guests(db: Session, expiry_hours: int = 24) -> int:
    """
    Deletes guest users created more than `expiry_hours` ago.
    PostgreSQL cascading foreign keys automatically clean up all associated
    resumes, resume_analysis, interviews, questions, responses, and feedback.
    """
    try:
        cutoff = datetime.utcnow() - timedelta(hours=expiry_hours)
        expired_guests = db.query(User).filter(
            User.is_guest == True,
            User.created_at < cutoff,
        ).all()

        count = len(expired_guests)
        if count > 0:
            for guest in expired_guests:
                db.delete(guest)
            db.commit()
            logger.info(f"Cleaned up {count} expired guest account(s) older than {expiry_hours}h.")
        return count
    except Exception as e:
        db.rollback()
        logger.error(f"Error during guest accounts cleanup: {e}", exc_info=True)
        return 0
