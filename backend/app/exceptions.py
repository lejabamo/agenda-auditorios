class AppError(Exception):
    """Base class for domain exceptions"""
    pass

class AgendaConflictError(AppError):
    """Raised when there is an overlap or availability issue"""
    pass

class ValidationError(AppError):
    """Raised when input data invalidates business rules"""
    pass

class ResourceNotFoundError(AppError):
    """Raised when a requested resource is not found"""
    pass
