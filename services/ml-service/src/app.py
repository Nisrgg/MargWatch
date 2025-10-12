"""
ML Service Main Application
"""
import logging
from flask import Flask
from flask_cors import CORS

from .config.settings import SERVICE_CONFIG, LOGGING_CONFIG
from .routes.ml_routes import ml_bp

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOGGING_CONFIG['level']),
    format=LOGGING_CONFIG['format']
)

logger = logging.getLogger(__name__)

def create_app() -> Flask:
    """Create and configure Flask application"""
    app = Flask(__name__)
    
    # Enable CORS
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(ml_bp)
    
    # Add root health check
    @app.route('/health', methods=['GET'])
    def root_health():
        return {'status': 'healthy', 'service': 'ml-service'}
    
    logger.info("🤖 ML Service application created successfully")
    return app

def main():
    """Main application entry point"""
    print("🤖 Starting Enhanced ML Service...")
    print(f"📊 Health Check: http://localhost:{SERVICE_CONFIG['port']}/health")
    print(f"🔮 Prediction: http://localhost:{SERVICE_CONFIG['port']}/api/ml/predict")
    print(f"📦 Batch Prediction: http://localhost:{SERVICE_CONFIG['port']}/api/ml/predict/batch")
    print(f"ℹ️ Model Info: http://localhost:{SERVICE_CONFIG['port']}/api/ml/model/info")
    
    app = create_app()
    
    try:
        app.run(
            host=SERVICE_CONFIG['host'],
            port=SERVICE_CONFIG['port'],
            debug=SERVICE_CONFIG['debug']
        )
    except Exception as e:
        logger.error(f"❌ Failed to start ML service: {e}")
        exit(1)

if __name__ == '__main__':
    main()
