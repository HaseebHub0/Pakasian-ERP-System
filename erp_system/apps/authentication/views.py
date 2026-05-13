from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import SystemUser, ApiToken
from .serializers import LoginSerializer, SystemUserSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']

            try:
                user = SystemUser.objects.get(username__iexact=username)
            except SystemUser.DoesNotExist:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
                
            if user.check_password(password) and user.is_active:
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                
                # Store access token in DB
                ApiToken.objects.create(
                    user_id=user,
                    token=access_token,
                    expiry_time=timezone.now() + timedelta(hours=8)
                )

                user_data = {
                    'id': str(user.id),
                    'username': user.username,
                    'role_name': user.role_id.role_name if user.role_id else None,
                    'permissions': SystemUserSerializer(user).data.get('role_permissions', [])
                }

                return Response({
                    'access_token': access_token,
                    'refresh_token': str(refresh),
                    'user': user_data
                }, status=status.HTTP_200_OK)
            return Response({'error': 'Invalid credentials or inactive account'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Delete token from the ApiToken table based on current authorization header
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token_str = auth_header.split(' ')[1]
                ApiToken.objects.filter(user_id=request.user, token=token_str).delete()
            
            # Optionally blacklist the refresh token
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                
            return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        except TokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            refresh = RefreshToken(refresh_token)
            # Find the user using the payload's user_id claim
            user_id = refresh.payload.get('user_id')
            user = SystemUser.objects.get(pk=user_id)
            
            new_access_token = str(refresh.access_token)
            
            # Store new access token in DB
            ApiToken.objects.create(
                user_id=user,
                token=new_access_token,
                expiry_time=timezone.now() + timedelta(hours=8)
            )
            
            return Response({
                'access_token': new_access_token,
            }, status=status.HTTP_200_OK)
        except (TokenError, SystemUser.DoesNotExist):
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_401_UNAUTHORIZED)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = SystemUserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
