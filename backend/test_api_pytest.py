"""
Smart Home IoT API - Pytest Test Suite

Run tests with: pytest backend/test_api_pytest.py -v

Requirements:
- pytest: pip install pytest httpx
- Backend running: python main.py
- MQTT broker running
- Simulator running (optional, but recommended): python Simulate/simulate_esp32.py
"""

import pytest
import httpx
import time

BASE_URL = "http://localhost:8000"

# Test data
TEST_DATA = {
    "token": None,
    "light_id": None,
    "fan_id": None,
    "lock_id": None,
    "mode_id": None
}


@pytest.fixture(scope="session")
def http_client():
    """Create HTTP client for testing"""
    return httpx.Client(base_url=BASE_URL, timeout=10.0)


class TestHealth:
    """Test server health"""
    
    def test_server_is_running(self, http_client):
        """Verify server is running"""
        response = http_client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_login_success(self, http_client):
        """Test successful login"""
        response = http_client.post(
            "/api/v1/auth/login",
            json={
                "username": "admin",
                "password": "admin123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["username"] == "admin"
        
        # Store token for other tests
        TEST_DATA["token"] = data["access_token"]
    
    def test_login_failure(self, http_client):
        """Test failed login"""
        response = http_client.post(
            "/api/v1/auth/login",
            json={
                "username": "admin",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 400
    
    def test_get_user_info(self, http_client):
        """Test getting current user info"""
        token = TEST_DATA["token"]
        response = http_client.get(f"/api/v1/auth/me?token={token}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["username"] == "admin"
    
    def test_invalid_token(self, http_client):
        """Test invalid token rejection"""
        response = http_client.get("/api/v1/auth/me?token=invalid_token")
        assert response.status_code == 401


class TestDeviceManagement:
    """Test device CRUD operations"""
    
    def test_create_light_device(self, http_client):
        """Test creating a light device"""
        token = TEST_DATA["token"]
        response = http_client.post(
            f"/api/v1/devices/?token={token}",
            json={
                "name": "Living Room Light",
                "device_type": "LIGHT",
                "base_topic": "home/1/1",
                "settings": {"brightness": 100, "color": "white"}
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Living Room Light"
        assert data["device_type"] == "LIGHT"
        assert data["owner_id"] == 1
        
        TEST_DATA["light_id"] = data["id"]
    
    def test_create_fan_device(self, http_client):
        """Test creating a fan device"""
        token = TEST_DATA["token"]
        response = http_client.post(
            f"/api/v1/devices/?token={token}",
            json={
                "name": "Bedroom Fan",
                "device_type": "FAN",
                "base_topic": "home/1/2"
            }
        )
        assert response.status_code == 200
        data = response.json()
        TEST_DATA["fan_id"] = data["id"]
    
    def test_create_door_lock_device(self, http_client):
        """Test creating a door lock device"""
        token = TEST_DATA["token"]
        response = http_client.post(
            f"/api/v1/devices/?token={token}",
            json={
                "name": "Front Door Lock",
                "device_type": "DOOR_LOCK",
                "base_topic": "home/1/3"
            }
        )
        assert response.status_code == 200
        data = response.json()
        TEST_DATA["lock_id"] = data["id"]
    
    def test_list_devices(self, http_client):
        """Test listing devices"""
        token = TEST_DATA["token"]
        response = http_client.get(f"/api/v1/devices/?token={token}")
        assert response.status_code == 200
        devices = response.json()
        assert len(devices) >= 3
        assert any(d["device_type"] == "LIGHT" for d in devices)
        assert any(d["device_type"] == "FAN" for d in devices)
    
    def test_get_device_by_id(self, http_client):
        """Test getting device by ID"""
        token = TEST_DATA["token"]
        device_id = TEST_DATA["light_id"]
        response = http_client.get(f"/api/v1/devices/{device_id}?token={token}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == device_id
        assert data["name"] == "Living Room Light"
    
    def test_update_device(self, http_client):
        """Test updating device"""
        token = TEST_DATA["token"]
        device_id = TEST_DATA["light_id"]
        response = http_client.put(
            f"/api/v1/devices/{device_id}?token={token}",
            json={
                "name": "Updated Living Room Light",
                "settings": {"brightness": 80, "color": "warm"}
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Living Room Light"
    
    def test_device_not_found(self, http_client):
        """Test getting non-existent device"""
        token = TEST_DATA["token"]
        response = http_client.get(f"/api/v1/devices/99999?token={token}")
        assert response.status_code == 404


class TestDeviceControl:
    """Test device control via MQTT"""
    
    def test_turn_on_device(self, http_client):
        """Test turning on device"""
        token = TEST_DATA["token"]
        device_id = TEST_DATA["fan_id"]
        response = http_client.post(
            f"/api/v1/device-control/{device_id}/turn-on?token={token}"
        )
        assert response.status_code == 200
        assert response.json()["success"] is True
    
    def test_turn_off_device(self, http_client):
        """Test turning off device"""
        token = TEST_DATA["token"]
        device_id = TEST_DATA["fan_id"]
        response = http_client.post(
            f"/api/v1/device-control/{device_id}/turn-off?token={token}"
        )
        assert response.status_code == 200
        assert response.json()["success"] is True
    
    def test_set_brightness(self, http_client):
        """Test setting brightness"""
        token = TEST_DATA["token"]
        device_id = TEST_DATA["light_id"]
        response = http_client.post(
            f"/api/v1/device-control/{device_id}/set-brightness?token={token}&brightness=75"
        )
        assert response.status_code == 200
        assert response.json()["success"] is True
        assert response.json()["value"] == 75
    
    def test_set_invalid_brightness(self, http_client):
        """Test setting invalid brightness value"""
        token = TEST_DATA["token"]
        device_id = TEST_DATA["light_id"]
        response = http_client.post(
            f"/api/v1/device-control/{device_id}/set-brightness?token={token}&brightness=150"
        )
        assert response.status_code == 400
    
    def test_set_color(self, http_client):
        """Test setting color"""
        token = TEST_DATA["token"]
        device_id = TEST_DATA["light_id"]
        response = http_client.post(
            f"/api/v1/device-control/{device_id}/set-color?token={token}&color=FF0000"
        )
        assert response.status_code == 200
        assert response.json()["success"] is True
    
    def test_get_device_status(self, http_client):
        """Test getting device status"""
        token = TEST_DATA["token"]
        device_id = TEST_DATA["fan_id"]
        
        # Turn on first
        http_client.post(
            f"/api/v1/device-control/{device_id}/turn-on?token={token}"
        )
        
        # Give MQTT a moment to process
        time.sleep(0.5)
        
        # Get status
        response = http_client.get(
            f"/api/v1/device-control/{device_id}/status?token={token}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["device_id"] == device_id
        assert "state" in data
        assert "supported_actions" in data
    
    def test_get_supported_actions(self, http_client):
        """Test getting supported actions for device"""
        token = TEST_DATA["token"]
        device_id = TEST_DATA["fan_id"]
        response = http_client.get(
            f"/api/v1/device-control/{device_id}/supported-actions?token={token}"
        )
        assert response.status_code == 200
        data = response.json()
        assert "supported_actions" in data
        assert "turn_on" in data["supported_actions"]
        assert "turn_off" in data["supported_actions"]
    
    def test_unsupported_action(self, http_client):
        """Test attempting unsupported action on device"""
        token = TEST_DATA["token"]
        device_id = TEST_DATA["fan_id"]
        response = http_client.post(
            f"/api/v1/device-control/{device_id}/action?token={token}",
            json={"action": "set_color", "value": "FF0000"}
        )
        assert response.status_code == 400


class TestModes:
    """Test automation modes"""
    
    def test_create_mode(self, http_client):
        """Test creating automation mode"""
        token = TEST_DATA["token"]
        light_id = TEST_DATA["light_id"]
        fan_id = TEST_DATA["fan_id"]
        lock_id = TEST_DATA["lock_id"]
        
        response = http_client.post(
            f"/api/v1/modes/?token={token}",
            json={
                "name": "Good Night Mode",
                "description": "Turn off lights and fan, lock door",
                "actions": [
                    {"device_id": light_id, "action": "turn_off", "value": None},
                    {"device_id": fan_id, "action": "turn_off", "value": None},
                    {"device_id": lock_id, "action": "lock", "value": None}
                ],
                "is_active": False
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Good Night Mode"
        assert len(data["actions"]) == 3
        
        TEST_DATA["mode_id"] = data["id"]
    
    def test_list_modes(self, http_client):
        """Test listing modes"""
        token = TEST_DATA["token"]
        response = http_client.get(f"/api/v1/modes/?token={token}")
        assert response.status_code == 200
        modes = response.json()
        assert len(modes) >= 1
    
    def test_get_mode_by_id(self, http_client):
        """Test getting mode by ID"""
        token = TEST_DATA["token"]
        mode_id = TEST_DATA["mode_id"]
        response = http_client.get(f"/api/v1/modes/{mode_id}?token={token}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == mode_id
    
    def test_update_mode(self, http_client):
        """Test updating mode"""
        token = TEST_DATA["token"]
        mode_id = TEST_DATA["mode_id"]
        response = http_client.put(
            f"/api/v1/modes/{mode_id}?token={token}",
            json={
                "name": "Sleep Mode",
                "description": "Updated description"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Sleep Mode"
    
    def test_activate_mode(self, http_client):
        """Test activating mode"""
        token = TEST_DATA["token"]
        mode_id = TEST_DATA["mode_id"]
        response = http_client.post(
            f"/api/v1/modes/{mode_id}/activate?token={token}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is True
    
    def test_deactivate_mode(self, http_client):
        """Test deactivating mode"""
        token = TEST_DATA["token"]
        mode_id = TEST_DATA["mode_id"]
        response = http_client.post(
            f"/api/v1/modes/{mode_id}/deactivate?token={token}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is False


class TestIntegration:
    """Integration tests"""
    
    def test_complete_workflow(self, http_client):
        """Test complete workflow: login -> create -> control -> mode -> activate"""
        token = TEST_DATA["token"]
        
        # Create device
        response = http_client.post(
            f"/api/v1/devices/?token={token}",
            json={
                "name": "Integration Test Light",
                "device_type": "LIGHT",
                "base_topic": "integration/test"
            }
        )
        assert response.status_code == 200
        device_id = response.json()["id"]
        
        # Control device
        response = http_client.post(
            f"/api/v1/device-control/{device_id}/turn-on?token={token}"
        )
        assert response.status_code == 200
        
        # Create mode with that device
        response = http_client.post(
            f"/api/v1/modes/?token={token}",
            json={
                "name": "Integration Test Mode",
                "actions": [{"device_id": device_id, "action": "turn_off", "value": None}],
                "is_active": False
            }
        )
        assert response.status_code == 200
        mode_id = response.json()["id"]
        
        # Activate mode
        response = http_client.post(
            f"/api/v1/modes/{mode_id}/activate?token={token}"
        )
        assert response.status_code == 200


if __name__ == "__main__":
    """Run tests with pytest"""
    pytest.main([__file__, "-v", "-s"])
