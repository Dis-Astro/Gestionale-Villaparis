"""
Villa Paris Gestionale - API Tests
Tests for clienti, eventi, report APIs with secondo contatto fields
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000').rstrip('/')


class TestHealthAndBasicAPIs:
    """Basic health check tests"""
    
    def test_dashboard_loads(self):
        """Dashboard page loads correctly"""
        response = requests.get(f"{BASE_URL}/dashboard")
        assert response.status_code == 200
    
    def test_clienti_api_list(self):
        """GET /api/clienti returns list of clients"""
        response = requests.get(f"{BASE_URL}/api/clienti")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_eventi_api_list(self):
        """GET /api/eventi returns list of events"""
        response = requests.get(f"{BASE_URL}/api/eventi")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestClientiCRUD:
    """Test CRUD operations for clienti with secondo contatto fields"""
    
    def test_create_client_basic(self):
        """POST /api/clienti creates a new client"""
        payload = {
            "nome": "TEST_BasicClient",
            "cognome": "TestSurname",
            "telefono": "111-222-3333"
        }
        response = requests.post(
            f"{BASE_URL}/api/clienti",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["nome"] == "TEST_BasicClient"
        assert "id" in data
    
    def test_create_client_with_secondo_contatto(self):
        """POST /api/clienti creates client with secondo contatto data"""
        payload = {
            "nome": "TEST_ClienteSecondo",
            "cognome": "Rossi",
            "telefono": "333-444-5555",
            "email": "test.secondo@test.com",
            "canalePrimoContatto": "social",
            "secondoContattoNome": "Maria Verdi",
            "secondoContattoTelefono": "333-666-7777",
            "secondoContattoEmail": "maria.secondo@test.com"
        }
        response = requests.post(
            f"{BASE_URL}/api/clienti",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 201
        data = response.json()
        
        # Verify secondo contatto fields saved correctly
        assert data["secondoContattoNome"] == "Maria Verdi"
        assert data["secondoContattoTelefono"] == "333-666-7777"
        assert data["secondoContattoEmail"] == "maria.secondo@test.com"
        assert data["canalePrimoContatto"] == "social"
    
    def test_create_client_requires_nome(self):
        """POST /api/clienti requires nome field"""
        payload = {"cognome": "OnlyCognome"}
        response = requests.post(
            f"{BASE_URL}/api/clienti",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
    
    def test_get_client_by_id(self):
        """GET /api/clienti?id=X returns single client"""
        # First create a client
        create_response = requests.post(
            f"{BASE_URL}/api/clienti",
            json={"nome": "TEST_GetById", "secondoContattoNome": "Partner"},
            headers={"Content-Type": "application/json"}
        )
        client_id = create_response.json()["id"]
        
        # Get by ID
        response = requests.get(f"{BASE_URL}/api/clienti?id={client_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["nome"] == "TEST_GetById"
        assert data["secondoContattoNome"] == "Partner"
    
    def test_update_client(self):
        """PUT /api/clienti?id=X updates client"""
        # First create a client
        create_response = requests.post(
            f"{BASE_URL}/api/clienti",
            json={"nome": "TEST_ToUpdate"},
            headers={"Content-Type": "application/json"}
        )
        client_id = create_response.json()["id"]
        
        # Update with secondo contatto
        update_payload = {
            "nome": "TEST_Updated",
            "secondoContattoNome": "New Partner",
            "secondoContattoTelefono": "999-888-7777"
        }
        response = requests.put(
            f"{BASE_URL}/api/clienti?id={client_id}",
            json=update_payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["nome"] == "TEST_Updated"
        assert data["secondoContattoNome"] == "New Partner"
    
    def test_delete_client(self):
        """DELETE /api/clienti?id=X removes client"""
        # First create a client
        create_response = requests.post(
            f"{BASE_URL}/api/clienti",
            json={"nome": "TEST_ToDelete"},
            headers={"Content-Type": "application/json"}
        )
        client_id = create_response.json()["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/clienti?id={client_id}")
        assert response.status_code == 204
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/clienti?id={client_id}")
        assert get_response.status_code == 404


class TestReportAPIs:
    """Test report and stats APIs"""
    
    def test_report_stats_api(self):
        """GET /api/report/stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/report/stats?year=2026")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "year" in data
        assert "monthly" in data
        assert "byTipo" in data
        assert "totals" in data
        assert isinstance(data["monthly"], list)
    
    def test_report_excel_download(self):
        """GET /api/report/azienda.xlsx returns valid Excel file"""
        response = requests.get(f"{BASE_URL}/api/report/azienda.xlsx")
        assert response.status_code == 200
        
        # Check content type
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheet" in content_type or "octet-stream" in content_type
        
        # Check content disposition
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp
        assert ".xlsx" in content_disp
        
        # Check response has binary content
        assert len(response.content) > 100  # Should be more than 100 bytes


class TestEventiAPI:
    """Test eventi API"""
    
    def test_eventi_list(self):
        """GET /api/eventi returns events with client data"""
        response = requests.get(f"{BASE_URL}/api/eventi")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # If there are events, check structure
        if len(data) > 0:
            event = data[0]
            assert "id" in event
            assert "titolo" in event
            assert "tipo" in event


# Cleanup test data after tests
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data():
    """Clean up TEST_ prefixed data after all tests"""
    yield
    # Cleanup after tests
    try:
        response = requests.get(f"{BASE_URL}/api/clienti")
        if response.status_code == 200:
            clients = response.json()
            for client in clients:
                if client.get("nome", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/clienti?id={client['id']}")
    except Exception:
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
