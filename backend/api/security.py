"""Security utilities for authentication and password hashing."""

import hashlib
from passlib.context import CryptContext

# Password hashing using pbkdf2 (pure Python, no compilation needed)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def _prehash_password(password: str) -> str:
    """
    Pre-hash password with SHA256 to normalize to 64 bytes.
    
    This ensures consistent behavior and adds an extra layer of security.
    The SHA256 hash is always 64 characters (hex encoded).
    
    Args:
        password: Raw password string
        
    Returns:
        SHA256 hash in hex format (64 characters)
    """
    return hashlib.sha256(password.encode()).hexdigest()


def hash_password(password: str) -> str:
    """
    Hash a password using SHA256 + PBKDF2.
    
    Args:
        password: Raw password string
        
    Returns:
        PBKDF2 hash of the SHA256-prehashed password
    """
    # First normalize with SHA256, then PBKDF2
    prehashed = _prehash_password(password)
    return pwd_context.hash(prehashed)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its PBKDF2 hash.
    
    Args:
        plain_password: Raw password to verify
        hashed_password: PBKDF2 hash to check against
        
    Returns:
        True if password matches, False otherwise
    """
    # Pre-hash with same method before verification
    prehashed = _prehash_password(plain_password)
    return pwd_context.verify(prehashed, hashed_password)



