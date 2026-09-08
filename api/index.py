import sys
import os

# Add the 'api' directory to the Python path so absolute imports like 'from app.main import app' work correctly.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app
