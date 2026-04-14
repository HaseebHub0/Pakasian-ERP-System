import threading

_thread_local = threading.local()

def get_current_user():
    return getattr(_thread_local, 'current_user', None)

class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_local.current_user = getattr(request, 'user', None)
        response = self.get_response(request)
        # Clean up thread local for the next request in connection pooling
        if hasattr(_thread_local, 'current_user'):
            del _thread_local.current_user
        return response
